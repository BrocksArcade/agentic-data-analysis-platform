import { ColumnSchema } from '../types/dashboard';

export interface AxisRule {
  xAccepts: ('numeric' | 'temporal' | 'categorical')[];
  yAccepts: ('numeric' | 'temporal' | 'categorical')[];
  maxY: number;
  allowAggregation: boolean;
}

export const AXIS_RULES: Record<string, AxisRule> = {
  bar: {
    xAccepts: ['categorical', 'temporal'],
    yAccepts: ['numeric'],
    maxY: Infinity,
    allowAggregation: true,
  },
  line: {
    xAccepts: ['temporal', 'categorical', 'numeric'],
    yAccepts: ['numeric'],
    maxY: Infinity,
    allowAggregation: true,
  },
  pie: {
    xAccepts: ['categorical'],
    yAccepts: ['numeric'],
    maxY: 1,
    allowAggregation: true,
  },
  scatter: {
    xAccepts: ['numeric'],
    yAccepts: ['numeric'],
    maxY: Infinity,
    allowAggregation: false,
  },
  table: {
    xAccepts: ['numeric', 'temporal', 'categorical'],
    yAccepts: ['numeric', 'temporal', 'categorical'],
    maxY: Infinity,
    allowAggregation: false,
  },
};

export function compatibleColumns(
  chartType: string,
  axis: 'x' | 'y',
  schema: ColumnSchema[],
): ColumnSchema[] {
  const rule = AXIS_RULES[chartType];
  if (!rule) return schema;

  const accepts = axis === 'x' ? rule.xAccepts : rule.yAccepts;
  return schema.filter((col) => accepts.includes(col.kind));
}
