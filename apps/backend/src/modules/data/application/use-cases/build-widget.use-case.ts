import { Injectable, Logger } from '@nestjs/common';
import { WidgetSpec, ChartContract, SchemaColumn } from '@platform/shared';
import { DuckDBService } from '../../infrastructure/duckdb/duckdb.service';
import { describeToSchema } from '../services/column-kind.util';

@Injectable()
export class BuildWidgetUseCase {
  private readonly logger = new Logger(BuildWidgetUseCase.name);

  constructor(private duckdbService: DuckDBService) {}

  async execute(tableName: string, spec: WidgetSpec): Promise<ChartContract> {
    this.logger.log(`[BUILD-WIDGET] table=${tableName} chartType=${spec.chartType} xColumn=${spec.xColumn}`);

    try {
      // Step 1: Get schema
      const describeRows = await this.duckdbService.describeTable(tableName);
      const schema = describeToSchema(describeRows);
      const schemaMap = new Map(schema.map((col) => [col.name, col]));

      // Step 2: Validate columns
      if (!schemaMap.has(spec.xColumn)) {
        return this.errorContract(`X column "${spec.xColumn}" not found in schema`);
      }

      for (const yCol of spec.yColumns) {
        if (!schemaMap.has(yCol)) {
          return this.errorContract(`Y column "${yCol}" not found in schema`);
        }
      }

      // Step 3: Validate aggregation compatibility
      if (spec.aggregation) {
        const needsNumeric = ['sum', 'avg', 'min', 'max'].includes(spec.aggregation);
        if (needsNumeric) {
          for (const yCol of spec.yColumns) {
            const colKind = schemaMap.get(yCol)!.kind;
            if (colKind !== 'numeric') {
              return this.errorContract(
                `Aggregation "${spec.aggregation}" requires numeric Y columns, but "${yCol}" is ${colKind}`,
              );
            }
          }
        }
      }

      // Step 4: Build SQL
      const q = (id: string) => '"' + id.replace(/"/g, '""') + '"';
      const sql = this.buildSql(q, tableName, spec, schemaMap);

      // Step 5: Execute query
      const result = await this.duckdbService.executeQuery(sql, tableName);
      if ('error' in result) {
        return this.errorContract(`Query failed: ${result.error}`);
      }

      const rows = result.data;
      this.logger.log(`[BUILD-WIDGET] query returned ${rows.length} rows`);

      // Step 6: Shape into ChartContract
      return this.shapeContract(spec, rows);
    } catch (err: any) {
      this.logger.error(`[BUILD-WIDGET] exception: ${err.message}`);
      return this.errorContract(`Widget build failed: ${err.message}`);
    }
  }

  private buildSql(q: (id: string) => string, tableName: string, spec: WidgetSpec, schemaMap: Map<string, SchemaColumn>): string {
    const xCol = q(spec.xColumn);
    const yColumns = spec.yColumns.map((y) => q(y));

    // Determine if we need aggregation (GROUP BY)
    const needsAggregation = spec.aggregation && ['sum', 'avg', 'min', 'max'].includes(spec.aggregation);

    // Chart type rules
    if (spec.chartType === 'pie') {
      if (yColumns.length !== 1) {
        throw new Error('Pie charts require exactly one Y column');
      }
      if (!needsAggregation) {
        throw new Error('Pie charts require an aggregation function');
      }

      const aggFunc = this.aggToSql(spec.aggregation!);
      let sql = `SELECT ${xCol} AS x, ${aggFunc}(${yColumns[0]}) AS y FROM ${tableName} GROUP BY ${xCol} ORDER BY ${xCol}`;
      if (spec.limit) sql += ` LIMIT ${spec.limit}`;
      return sql;
    }

    if (spec.chartType === 'scatter') {
      if (!needsAggregation) {
        const cols = [xCol, ...yColumns].join(', ');
        let sql = `SELECT ${xCol} AS x, ${yColumns.map((y, i) => `${y} AS y${i}`).join(', ')} FROM ${tableName}`;
        if (spec.limit) sql += ` LIMIT ${spec.limit}`;
        return sql;
      }
    }

    if (spec.chartType === 'table') {
      const cols = [xCol, ...yColumns].join(', ');
      let sql = `SELECT ${cols} FROM ${tableName}`;
      if (spec.limit) sql += ` LIMIT ${spec.limit}`;
      return sql;
    }

    // bar, line: support both aggregated and raw
    if (needsAggregation && (spec.chartType === 'bar' || spec.chartType === 'line')) {
      const aggFunc = this.aggToSql(spec.aggregation!);
      const yParts = yColumns.map((y) => `${aggFunc}(${y}) AS ${y}`);
      let sql = `SELECT ${xCol} AS x, ${yParts.join(', ')} FROM ${tableName} GROUP BY ${xCol} ORDER BY ${xCol}`;
      if (spec.limit) sql += ` LIMIT ${spec.limit}`;
      return sql;
    }

    // bar/line raw
    const cols = [xCol, ...yColumns].join(', ');
    let sql = `SELECT ${xCol} AS x, ${yColumns.map((y, i) => `${y} AS y${i}`).join(', ')} FROM ${tableName}`;
    if (spec.limit) sql += ` LIMIT ${spec.limit}`;
    return sql;
  }

  private aggToSql(agg: string): string {
    const map: Record<string, string> = {
      sum: 'SUM',
      avg: 'AVG',
      min: 'MIN',
      max: 'MAX',
      count: 'COUNT',
    };
    return map[agg] || 'COUNT';
  }

  private shapeContract(spec: WidgetSpec, rows: any[]): ChartContract {
    if (!rows.length) {
      return {
        chartType: spec.chartType,
        title: `${spec.chartType} chart`,
        xAxis: { label: spec.xColumn, data: [] },
        series: spec.yColumns.map((y) => ({ name: y, data: [] })),
        summary: 'No data',
        rawData: [],
      };
    }

    const xData = rows.map((r) => r.x);
    const series = spec.yColumns.map((yCol, idx) => {
      const key = spec.yColumns.length === 1 ? 'y' : `y${idx}`;
      return {
        name: yCol,
        data: rows.map((r) => r[key] ?? r[yCol]),
      };
    });

    return {
      chartType: spec.chartType,
      title: `${spec.chartType} chart`,
      xAxis: { label: spec.xColumn, data: xData },
      series,
      summary: `${rows.length} rows`,
      rawData: rows,
    };
  }

  private errorContract(message: string): ChartContract {
    return {
      chartType: 'error',
      title: 'Widget Build Error',
      xAxis: { label: '', data: [] },
      series: [],
      summary: message,
      rawData: [],
    };
  }
}
