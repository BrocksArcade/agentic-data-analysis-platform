import { Injectable } from '@nestjs/common';
import { DuckDBService } from '../../../data/infrastructure/duckdb/duckdb.service';
import { BaseTool } from './base.tool';

@Injectable()
export class GetRowCountTool extends BaseTool {
  name = 'get_row_count';

  constructor(private duckdbService: DuckDBService) {
    super();
  }

  async execute(input: Record<string, any>): Promise<any> {
    try {
      const tableName = input.tableName;
      const count = await this.duckdbService.getRowCount(tableName);
      return this.handleSuccess({ count });
    } catch (err: any) {
      return this.handleError(err);
    }
  }
}
