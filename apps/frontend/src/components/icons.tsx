export function SunIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="5" />
      <path d="M12 1v6m0 6v6M4.22 4.22l4.24 4.24m5.08 5.08l4.24 4.24M1 12h6m6 0h6M4.22 19.78l4.24-4.24m5.08-5.08l4.24-4.24" />
    </svg>
  );
}

export function MoonIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M21.64 13a1 1 0 0 0-1.05-.14 8 8 0 1 1 .12-11.45 1 1 0 0 0 1.07-.07 1 1 0 0 0 .03-1.08A10 10 0 0 0 12 2C6.48 2 2 6.48 2 12s4.48 10 10 10a10 10 0 0 0 9.64-13z" />
    </svg>
  );
}

export function SparklesIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M13 2l3.293 6.5L23 9.5h-6.582L13 16l-3.418-6.5H3l6.707-1L13 2z" />
    </svg>
  );
}

export function ChevronIcon({ className = 'w-5 h-5', dir = 'down' }: { className?: string; dir?: 'up' | 'down' | 'left' | 'right' }) {
  const rotate = { up: 'rotate-180', down: '', left: 'rotate-90', right: '-rotate-90' }[dir];
  return (
    <svg className={`${className} ${rotate}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
    </svg>
  );
}

export function PlusIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}

export function TrashIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

export function BarChartIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <rect x="3" y="13" width="3" height="8" />
      <rect x="10" y="3" width="3" height="18" />
      <rect x="17" y="8" width="3" height="13" />
    </svg>
  );
}

export function LineChartIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 17V7a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
    </svg>
  );
}

export function PieChartIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c3.87 0 7 3.13 7 7h-7V5z" />
    </svg>
  );
}

export function ScatterIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <circle cx="5" cy="5" r="1.5" />
      <circle cx="10" cy="8" r="1.5" />
      <circle cx="15" cy="6" r="1.5" />
      <circle cx="7" cy="14" r="1.5" />
      <circle cx="12" cy="11" r="1.5" />
      <circle cx="18" cy="15" r="1.5" />
      <circle cx="9" cy="19" r="1.5" />
      <circle cx="14" cy="18" r="1.5" />
    </svg>
  );
}

export function TableIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <rect x="2" y="4" width="20" height="2" />
      <rect x="2" y="8" width="20" height="2" />
      <rect x="2" y="12" width="20" height="2" />
      <rect x="2" y="16" width="20" height="2" />
      <rect x="8" y="4" width="1" height="14" />
      <rect x="15" y="4" width="1" height="14" />
    </svg>
  );
}
