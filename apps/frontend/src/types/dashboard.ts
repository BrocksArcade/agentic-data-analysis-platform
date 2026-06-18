import { ChartContract, WidgetSpec } from '@platform/shared';

export interface ColumnSchema {
  name: string;
  type: string;
  kind: 'numeric' | 'temporal' | 'categorical';
}

export interface Widget {
  id: string;
  chartType: string;
  title: string;
  spec: WidgetSpec | null;
  chart: ChartContract;
  source: 'manual' | 'ai';
}

export interface ConversationSummary {
  conversationId: string;
  fileName: string;
  createdAt: string;
}

export type { ChartContract, WidgetSpec };
