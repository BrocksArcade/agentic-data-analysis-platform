import { Injectable } from '@nestjs/common';
import { SessionMemory } from '@platform/shared';
import { BaseTool } from './base.tool';
import { DescribeSchemaTool } from './describe-schema.tool';
import { SampleDataTool } from './sample-data.tool';
import { GetRowCountTool } from './get-row-count.tool';
import { RunSqlTool } from './run-sql.tool';
import { RememberMappingTool } from './remember-mapping.tool';
import { RememberFactTool } from './remember-fact.tool';
import { FinalAnswerTool } from './final-answer.tool';
import { SubmitDataTool } from './submit-data.tool';

@Injectable()
export class ToolsRegistry {
  private tools: Map<string, BaseTool>;

  constructor(
    describeSchemaTool: DescribeSchemaTool,
    sampleDataTool: SampleDataTool,
    getRowCountTool: GetRowCountTool,
    runSqlTool: RunSqlTool,
    rememberMappingTool: RememberMappingTool,
    rememberFactTool: RememberFactTool,
    finalAnswerTool: FinalAnswerTool,
    submitDataTool: SubmitDataTool,
  ) {
    this.tools = new Map([
      ['describe_schema', describeSchemaTool],
      ['sample_data', sampleDataTool],
      ['get_row_count', getRowCountTool],
      ['run_sql', runSqlTool],
      ['remember_mapping', rememberMappingTool],
      ['remember_fact', rememberFactTool],
      ['final_answer', finalAnswerTool],
      ['submit_data', submitDataTool],
    ]);
  }

  async executeTool(
    toolName: string,
    input: Record<string, any>,
    session: SessionMemory,
  ): Promise<any> {
    const tool = this.tools.get(toolName);

    if (!tool) {
      return { success: false, error: `Unknown tool: ${toolName}` };
    }

    const toolInput = {
      ...input,
      tableName: session.tableName,
    };

    return tool.execute(toolInput, session);
  }
}
