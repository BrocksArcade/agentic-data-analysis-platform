import {
  BarChartIcon,
  LineChartIcon,
  PieChartIcon,
  ScatterIcon,
  TableIcon,
} from './icons';

interface ChartTypeCardProps {
  type: string;
  onClick: () => void;
}

const ICONS = {
  bar: BarChartIcon,
  line: LineChartIcon,
  pie: PieChartIcon,
  scatter: ScatterIcon,
  table: TableIcon,
};

const LABELS = {
  bar: 'Bar',
  line: 'Line',
  pie: 'Pie',
  scatter: 'Scatter',
  table: 'Table',
};

export function ChartTypeCard({ type, onClick }: ChartTypeCardProps) {
  const Icon = ICONS[type as keyof typeof ICONS];
  const label = LABELS[type as keyof typeof LABELS];

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-3 p-4 rounded-lg border-2 border-gray-200 dark:border-dark-700 hover:border-indigo-500 dark:hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-dark-700 transition"
    >
      <Icon className="w-8 h-8 text-gray-600 dark:text-gray-400" />
      <span className="text-sm font-medium text-gray-900 dark:text-white">{label}</span>
    </button>
  );
}
