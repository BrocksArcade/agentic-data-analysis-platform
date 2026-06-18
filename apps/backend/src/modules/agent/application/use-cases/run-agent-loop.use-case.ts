import { Injectable, Logger } from '@nestjs/common';
import { Message, SessionMemory, ChartContract } from '@platform/shared';
import { PromptBuilderService, VisualizationIntention } from '../../infrastructure/prompt/prompt-builder.service';
import { OllamaService } from '../../infrastructure/ollama/ollama.service';
import { ToolsRegistry } from '../../infrastructure/tools/tools.registry';
import { DuckDBService } from '../../../data/infrastructure/duckdb/duckdb.service';
import { GenerateSummaryUseCase } from './generate-summary.use-case';
import { ChartMapperService } from '../services/chart-mapper.service';

interface ExplorationResult {
  schema: string;
  queryResults: Record<string, any>[];
  rowCount: number;
  notes: string;
  directAnswer?: ChartContract;
}

@Injectable()
export class RunAgentLoopUseCase {
  private readonly logger = new Logger(RunAgentLoopUseCase.name);
  private readonly maxExplorationIterations = 7;
  private readonly maxSqlFailures = 3;

  constructor(
    private promptBuilder: PromptBuilderService,
    private ollamaService: OllamaService,
    private toolsRegistry: ToolsRegistry,
    private duckdbService: DuckDBService,
    private generateSummary: GenerateSummaryUseCase,
    private chartMapper: ChartMapperService,
  ) {}

  async execute(
    session: SessionMemory,
    question: string,
    priorSummary?: string,
    onThinking?: (action: string, iteration: number) => void,
  ): Promise<ChartContract> {
    this.logger.log(`[PIPELINE] START question="${question}" table=${session.tableName}`);
    session.messages.push({ role: 'user', content: question });

    // ── Phase 1: Data Exploration (qwen2.5:7b) ────────────────────────────
    if (onThinking) onThinking('exploring_data', 0);
    const exploration = await this.runExplorationPhase(session, question, priorSummary, onThinking);

    if (exploration.directAnswer) {
      this.logger.log(`[PIPELINE] direct answer from Phase 1 (conversational query)`);
      await this.generateSummary.execute(session, session.messages);
      return exploration.directAnswer;
    }

    // Always guarantee real schema in exploration before Phase 2.
    // Phase 1 may have skipped describe_schema, so we fetch it directly here.
    await this.ensureRealSchema(exploration, session.tableName);

    // ── Phase 2: Visualization Intention (gemma4:e4b with thinking) ───────
    if (onThinking) onThinking('building_intention', 0);
    const intention = await this.buildVisualizationIntention(question, session.tableName, exploration);

    if (!intention) {
      this.logger.error(`[PIPELINE] Phase 2 failed to produce intention — falling back`);
      return this.buildFallbackChart(exploration, question);
    }

    // ── Phase 3: Chart Generation (qwen2.5:7b) ────────────────────────────
    if (onThinking) onThinking('generating_chart', 0);
    const chart = await this.generateChart(intention, session);

    await this.generateSummary.execute(session, session.messages);
    return chart;
  }

  // ── Phase 1 ──────────────────────────────────────────────────────────────

  private async runExplorationPhase(
    session: SessionMemory,
    question: string,
    priorSummary: string | undefined,
    onThinking?: (action: string, iteration: number) => void,
  ): Promise<ExplorationResult> {
    const explorationMessages: Message[] = [{ role: 'user', content: question }];
    const systemPrompt = this.promptBuilder.buildExplorationPrompt(session, priorSummary);

    let iteration = 0;
    let sqlFailures = 0;
    let lastToolName: string | null = null;
    let lastToolInput: string | null = null;
    let duplicateCount = 0;

    while (iteration < this.maxExplorationIterations) {
      iteration++;
      this.logger.log(`[PHASE1] ── iteration ${iteration}/${this.maxExplorationIterations} ──`);

      let response: string;
      try {
        response = await this.ollamaService.chat(systemPrompt, explorationMessages, {
          model: this.ollamaService.explorationModel,
        });
        this.logger.log(`[PHASE1] qwen responded (${response.length} chars)`);
      } catch (err: any) {
        this.logger.error(`[PHASE1] Ollama call failed: ${err.message}`);
        return { schema: '', queryResults: [], rowCount: 0, notes: err.message };
      }

      let toolCall: any;
      try {
        const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        toolCall = JSON.parse(cleaned);
      } catch {
        this.logger.warn(`[PHASE1] JSON parse failed — retrying`);
        explorationMessages.push({ role: 'assistant', content: response });
        explorationMessages.push({ role: 'tool', content: 'Invalid JSON. Return only valid JSON with one tool call.' });
        continue;
      }

      explorationMessages.push({ role: 'assistant', content: response });

      const toolName: string = toolCall.name;
      const toolInput: Record<string, any> = toolCall.input || {};
      const toolInputStr = JSON.stringify(toolInput);

      if (toolName === lastToolName && toolInputStr === lastToolInput) {
        duplicateCount++;
        if (duplicateCount >= 2) {
          this.logger.warn(`[PHASE1] stuck in duplicate loop — breaking early`);
          break;
        }
        explorationMessages.push({
          role: 'tool',
          content: `You already called "${toolName}" with the same input. Use submit_data to submit what you have found.`,
        });
        continue;
      }
      duplicateCount = 0;
      lastToolName = toolName;
      lastToolInput = toolInputStr;

      if (onThinking) onThinking(toolName, iteration);

      // Conversational: qwen decided it's a text reply — return directly
      if (toolName === 'final_answer') {
        const contract = toolInput as ChartContract;
        if (contract.chartType === 'text') {
          this.logger.log(`[PHASE1] conversational final_answer — skipping Phases 2 & 3`);
          session.messages.push(...explorationMessages.slice(1));
          return { schema: '', queryResults: [], rowCount: 0, notes: '', directAnswer: contract };
        }
        // qwen produced a chart final_answer — extract rawData and treat as exploration done
        this.logger.log(`[PHASE1] qwen produced chart final_answer — promoting to exploration result`);
        session.messages.push(...explorationMessages.slice(1));
        return {
          schema: '',
          queryResults: contract.rawData ?? [],
          rowCount: contract.rawData?.length ?? 0,
          notes: contract.summary ?? '',
        };
      }

      // Exploration done — qwen submitted data
      if (toolName === 'submit_data') {
        this.logger.log(`[PHASE1] submit_data called — exploration complete`);
        session.messages.push(...explorationMessages.slice(1));
        return {
          schema: toolInput.schema ?? '',
          queryResults: toolInput.queryResults ?? [],
          rowCount: toolInput.rowCount ?? 0,
          notes: toolInput.notes ?? '',
        };
      }

      // Memory tools — persist and regenerate summary
      if (toolName === 'remember_mapping' || toolName === 'remember_fact') {
        const toolResult = await this.toolsRegistry.executeTool(toolName, toolInput, session);
        if (toolResult.success) {
          await this.generateSummary.execute(session, session.messages);
        }
        explorationMessages.push({ role: 'tool', content: JSON.stringify(toolResult) });
        continue;
      }

      // SQL failure tracking
      let toolResult: any;
      try {
        toolResult = await this.toolsRegistry.executeTool(toolName, toolInput, session);
      } catch (err: any) {
        toolResult = { success: false, error: err.message };
      }

      if (toolName === 'run_sql' && !toolResult.success) {
        sqlFailures++;
        this.logger.warn(`[PHASE1] SQL failure ${sqlFailures}/${this.maxSqlFailures}: ${toolResult.error}`);
        if (sqlFailures >= this.maxSqlFailures) {
          this.logger.error(`[PHASE1] max SQL failures — stopping exploration`);
          session.messages.push(...explorationMessages.slice(1));
          return { schema: '', queryResults: [], rowCount: 0, notes: `SQL failures: ${toolResult.error}` };
        }
      }

      explorationMessages.push({ role: 'tool', content: JSON.stringify(this.sampleToolResult(toolResult)) });
    }

    // Max iterations reached — copy messages and return empty exploration
    this.logger.warn(`[PHASE1] max iterations reached without submit_data`);
    session.messages.push(...explorationMessages.slice(1));
    return { schema: '', queryResults: [], rowCount: 0, notes: 'Exploration reached iteration limit' };
  }

  /**
   * Cap row arrays in a tool result before feeding it back to the model: it
   * only needs 2-3 rows to understand the shape, never the full set. The real
   * data is re-queried in Phase 3 for the chart. Prevents 100+ rows from
   * ballooning the exploration prompt (the cause of ~100s exploration calls).
   */
  private readonly modelSampleRows = 3;
  private sampleToolResult(toolResult: any): any {
    if (toolResult && Array.isArray(toolResult.rows) && toolResult.rows.length > this.modelSampleRows) {
      const total = toolResult.count ?? toolResult.rows.length;
      return {
        ...toolResult,
        rows: toolResult.rows.slice(0, this.modelSampleRows),
        note: `showing ${this.modelSampleRows} of ${total} rows (full data is queried later for the chart)`,
      };
    }
    return toolResult;
  }

  // ── Phase 2 ──────────────────────────────────────────────────────────────

  private async buildVisualizationIntention(
    question: string,
    tableName: string,
    exploration: ExplorationResult,
  ): Promise<VisualizationIntention | null> {
    this.logger.log(`[PHASE2] calling ${this.ollamaService.thinkingModel} for visualization intention`);

    const intentionContext = this.promptBuilder.buildIntentionPrompt(question, tableName, exploration);

    let response: string;
    try {
      response = await this.ollamaService.chat(
        'You are a data visualization strategist. Output ONLY a JSON object — no explanation, no markdown.',
        [{ role: 'user', content: intentionContext }],
        // think disabled: the qwen thinking model is not a reasoning model, and
        // large thinking models (gemma4:e4b) OOM the RTX 3050's 4GB VRAM.
        { model: this.ollamaService.thinkingModel, think: false, timeoutMs: 180000 },
      );
      this.logger.log(`[PHASE2] thinking model responded (${response.length} chars)`);
      this.logger.debug(`[PHASE2] raw intention response: ${response}`);
    } catch (err: any) {
      this.logger.error(`[PHASE2] gemma call failed: ${err.message}`);
      return null;
    }

    // Strip thinking tags and extract JSON
    const stripped = response
      .replace(/<think>[\s\S]*?<\/think>/gi, '')
      .replace(/<thinking>[\s\S]*?<\/thinking>/gi, '')
      .trim();

    const jsonMatch = stripped.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      this.logger.error(`[PHASE2] no JSON found in gemma response: ${stripped.slice(0, 300)}`);
      return null;
    }

    try {
      const intention = JSON.parse(jsonMatch[0]) as VisualizationIntention;
      this.logger.log(`[PHASE2] intention: chartType=${intention.chartType} title="${intention.title}"`);
      this.logger.debug(`[PHASE2] sql: ${intention.sql}`);
      return intention;
    } catch (err) {
      this.logger.error(`[PHASE2] JSON parse failed: ${jsonMatch[0].slice(0, 300)}`);
      return null;
    }
  }

  // ── Phase 3 ──────────────────────────────────────────────────────────────

  private async generateChart(
    intention: VisualizationIntention,
    session: SessionMemory,
  ): Promise<ChartContract> {
    let sqlResults: Record<string, any>[] = [];

    if (intention.sql) {
      this.logger.log(`[PHASE3] executing intention SQL: ${intention.sql}`);
      const result = await this.duckdbService.executeQuery(intention.sql, session.tableName);

      if ('data' in result) {
        sqlResults = result.data;
        this.logger.log(`[PHASE3] SQL returned ${sqlResults.length} rows`);
      } else {
        this.logger.warn(`[PHASE3] SQL failed: ${result.error} — attempting auto-fix`);
        const fixedSql = await this.fixSql(intention.sql, result.error, session.tableName);
        if (fixedSql) {
          this.logger.log(`[PHASE3] retrying with fixed SQL: ${fixedSql}`);
          intention.sql = fixedSql;
          const retry = await this.duckdbService.executeQuery(fixedSql, session.tableName);
          if ('data' in retry) {
            sqlResults = retry.data;
            this.logger.log(`[PHASE3] fixed SQL returned ${sqlResults.length} rows`);
          } else {
            this.logger.warn(`[PHASE3] fixed SQL also failed: ${retry.error}`);
          }
        }
      }
    }

    // Build the contract via the mapper: the model produces only a tiny
    // field→role mapping from a few sample rows, then the code shapes ALL rows.
    // The full result set is never fed to / re-emitted by the LLM.
    const contract = await this.chartMapper.buildContract(intention, sqlResults);
    this.logger.log(`[PHASE3] chart contract built: type=${contract.chartType} rows=${sqlResults.length}`);
    return contract;
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private async ensureRealSchema(
    exploration: ExplorationResult,
    tableName: string,
  ): Promise<void> {
    if (exploration.schema) return;
    try {
      const cols = await this.duckdbService.describeTable(tableName);
      exploration.schema = cols.map((c: any) => `${c.column_name}:${c.column_type}`).join(', ');
      if (!exploration.rowCount) {
        exploration.rowCount = await this.duckdbService.getRowCount(tableName);
      }
      this.logger.log(`[PIPELINE] injected real schema: ${exploration.schema}`);
    } catch (err: any) {
      this.logger.warn(`[PIPELINE] schema fetch failed: ${err.message}`);
    }
  }

  private async fixSql(
    brokenSql: string,
    error: string,
    tableName: string,
  ): Promise<string | null> {
    try {
      const cols = await this.duckdbService.describeTable(tableName);
      const fixerContext = this.promptBuilder.buildSqlFixerPrompt(brokenSql, error, cols, tableName);
      const response = await this.ollamaService.chat(
        'You are a SQL expert. Fix the broken SQL using the exact column names provided. Output only the SQL.',
        [{ role: 'user', content: fixerContext }],
        { model: this.ollamaService.codegenModel, timeoutMs: 30000 },
      );
      const cleaned = response
        .replace(/```sql\n?/gi, '')
        .replace(/```\n?/g, '')
        .trim();
      return cleaned || null;
    } catch (err: any) {
      this.logger.warn(`[PHASE3] SQL fixer failed: ${err.message}`);
      return null;
    }
  }

  private programmaticChart(
    intention: VisualizationIntention,
    rows: Record<string, any>[],
  ): ChartContract {
    if (!rows.length) {
      return {
        chartType: intention.chartType === 'text' ? 'text' : 'table',
        title: intention.title,
        xAxis: { label: intention.xAxisLabel, data: [] },
        series: [{ name: intention.seriesName, data: [] }],
        summary: intention.insights,
        rawData: [],
      };
    }

    const keys = Object.keys(rows[0]);
    const xKey = keys[0];
    const yKey = keys[1] ?? keys[0];

    return {
      chartType: intention.chartType,
      title: intention.title,
      xAxis: {
        label: intention.xAxisLabel || xKey,
        data: rows.map((r) => r[xKey]),
      },
      series: [{
        name: intention.seriesName || yKey,
        data: rows.map((r) => r[yKey]),
      }],
      summary: intention.insights,
      rawData: rows,
    };
  }

  private buildFallbackChart(exploration: ExplorationResult, question: string): ChartContract {
    if (exploration.queryResults.length > 0) {
      return this.programmaticChart(
        {
          chartType: 'table',
          title: 'Query Results',
          xAxisLabel: '',
          seriesName: '',
          sql: '',
          insights: exploration.notes || question,
        },
        exploration.queryResults,
      );
    }
    return this.createErrorChart('Could not determine visualization. Please rephrase your question.');
  }

  private createErrorChart(message: string): ChartContract {
    return {
      chartType: 'error',
      title: 'Error',
      xAxis: { label: '', data: [] },
      series: [],
      summary: message,
      rawData: [],
    };
  }
}
