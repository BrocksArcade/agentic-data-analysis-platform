import { useState } from 'react';
import { ColumnSchema } from '../types/dashboard';
import { ChartTypeCard } from './ChartTypeCard';
import { AxisConfigForm } from './AxisConfigForm';

interface AddWidgetModalProps {
  onClose: () => void;
  schema: ColumnSchema[];
}

export function AddWidgetModal({ onClose, schema }: AddWidgetModalProps) {
  const [selectedChartType, setSelectedChartType] = useState<string | null>(null);
  const chartTypes = ['bar', 'line', 'pie', 'scatter', 'table'];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-dark-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 border-b border-gray-200 dark:border-dark-700 px-6 py-4 flex items-center justify-between bg-white dark:bg-dark-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {selectedChartType ? `Configure ${selectedChartType} chart` : 'Select chart type'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="p-6">
          {!selectedChartType ? (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {chartTypes.map((type) => (
                <ChartTypeCard
                  key={type}
                  type={type}
                  onClick={() => setSelectedChartType(type)}
                />
              ))}
            </div>
          ) : (
            <AxisConfigForm
              chartType={selectedChartType}
              schema={schema}
              onBack={() => setSelectedChartType(null)}
              onClose={onClose}
            />
          )}
        </div>
      </div>
    </div>
  );
}
