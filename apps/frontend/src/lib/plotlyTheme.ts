import { Layout } from 'plotly.js';

export const COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316',
];

export const PLOTLY_CONFIG = {
  responsive: true,
  displayModeBar: true,
  displaylogo: false,
};

export function getPlotlyLayout(theme: 'light' | 'dark'): Partial<Layout> {
  const isDark = theme === 'dark';
  const textColor = isDark ? '#f3f4f6' : '#1f2937';
  const gridColor = isDark ? '#374151' : '#e5e7eb';
  const bgColor = 'rgba(0,0,0,0)';

  return {
    font: {
      family: 'sans-serif',
      size: 12,
      color: textColor,
    },
    plot_bgcolor: bgColor,
    paper_bgcolor: bgColor,
    xaxis: {
      showgrid: true,
      gridcolor: gridColor,
      zeroline: false,
      tickcolor: textColor,
    },
    yaxis: {
      showgrid: true,
      gridcolor: gridColor,
      zeroline: false,
      tickcolor: textColor,
    },
    margin: { l: 60, r: 20, t: 40, b: 50 },
    autosize: true,
  };
}
