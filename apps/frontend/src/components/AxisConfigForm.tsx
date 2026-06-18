import { useMemo, useState } from 'react';
import { ColumnSchema, WidgetSpec } from '../types/dashboard';
import {
  AXIS_RULES,
  KIND_FILTERS,
  KindFilter,
  columnsByKind,
  defaultKindFilter,
} from '../lib/axisRules';
import { useDashboard } from '../context/DashboardContext';

interface AxisConfigFormProps {
  chartType: string;
  schema: ColumnSchema[];
  onBack: () => void;
  onClose: () => void;
}

const NUMERIC_AGGS = [
  { value: 'sum', label: 'Sum' },
  { value: 'avg', label: 'Average' },
  { value: 'min', label: 'Minimum' },
  { value: 'max', label: 'Maximum' },
];

export function AxisConfigForm({ chartType, schema, onBack, onClose }: AxisConfigFormProps) {
  const { buildWidget } = useDashboard();
  const rule = AXIS_RULES[chartType];
  const maxY = rule?.maxY ?? Infinity;
  const allowAggregation = rule?.allowAggregation ?? false;
  const isPie = chartType === 'pie';

  // The user declares what type of header each axis is; we list those columns.
  const [xKind, setXKind] = useState<KindFilter>(defaultKindFilter(chartType, 'x'));
  const [yKind, setYKind] = useState<KindFilter>(defaultKindFilter(chartType, 'y'));
  const [xColumn, setXColumn] = useState('');
  const [yColumns, setYColumns] = useState<string[]>([]);
  const [aggregation, setAggregation] = useState<string>(isPie ? 'sum' : 'none');

  const xCols = useMemo(() => columnsByKind(schema, xKind), [schema, xKind]);
  const yCols = useMemo(() => columnsByKind(schema, yKind), [schema, yKind]);

  const kindOf = (name: string) => schema.find((c) => c.name === name)?.kind;
  const allYNumeric =
    yColumns.length > 0 && yColumns.every((n) => kindOf(n) === 'numeric');

  // Aggregation options adapt to the chosen columns: numeric aggregations only
  // make sense on numbers; Count works on anything; bar/line can also be "raw".
  const aggOptions = useMemo(() => {
    const opts: { value: string; label: string }[] = [];
    if (!isPie) opts.push({ value: 'none', label: 'None (raw values)' });
    if (allYNumeric) opts.push(...NUMERIC_AGGS);
    opts.push({ value: 'count', label: 'Count' });
    return opts;
  }, [isPie, allYNumeric]);

  // Keep the selected aggregation valid as the columns change.
  const currentAgg = aggOptions.some((o) => o.value === aggregation)
    ? aggregation
    : aggOptions[0].value;

  const toggleYColumn = (name: string) => {
    setYColumns((prev) => {
      if (prev.includes(name)) return prev.filter((c) => c !== name);
      if (prev.length >= maxY) return isPie ? [name] : prev; // pie: replace
      return [...prev, name];
    });
  };

  const canConfirm =
    !!xColumn && yColumns.length > 0 && (!isPie || yColumns.length === 1);

  const handleConfirm = () => {
    const spec: WidgetSpec = {
      chartType: chartType as any,
      xColumn,
      yColumns,
      aggregation:
        allowAggregation && currentAgg !== 'none' ? (currentAgg as any) : undefined,
      limit: undefined,
    };
    buildWidget(spec);
    onClose();
  };

  const kindSelect = (value: KindFilter, onChange: (k: KindFilter) => void) => (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as KindFilter)}
      className="px-2 py-1 text-xs border border-gray-300 dark:border-dark-600 rounded bg-white dark:bg-dark-700 text-gray-700 dark:text-gray-200"
    >
      {KIND_FILTERS.map((k) => (
        <option key={k.value} value={k.value}>{k.label}</option>
      ))}
    </select>
  );

  return (
    <div className="space-y-6">
      {/* X axis */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-900 dark:text-white">X Axis</label>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">Type:</span>
            {kindSelect(xKind, (k) => { setXKind(k); setXColumn(''); })}
          </div>
        </div>
        <select
          value={xColumn}
          onChange={(e) => setXColumn(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
        >
          <option value="">Select X column...</option>
          {xCols.map((col) => (
            <option key={col.name} value={col.name}>{col.name} ({col.kind})</option>
          ))}
        </select>
        {xCols.length === 0 && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">No columns of this type.</p>
        )}
      </div>

      {/* Y axis */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-900 dark:text-white">
            Y Axis {maxY !== Infinity && `(max ${maxY})`}
          </label>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">Type:</span>
            {kindSelect(yKind, (k) => { setYKind(k); setYColumns([]); })}
          </div>
        </div>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {yCols.map((col) => {
            const checked = yColumns.includes(col.name);
            return (
              <label key={col.name} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleYColumn(col.name)}
                  disabled={!checked && !isPie && yColumns.length >= maxY}
                  className="rounded"
                />
                <span className="text-gray-700 dark:text-gray-300">{col.name} ({col.kind})</span>
              </label>
            );
          })}
          {yCols.length === 0 && (
            <p className="text-xs text-gray-500 dark:text-gray-400">No columns of this type.</p>
          )}
        </div>
      </div>

      {/* Aggregation — user decides */}
      {allowAggregation && (
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Aggregation
          </label>
          <select
            value={currentAgg}
            onChange={(e) => setAggregation(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
          >
            {aggOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          {!allYNumeric && yColumns.length > 0 && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Sum/Average/Min/Max need numeric columns — only Count is available for text/date.
            </p>
          )}
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
