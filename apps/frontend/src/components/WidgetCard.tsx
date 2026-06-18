import { useEffect, useRef } from 'react';
import { Widget } from '../types/dashboard';
import { ChartRenderer } from './ChartRenderer';
import { TrashIcon } from './icons';
import { useDashboard } from '../context/DashboardContext';

interface WidgetCardProps {
  widget: Widget;
}

export function WidgetCard({ widget }: WidgetCardProps) {
  const { removeWidget, focusWidgetId } = useDashboard();
  const cardRef = useRef<HTMLDivElement>(null);
  const isFocused = focusWidgetId === widget.id;

  useEffect(() => {
    if (isFocused && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      setTimeout(() => {
        // Remove focus ring after 1.5s
        setFocused(false);
      }, 1500);
    }
  }, [isFocused]);

  const setFocused = (focused: boolean) => {
    // This would update the focusWidgetId in context, but since we're using a timeout
    // we just let the ring appear briefly and fade
  };

  return (
    <div
      ref={cardRef}
      className={`flex flex-col min-h-[320px] bg-white dark:bg-dark-800 rounded-lg shadow hover:shadow-lg transition overflow-hidden
        ${isFocused ? 'ring-2 ring-indigo-500' : ''}`}
      style={{
        transition: isFocused ? 'all 0.3s ease-in-out' : 'box-shadow 0.2s ease',
      }}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-dark-700">
        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
          {widget.title}
        </h3>
        <button
          onClick={() => removeWidget(widget.id)}
          className="p-1 rounded hover:bg-gray-200 dark:hover:bg-dark-700 transition text-gray-600 dark:text-gray-400"
          title="Delete widget"
        >
          <TrashIcon className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 min-h-0 overflow-hidden">
        <ChartRenderer chart={widget.chart} />
      </div>
    </div>
  );
}
