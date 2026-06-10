export interface ChartContract {
  chartType: 'bar' | 'line' | 'pie' | 'scatter' | 'table' | 'error' | 'text';
  title: string;
  xAxis: {
    label: string;
    data: (string | number)[];
  };
  series: Array<{
    name: string;
    data: (string | number)[];
  }>;
  summary: string;
  rawData: Record<string, any>[];
}
