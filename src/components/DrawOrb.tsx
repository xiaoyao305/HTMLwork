import { useEffect, useState } from 'react';

interface DrawOrbProps {
  rolling: boolean;
  rollingTexts: string[];
  emoji: string;
  label: string;
  hint?: string;
  tone?: 'mint' | 'amber';
}

export function DrawOrb({ rolling, rollingTexts, emoji, label, hint, tone = 'mint' }: DrawOrbProps) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!rolling) return;
    const timer = window.setInterval(() => setTick((v) => v + 1), 110);
    return () => window.clearInterval(timer);
  }, [rolling]);

  return (
    <div className={`draw-orb tone-${tone} ${rolling ? 'is-rolling' : ''}`}>
      <div className="orb">
        <div className="orb-halo" />
        <span className="orb-emoji" aria-hidden>
          {rolling ? '🎲' : emoji}
        </span>
      </div>
      <div className="draw-caption" aria-live="polite">
        <strong>{rolling ? rollingTexts[tick % rollingTexts.length] : label}</strong>
        {hint && <span>{hint}</span>}
      </div>
    </div>
  );
}
