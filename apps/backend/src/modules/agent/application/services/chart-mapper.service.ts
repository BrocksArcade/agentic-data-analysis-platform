import { Injectable, Logger } from '@nestjs/common';
import { ChartContract } from '@platform/shared';
import {
  PromptBuilderService,
  VisualizationIntention,
} from '../../infrastructure/prompt/prompt-builder.service';
import { OllamaService } from '../../infrastructure/ollama/ollama.service';

/**
 * How each chart field is filled from the SQL result columns.
 * The model produces ONLY this tiny spec from a few sample rows — it never
 * sees or re-emits the full result set. The code then applies the mapping to
 * every row, so chart generation is fast and deterministic regardless of how
 * many rows the query returned.
 */
export interface ChartMapping {
  xField: string;
  series: { name: string; field: string }[];
}

@Injectable()
export class ChartMapperService {
  private readonly logger = new Logger(ChartMapperService.name);
  private readonly sampleSize = 3;

  constructor(
    private promptBuilder: PromptBuilderService,
    private ollamaService: OllamaService,
  ) {}

  async buildContract(
    intention: VisualizationIntention,
    rows: Record<string, any>[],
  ): Promise<ChartContract> {
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

    const columns = Object.keys(rows[0]);

    // Tables don't need axis mapping — the whole row set is the payload.
    if (intention.chartType === 'table') {
      this.logger.log(`[MAPPER] table — passing ${rows.length} rows through (no LLM)`);
      return {
        chartType: 'table',
        title: intention.title,
        xAxis: { label: intention.xAxisLabel, data: [] },
        series: [{ name: intention.seriesName, data: [] }],
        summary: intention.insights,
        rawData: rows,
      };
    }

    const mapping = await this.resolveMapping(intention, columns, rows);
    return this.applyMapping(intention, mapping, rows);
  }

  /** Ask the model for a mapping from a small sample; fall back to a heuristic. */
  private async resolveMapping(
    intention: VisualizationIntention,
    columns: string[],
    rows: Record<string, any>[],
  ): Promise<ChartMapping> {
    const sample = rows.slice(0, this.sampleSize);
    try {
      const prompt = this.promptBuilder.buildChartMapperPrompt(intention, columns, sample);
      const response = await this.ollamaService.chat(
        'You map data columns to chart fields. Output ONLY a small JSON object — no data, no explanation.',
        [{ role: 'user', content: prompt }],
        { model: this.ollamaService.codegenModel, timeoutMs: 30000 },
      );
      const parsed = this.parseMapping(response);
      const validated = this.validateMapping(parsed, columns);
      if (validated) {
        this.logger.log(
          `[MAPPER] LLM mapping: x=${validated.xField} series=[${validated.series.map((s) => s.field).join(', ')}]`,
        );
        return validated;
      }
      this.logger.warn('[MAPPER] LLM mapping invalid — using heuristic');
    } catch (err: any) {
      this.logger.warn(`[MAPPER] LLM mapping failed (${err.message}) — using heuristic`);
    }
    return this.heuristicMapping(columns);
  }

  private parseMapping(response: string): any {
    const cleaned = response.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }

  /** Keep only fields that actually exist in the columns (guards hallucination). */
  private validateMapping(parsed: any, columns: string[]): ChartMapping | null {
    if (!parsed || typeof parsed.xField !== 'string') return null;
    if (!columns.includes(parsed.xField)) return null;

    const series = Array.isArray(parsed.series)
      ? parsed.series
          .filter((s: any) => s && typeof s.field === 'string' && columns.includes(s.field))
          .map((s: any) => ({ name: String(s.name || s.field), field: s.field }))
      : [];

    if (!series.length) return null;
    return { xField: parsed.xField, series };
  }

  /** First column → x, remaining columns → series. */
  private heuristicMapping(columns: string[]): ChartMapping {
    const xField = columns[0];
    const rest = columns.slice(1);
    const series = (rest.length ? rest : [columns[0]]).map((c) => ({ name: c, field: c }));
    return { xField, series };
  }

  private applyMapping(
    intention: VisualizationIntention,
    mapping: ChartMapping,
    rows: Record<string, any>[],
  ): ChartContract {
    return {
      chartType: intention.chartType,
      title: intention.title,
      xAxis: {
        label: intention.xAxisLabel || mapping.xField,
        data: rows.map((r) => r[mapping.xField]),
      },
      series: mapping.series.map((s) => ({
        name: s.name,
        data: rows.map((r) => r[s.field]),
      })),
      summary: intention.insights,
      rawData: rows,
    };
  }
}
