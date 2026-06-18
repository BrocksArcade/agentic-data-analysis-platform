import { ColumnKind, SchemaColumn } from '@platform/shared';

const NUMERIC_TYPES = [
  'TINYINT', 'SMALLINT', 'INTEGER', 'BIGINT', 'HUGEINT',
  'UTINYINT', 'USMALLINT', 'UINTEGER', 'UBIGINT',
  'DECIMAL', 'NUMERIC', 'REAL', 'DOUBLE', 'FLOAT',
];

const TEMPORAL_TYPES = [
  'DATE', 'TIME', 'TIMESTAMP', 'INTERVAL',
];

export function classifyColumnKind(duckdbType: string): ColumnKind {
  const upper = duckdbType.toUpperCase();

  for (const numType of NUMERIC_TYPES) {
    if (upper.includes(numType)) {
      return 'numeric';
    }
  }

  for (const tempType of TEMPORAL_TYPES) {
    if (upper.includes(tempType)) {
      return 'temporal';
    }
  }

  return 'categorical';
}

export function describeToSchema(describeRows: any[]): SchemaColumn[] {
  return describeRows.map((row) => ({
    name: row.column_name,
    type: row.column_type,
    kind: classifyColumnKind(row.column_type),
  }));
}
