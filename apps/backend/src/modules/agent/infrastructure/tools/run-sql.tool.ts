import { Injectable } from '@nestjs/common';
import { DuckDBService } from '../../../data/infrastructure/duckdb/duckdb.service';
import { BaseTool } from './base.tool';

@Injectable()
export class RunSqlTool extends BaseTool {
  name = 'run_sql';

  constructor(private duckdbService: DuckDBService) {
    super();
  }

  async execute(input: Record<string, any>): Promise<any> {
    try {
      const tableName = input.tableName;
      const query = input.query;
      const result = await this.duckdbService.executeQuery(query, tableName);

      if ('error' in result) {
        return this.handleError(result.error);
      }

      return this.handleSuccess({
        rows: result.data,
        count: result.data.length,
      });
    } catch (err: any) {
      return this.handleError(err);
    }
  }
}
