import { useState } from 'react';
import { useDashboard } from '../context/DashboardContext';
import { WidgetGrid } from './WidgetGrid';
import { EmptyDashboard } from './EmptyDashboard';
import { AddWidgetModal } from './AddWidgetModal';
import { PlusIcon } from './icons';

export function Dashboard() {
  const { widgets, schema } = useDashboard();
  const [showAddModal, setShowAddModal] = useState(false);

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {widgets.length === 0 ? (
        <>
          <EmptyDashboard onAddWidget={() => setShowAddModal(true)} />
        </>
      ) : (
        <>
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-dark-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Widgets</h2>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              <PlusIcon className="w-4 h-4" />
              Add Widget
            </button>
          </div>
          <WidgetGrid />
        </>
      )}
      {showAddModal && (
        <AddWidgetModal
          onClose={() => setShowAddModal(false)}
          schema={schema}
        />
      )}
    </div>
  );
}
