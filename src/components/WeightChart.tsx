import { shortDate } from '../lib/date';

interface Point {
  date: string;
  weightKg: number;
}

export function WeightChart({ records }: { records: Point[] }) {
  const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date));

  if (sorted.length === 0) {
    return (
      <div className="chart-empty">
        <span aria-hidden>📈</span>
        <p>还没有体重数据，记下第一次就能看到趋势了。</p>
      </div>
    );
  }

  const W = 320;
  const H = 132;
  const padX = 18;
  const padTop = 18;
  const padBottom = 24;
  const weights = sorted.map((p) => p.weightKg);
  const min = Math.min(...weights);
  const max = Math.max(...weights);
  const range = max - min || 1;

  const coords = sorted.map((p, i) => {
    const x = sorted.length === 1 ? W / 2 : padX + (i * (W - padX * 2)) / (sorted.length - 1);
    const y = padTop + (1 - (p.weightKg - min) / range) * (H - padTop - padBottom);
    return { ...p, x, y };
  });

  const line = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ');
  const area = `${line} L ${coords[coords.length - 1].x} ${H - padBottom} L ${coords[0].x} ${H - padBottom} Z`;

  return (
    <div className="weight-chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="体重趋势图">
        <defs>
          <linearGradient id="weightArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3DF5E0" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#3DF5E0" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="weightLine" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#3DF5E0" />
            <stop offset="100%" stopColor="#9B8CFF" />
          </linearGradient>
        </defs>
        {[0, 1, 2].map((i) => (
          <line
            key={i}
            x1={padX}
            x2={W - padX}
            y1={padTop + (i * (H - padTop - padBottom)) / 2}
            y2={padTop + (i * (H - padTop - padBottom)) / 2}
            stroke="rgba(255,255,255,0.07)"
            strokeDasharray="4 6"
          />
        ))}
        <path d={area} fill="url(#weightArea)" />
        <path d={line} fill="none" stroke="url(#weightLine)" strokeWidth="2.6" strokeLinecap="round" />
        {coords.map((c) => (
          <g key={c.date + c.weightKg}>
            <circle cx={c.x} cy={c.y} r="6" fill="rgba(61,245,224,0.18)" />
            <circle cx={c.x} cy={c.y} r="3" fill="#0B0B14" stroke="#3DF5E0" strokeWidth="2" />
          </g>
        ))}
        <text x={padX} y={H - 6} fill="rgba(255,255,255,0.42)" fontSize="10">
          {shortDate(sorted[0].date)}
        </text>
        <text x={W - padX} y={H - 6} fill="rgba(255,255,255,0.42)" fontSize="10" textAnchor="end">
          {shortDate(sorted[sorted.length - 1].date)}
        </text>
      </svg>
      <div className="chart-legend">
        <span>
          最低 <strong>{min.toFixed(2)}</strong> kg
        </span>
        <span>
          最高 <strong>{max.toFixed(2)}</strong> kg
        </span>
        <span>
          最新 <strong>{sorted[sorted.length - 1].weightKg.toFixed(2)}</strong> kg
        </span>
      </div>
    </div>
  );
}
