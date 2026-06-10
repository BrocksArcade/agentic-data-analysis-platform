import { Injectable } from '@nestjs/common';
import { DuckDBService } from '../../../data/infrastructure/duckdb/duckdb.service';
import { BaseTool } from './base.tool';

@Injectable()
export class SampleDataTool extends BaseTool {
  name = 'sample_data';

  constructor(private duckdbService: DuckDBService) {
    super();
  }

  async execute(input: Record<string, any>): Promise<any> {
    try {
      const tableName = input.tableName;
      const limit = input.limit || 5;
      const clampedLimit = Math.min(limit, 10);
      const data = await this.duckdbService.sampleData(tableName, clampedLimit);
      return this.handleSuccess({
        rows: data,
        count: data.length,
      });
    } catch (err: any) {
      return this.handleError(err);
    }
  }
}
