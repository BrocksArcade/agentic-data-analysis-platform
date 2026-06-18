import { useDashboard } from '../context/DashboardContext';
import { WidgetCard } from './WidgetCard';

export function WidgetGrid() {
  const { widgets } = useDashboard();

  return (
    <div
      className="flex-1 overflow-y-auto p-4"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
        gap: '1rem',
        alignContent: 'start',
      }}
    >
      {widgets.map((widget) => (
        <WidgetCard key={widget.id} widget={widget} />
      ))}
    </div>
  );
}
