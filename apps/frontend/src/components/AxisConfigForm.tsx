import { useState } from 'react';
import { ColumnSchema, WidgetSpec } from '../types/dashboard';
import { compatibleColumns, AXIS_RULES } from '../lib/axisRules';
import { useDashboard } from '../context/DashboardContext';

interface AxisConfigFormProps {
  chartType: string;
  schema: ColumnSchema[];
  onBack: () => void;
  onClose: () => void;
}

export function AxisConfigForm({
  chartType,
  schema,
  onBack,
  onClose,
}: AxisConfigFormProps) {
  const { buildWidget } = useDashboard();
  const [xColumn, setXColumn] = useState<string>('');
  const [yColumns, setYColumns] = useState<string[]>([]);
  const [aggregation, setAggregation] = useState<string>('count');

  const rule = AXIS_RULES[chartType];
  const xCols = compatibleColumns(chartType, 'x', schema);
  const yCols = compatibleColumns(chartType, 'y', schema);

  const toggleYColumn = (colName: string) => {
    const updated = yColumns.includes(colName)
      ? yColumns.filter((c) => c !== colName)
      : [...yColumns, colName];

    if (rule && updated.length > rule.maxY) {
      return;
    }

    setYColumns(updated);
  };

  const canConfirm = xColumn && yColumns.length > 0;

  const handleConfirm = () => {
    const spec: WidgetSpec = {
      chartType: chartType as any,
      xColumn,
      yColumns,
      aggregation: rule.allowAggregation ? aggregation : undefined,
      limit: undefined,
    };
    buildWidget(spec);
    onClose();
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
          X Axis
        </label>
        <select
          value={xColumn}
          onChange={(e) => setXColumn(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
        >
          <option value="">Select X column...</option>
          {xCols.map((col) => (
            <option key={col.name} value={col.name}>
              {col.name} ({col.kind})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
          Y Axis {rule && rule.maxY !== Infinity && `(max ${rule.maxY})`}
        </label>
        <div className="space-y-2">
          {yCols.map((col) => (
            <label key={col.name} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={yColumns.includes(col.name)}
                onChange={() => toggleYColumn(col.name)}
                disabled={!yColumns.includes(col.name) && rule && yColumns.length >= rule.maxY}
                className="rounded"
              />
              <span className="text-gray-700 dark:text-gray-300">
                {col.name} ({col.kind})
              </span>
            </label>
          ))}
        </div>
      </div>

      {rule && rule.allowAggregation && (
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Aggregation
          </label>
          <select
            value={aggregation}
            onChange={(e) => setAggregation(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
          >
            <option value="sum">Sum</option>
            <option value="avg">Average</option>
            <option value="min">Minimum</option>
            <option value="max">Maximum</option>
            <option value="count">Count</option>
          </select>
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <button
          onClick={onBack}
          className="flex-1 px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700 transition"
        >
          Back
        </button>
        <button
          onClick={handleConfirm}
          disabled={!canConfirm}
          className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          Create Widget
        </button>
      </div>
    </div>
  );
}
