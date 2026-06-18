import { useEffect, useRef } from 'react';
import PlotlyJS from 'plotly.js-dist-min';
import { ChartContract } from '@platform/shared';
import { useTheme } from '../context/ThemeContext';
import { getPlotlyLayout, COLORS, PLOTLY_CONFIG } from '../lib/plotlyTheme';

interface ChartRendererProps {
  chart: ChartContract;
}

export function ChartRenderer({ chart }: ChartRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  // A malformed/missing contract must never crash the whole dashboard.
  const valid = !!chart && !!chart.chartType;
  const xData = chart?.xAxis?.data ?? [];
  const series = chart?.series ?? [];

  useEffect(() => {
    if (!valid) return;
    if (!containerRef.current) return;
    if (chart.chartType === 'text' || chart.chartType === 'error') return;
    if (chart.chartType === 'table') return;

    const layout = {
      ...getPlotlyLayout(theme),
      title: chart.title,
    };

    if (chart.chartType === 'pie') {
      const data = [{
        labels: xData,
        values: series[0]?.data || [],
        type: 'pie' as any,
        marker: { colors: COLORS },
      }];
      PlotlyJS.newPlot(containerRef.current, data, layout, PLOTLY_CONFIG);
    } else if (chart.chartType === 'scatter') {
      const data = series.map((s, i) => ({
        x: xData,
        y: s.data,
        mode: 'markers' as const,
        name: s.name,
        type: 'scatter' as const,
        marker: { color: COLORS[i % COLORS.length], size: 8 },
      }));
      PlotlyJS.newPlot(containerRef.current, data, layout, PLOTLY_CONFIG);
    } else {
      const data = series.map((s, i) => ({
        x: xData,
        y: s.data,
        name: s.name,
        type: chart.chartType as any,
        marker: { color: COLORS[i % COLORS.length] },
      }));
      PlotlyJS.newPlot(containerRef.current, data, layout, PLOTLY_CONFIG);
    }

    return () => {
      if (containerRef.current) PlotlyJS.purge(containerRef.current);
    };
  }, [chart, theme, valid]);

  if (!valid) {
    return (
      <div className="p-4 text-sm text-gray-500 dark:text-gray-400">
        Chart data unavailable.
      </div>
    );
  }

  if (chart.chartType === 'text') {
    return <div className="p-4 text-gray-800 dark:text-gray-200">{chart.summary}</div>;
  }

  if (chart.chartType === 'error') {
    return <div className="p-4 text-red-600 dark:text-red-400">{chart.summary}</div>;
  }

  if (chart.chartType === 'table') {
    return (
      <div className="overflow-auto p-2">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-gray-300 dark:border-gray-600">
              <th className="text-left p-2">{chart.xAxis?.label}</th>
              {series.map((s) => (
                <th key={s.name} className="text-left p-2">{s.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(chart.rawData ?? []).slice(0, 100).map((row, idx) => (
              <tr key={idx} className="border-b border-gray-200 dark:border-gray-700">
                <td className="p-2">{row[chart.xAxis?.label]}</td>
                {series.map((s) => (
                  <td key={s.name} className="p-2">{row[s.name]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return <div ref={containerRef} className="w-full h-full" />;
}
