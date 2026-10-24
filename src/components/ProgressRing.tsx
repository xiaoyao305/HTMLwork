interface ProgressRingProps {
  done: number;
  total: number;
  size?: number;
}

export function ProgressRing({ done, total, size = 92 }: ProgressRingProps) {
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const ratio = total === 0 ? 0 : Math.min(1, done / total);
  const offset = c * (1 - ratio);

  return (
    <div className="progress-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#3DF5E0" />
            <stop offset="100%" stopColor="#9B8CFF" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.09)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#ringGrad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset .5s ease', filter: 'drop-shadow(0 0 6px rgba(61,245,224,.5))' }}
        />
      </svg>
      <div className="progress-ring-label">
        <strong>{done}</strong>
        <span>/ {total}</span>
      </div>
    </div>
  );
}
