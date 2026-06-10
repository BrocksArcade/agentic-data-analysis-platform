import { Injectable } from '@nestjs/common';
import { DuckDBService } from '../../../data/infrastructure/duckdb/duckdb.service';
import { BaseTool } from './base.tool';

@Injectable()
export class DescribeSchemaTool extends BaseTool {
  name = 'describe_schema';

  constructor(private duckdbService: DuckDBService) {
    super();
  }

  async execute(input: Record<string, any>): Promise<any> {
    try {
      const tableName = input.tableName;
      const schema = await this.duckdbService.describeTable(tableName);
      return this.handleSuccess({
        schema: schema.map((col) => ({
          name: col.column_name,
          type: col.column_type,
          nullable: col.null !== 'NO',
        })),
      });
    } catch (err: any) {
      return this.handleError(err);
    }
  }
}
