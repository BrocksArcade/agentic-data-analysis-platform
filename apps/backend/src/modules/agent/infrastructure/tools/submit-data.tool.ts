import { Injectable } from '@nestjs/common';
import { BaseTool } from './base.tool';

@Injectable()
export class SubmitDataTool extends BaseTool {
  name = 'submit_data';

  async execute(input: Record<string, any>): Promise<any> {
    return this.handleSuccess({
      submitted: true,
      schema: input.schema ?? '',
      queryResults: input.queryResults ?? [],
      rowCount: input.rowCount ?? 0,
      notes: input.notes ?? '',
    });
  }
}
