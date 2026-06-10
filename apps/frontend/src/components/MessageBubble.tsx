import Plot from 'react-plotly.js';
import { Message } from '../App';

interface MessageBubbleProps {
  message: Message;
}

const COLORS = ['#6366f1', '#22d3ee', '#f59e0b', '#10b981', '#f43f5e', '#a78bfa', '#fb923c'];

const PLOTLY_LAYOUT_BASE: Partial<Plotly.Layout> = {
  paper_bgcolor: 'transparent',
  plot_bgcolor: 'transparent',
  font: { color: '#d1d5db', size: 11 },
  margin: { t: 10, r: 16, b: 40, l: 50 },
  legend: { bgcolor: 'transparent', font: { color: '#d1d5db' } },
  xaxis: { gridcolor: '#374151', zerolinecolor: '#374151', tickfont: { color: '#9ca3af' } },
  yaxis: { gridcolor: '#374151', zerolinecolor: '#374151', tickfont: { color: '#9ca3af' } },
};

const PLOTLY_CONFIG: Partial<Plotly.Config> = {
  displayModeBar: true,
  displaylogo: false,
  modeBarButtonsToRemove: ['sendDataToCloud', 'lasso2d', 'select2d'],
  responsive: true,
};

function AssistantContent({ content }: { content: string }) {
  if (!content.startsWith('{')) {
    return <p className="text-sm whitespace-pre-wrap break-words">{content}</p>;
  }

  let data: any;
  try {
    data = JSON.parse(content);
  } catch {
    return <p className="text-sm whitespace-pre-wrap break-words">{content}</p>;
  }

  const { chartType, title, summary, series, xAxis, rawData } = data;

  if (chartType === 'text') {
    return <p className="text-sm whitespace-pre-wrap break-words">{summary}</p>;
  }

  if (chartType === 'error') {
    return (
      <div className="text-sm text-red-400">
        <span className="font-semibold">Error: </span>{summary}
      </div>
    );
  }

  if (chartType === 'table' && rawData?.length) {
    const cols = Object.keys(rawData[0]);
    return (
      <div className="overflow-x-auto">
        {title && <p className="text-sm font-semibold mb-2">{title}</p>}
        <table className="text-xs border-collapse w-full">
          <thead>
            <tr>
              {cols.map((c) => (
                <th key={c} className="border border-dark-600 px-2 py-1 text-left text-dark-300 bg-dark-700">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rawData.map((row: any, i: number) => (
              <tr key={i} className={i % 2 === 0 ? 'bg-dark-800' : 'bg-dark-750'}>
                {cols.map((c) => (
                  <td key={c} className="border border-dark-600 px-2 py-1">{String(row[c] ?? '')}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {summary && <p className="text-xs text-dark-400 mt-2">{summary}</p>}
      </div>
    );
  }

  if (chartType === 'pie' && xAxis?.data?.length && series?.[0]?.data?.length) {
    const trace: Plotly.Data = {
      type: 'pie',
      labels: xAxis.data,
      values: series[0].data,
      marker: { colors: COLORS },
      textinfo: 'label+percent',
      hovertemplate: '%{label}: %{value:,}<extra></extra>',
    };
    return (
      <div className="space-y-2">
        {title && <p className="text-sm font-semibold">{title}</p>}
        <Plot
          data={[trace]}
          layout={{ ...PLOTLY_LAYOUT_BASE, height: 300, showlegend: true }}
          config={PLOTLY_CONFIG}
          style={{ width: '100%' }}
          useResizeHandler
        />
        {summary && <p className="text-xs text-dark-400">{summary}</p>}
      </div>
    );
  }

  if (chartType === 'bar' && xAxis?.data?.length && series?.length) {
    const traces: Plotly.Data[] = series.map((s: any, i: number) => ({
      type: 'bar',
      name: s.name,
      x: xAxis.data,
      y: s.data,
      marker: { color: COLORS[i % COLORS.length] },
      hovertemplate: `%{x}<br>${s.name}: %{y:,}<extra></extra>`,
    }));
    return (
      <div className="space-y-2">
        {title && <p className="text-sm font-semibold">{title}</p>}
        <Plot
          data={traces}
          layout={{ ...PLOTLY_LAYOUT_BASE, height: 300, barmode: 'group' }}
          config={PLOTLY_CONFIG}
          style={{ width: '100%' }}
          useResizeHandler
        />
        {summary && <p className="text-xs text-dark-400">{summary}</p>}
      </div>
    );
  }

  if (chartType === 'line' && xAxis?.data?.length && series?.length) {
    const traces: Plotly.Data[] = series.map((s: any, i: number) => ({
      type: 'scatter',
      mode: 'lines',
      name: s.name,
      x: xAxis.data,
      y: s.data,
      line: { color: COLORS[i % COLORS.length], width: 2 },
      hovertemplate: `%{x}<br>${s.name}: %{y:,}<extra></extra>`,
    }));
    return (
      <div className="space-y-2">
        {title && <p className="text-sm font-semibold">{title}</p>}
        <Plot
          data={traces}
          layout={{ ...PLOTLY_LAYOUT_BASE, height: 300 }}
          config={PLOTLY_CONFIG}
          style={{ width: '100%' }}
          useResizeHandler
        />
        {summary && <p className="text-xs text-dark-400">{summary}</p>}
      </div>
    );
  }

  if (chartType === 'scatter' && xAxis?.data?.length && series?.length) {
    const traces: Plotly.Data[] = series.map((s: any, i: number) => ({
      type: 'scatter',
      mode: 'markers',
      name: s.name,
      x: xAxis.data,
      y: s.data,
      marker: { color: COLORS[i % COLORS.length], size: 7 },
      hovertemplate: `%{x}<br>${s.name}: %{y:,}<extra></extra>`,
    }));
    return (
      <div className="space-y-2">
        {title && <p className="text-sm font-semibold">{title}</p>}
        <Plot
          data={traces}
          layout={{ ...PLOTLY_LAYOUT_BASE, height: 300 }}
          config={PLOTLY_CONFIG}
          style={{ width: '100%' }}
          useResizeHandler
        />
        {summary && <p className="text-xs text-dark-400">{summary}</p>}
      </div>
    );
  }

  // unrecognised type — fallback to summary
  return (
    <div className="text-sm space-y-1">
      {title && <p className="font-semibold">{title}</p>}
      {summary && <p className="text-dark-300">{summary}</p>}
    </div>
  );
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-2xl rounded-2xl px-4 py-3 ${
          isUser ? 'bg-blue-600 text-white' : 'bg-dark-800 text-dark-100'
        }`}
      >
        {isUser ? (
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        ) : (
          <AssistantContent content={message.content} />
        )}
        <span className={`text-xs mt-2 block ${isUser ? 'text-blue-200' : 'text-dark-500'}`}>
          {message.timestamp.toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
}
