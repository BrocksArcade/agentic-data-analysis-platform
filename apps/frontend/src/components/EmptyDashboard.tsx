import { PlusIcon } from './icons';
import { useDashboard } from '../context/DashboardContext';

interface EmptyDashboardProps {
  onAddWidget: () => void;
}

export function EmptyDashboard({ onAddWidget }: EmptyDashboardProps) {
  const { schema } = useDashboard();

  if (schema.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Upload a dataset to get started
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Upload a CSV or Parquet file using the file upload in the left sidebar
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          No widgets yet
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Create your first widget to visualize your data
        </p>
        <button
          onClick={onAddWidget}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-lg"
        >
          <PlusIcon className="w-5 h-5" />
          Add Widget
        </button>
      </div>
    </div>
  );
}
