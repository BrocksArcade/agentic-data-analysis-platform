import { Injectable } from '@nestjs/common';

interface ColumnMapping {
  userTerm: string;
  actualColumn: string;
}

interface PromptSessionMemory {
  tableName: string;
  fileName: string;
  userId: string;
  conversationId: string;
  columnMappings: ColumnMapping[];
  knownFacts: string[];
  userPreferences: string[];
}

export interface VisualizationIntention {
  chartType: 'bar' | 'line' | 'pie' | 'scatter' | 'table' | 'text';
  title: string;
  xAxisLabel: string;
  seriesName: string;
  sql: string;
  insights: string;
}

@Injectable()
export class PromptBuilderService {

  // ── Phase 1: Data Exploration (qwen2.5:7b) ────────────────────────────────
  buildExplorationPrompt(session: PromptSessionMemory, priorSummary?: string): string {
    return `# Data Exploration Agent

You gather raw data to answer the user's question. Output ONLY valid JSON — one tool call per response. No text, no markdown.

## MANDATORY STEP 1
Your FIRST response MUST be: {"name": "describe_schema", "input": {}}
No exceptions. Do not call any other tool first.

## CRITICAL RULES
- FIRST call: ALWAYS describe_schema
- final_answer is ONLY for greetings/file-info (chartType="text"). NEVER use final_answer for data questions.
- For data questions: describe_schema → run_sql → submit_data
- submit_data = your exit tool for all data questions

## Dataset
File: ${session.fileName}
Table: ${session.tableName}
Date: ${new Date().toISOString().split('T')[0]}

## Prior Context
${priorSummary || 'None'}

## Session Memory
${session.columnMappings.length ? session.columnMappings.map((m) => `"${m.userTerm}" = ${m.actualColumn}`).join(', ') : 'No mappings'}
${session.knownFacts.length ? session.knownFacts.map((f) => `- ${f}`).join('\n') : ''}

## Tools

{"name": "describe_schema", "input": {}}
  → ALWAYS call this first. Returns real column names and types.

{"name": "sample_data", "input": {"limit": 5}}
  → Sample rows to understand data shape.

{"name": "get_row_count", "input": {}}
  → Total row count.

{"name": "run_sql", "input": {"query": "SELECT col1, col2 FROM ${session.tableName} WHERE ... LIMIT 50"}}
  → Run SELECT. Use ONLY column names from describe_schema output. Always LIMIT.

{"name": "remember_mapping", "input": {"userTerm": "sales", "actualColumn": "revenue"}}
{"name": "remember_fact", "input": {"fact": "Dataset covers Jan–Mar 2024"}}

{"name": "submit_data", "input": {"schema": "col1:type, col2:type...", "queryResults": [...], "rowCount": 0, "notes": "summary"}}
  → Call when you have the data. This ends Phase 1.

{"name": "final_answer", "input": {"chartType": "text", "title": "", "xAxis": {"label": "", "data": []}, "series": [], "summary": "reply", "rawData": []}}
  → ONLY for: greetings, "what file did I upload?", non-data chat. chartType MUST be "text".

## Workflow for data questions
Step 1: {"name": "describe_schema", "input": {}}
Step 2: {"name": "run_sql", "input": {"query": "SELECT <real_columns> FROM ${session.tableName} ..."}}
Step 3: {"name": "submit_data", "input": {"schema": "<from step1>", "queryResults": [...from step2...], "rowCount": N, "notes": "what I found"}}
`;
  }

  // ── Phase 2: Visualization Intention (gemma4:e4b with think=true) ──────────
  buildIntentionPrompt(
    userQuestion: string,
    tableName: string,
    explorationData: { schema: string; queryResults: any[]; rowCount: number; notes: string },
  ): string {
    const resultsPreview = JSON.stringify(explorationData.queryResults.slice(0, 20), null, 2);
    return `You are a data visualization strategist. Given the user's question and the raw data below, decide EXACTLY what visualization to build.

## User Question
${userQuestion}

## Dataset
Table: ${tableName}
Row count: ${explorationData.rowCount}
Schema: ${explorationData.schema}
Exploration notes: ${explorationData.notes}

## Sample Query Results
${resultsPreview}

## Your Task
Think through:
- What is the user really asking to see?
- What chart type best represents this? (bar/line/pie/scatter/table/text)
- What should the x-axis represent and what label should it have?
- What is the data series and what should it be named?
- What SQL query will produce EXACTLY the right data for this chart from table "${tableName}"?
- What is the key insight this chart reveals?

## Output Format
Respond with ONLY this JSON object — no explanation, no markdown:
{
  "chartType": "bar|line|pie|scatter|table|text",
  "title": "descriptive chart title",
  "xAxisLabel": "label for x-axis",
  "seriesName": "name of the data series",
  "sql": "SELECT ... FROM ${tableName} ... LIMIT 100",
  "insights": "one sentence describing the key insight"
}`;
  }

  // ── Phase 3: Chart Formatting (qwen2.5:7b) ────────────────────────────────
  buildChartFormatterPrompt(
    intention: VisualizationIntention,
    sqlResults: any[],
  ): string {
    const resultsJson = JSON.stringify(sqlResults, null, 2);
    return `You are a JSON formatter. Convert the SQL results into a ChartContract JSON.
No explanation. Output ONLY valid JSON.

## Visualization Spec
Chart type: ${intention.chartType}
Title: ${intention.title}
X-axis label: ${intention.xAxisLabel}
Series name: ${intention.seriesName}
Insight: ${intention.insights}

## SQL Results
${resultsJson}

## Instructions
- xAxis.data: array of x-axis values (first column of each row)
- series[0].data: array of numeric values (second column of each row)
- For "table" chartType: put all rows in rawData, leave xAxis.data and series[0].data empty
- summary: the insight sentence above
- rawData: all SQL result rows as-is

## Required JSON Shape (output this exactly, filled in):
{"chartType":"${intention.chartType}","title":"${intention.title}","xAxis":{"label":"${intention.xAxisLabel}","data":[]},"series":[{"name":"${intention.seriesName}","data":[]}],"summary":"${intention.insights}","rawData":[]}`;
  }

  // ── SQL Fixer (Phase 3 retry) ─────────────────────────────────────────────
  buildSqlFixerPrompt(
    brokenSql: string,
    error: string,
    realColumns: Array<{ column_name: string; column_type: string }>,
    tableName: string,
  ): string {
    const schema = realColumns.map((c) => `${c.column_name} (${c.column_type})`).join(', ');
    return `Fix this SQL query so it runs against table "${tableName}".

Real columns in "${tableName}": ${schema}

Broken SQL:
${brokenSql}

Error:
${error}

Rules:
- Use ONLY the column names listed above — exact spelling, no guessing
- Keep the same SELECT intent (same aggregation, grouping, filtering)
- Always include LIMIT 100
- Output ONLY the fixed SQL — no explanation, no markdown`;
  }

  // ── Legacy: used by GenerateSummaryUseCase ─────────────────────────────────
  buildSystemPrompt(session: PromptSessionMemory, priorSummary?: string): string {
    return this.buildExplorationPrompt(session, priorSummary);
  }
}
