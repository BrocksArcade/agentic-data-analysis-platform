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

export type KindFilter = 'all' | 'numeric' | 'categorical' | 'temporal';

export const KIND_FILTERS: { value: KindFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'numeric', label: 'Number' },
  { value: 'categorical', label: 'Text' },
  { value: 'temporal', label: 'Date / time' },
];

/** The user picks the type; we show only columns of that type (or all). */
export function columnsByKind(
  schema: ColumnSchema[],
  filter: KindFilter,
): ColumnSchema[] {
  if (filter === 'all') return schema;
  return schema.filter((col) => col.kind === filter);
}

/** Default type filter to the kind this chart/axis usually expects. */
export function defaultKindFilter(chartType: string, axis: 'x' | 'y'): KindFilter {
  const rule = AXIS_RULES[chartType];
  const accepts = axis === 'x' ? rule?.xAccepts : rule?.yAccepts;
  if (!accepts || accepts.length !== 1) return 'all';
  return accepts[0];
}
