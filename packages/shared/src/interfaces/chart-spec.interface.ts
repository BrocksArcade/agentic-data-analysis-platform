export type ColumnKind = 'numeric' | 'temporal' | 'categorical';

export interface SchemaColumn {
  name: string;
  type: string;
  kind: ColumnKind;
}

export interface WidgetSpec {
  chartType: 'bar' | 'line' | 'pie' | 'scatter' | 'table';
  xColumn: string;
  yColumns: string[];
  aggregation?: 'sum' | 'avg' | 'min' | 'max' | 'count';
  limit?: number;
}

export interface SavedChart {
  chartId: string;
  conversationId: string;
  userId?: string;
  chartType: string;
  title: string;
  source: 'manual' | 'ai';
  config: WidgetSpec | null;
  contract: any;
  createdAt: string;
}
