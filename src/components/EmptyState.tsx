import type { ReactNode } from 'react';

interface EmptyStateProps {
  emoji: string;
  title: string;
  desc: string;
  action?: ReactNode;
  compact?: boolean;
}

export function EmptyState({ emoji, title, desc, action, compact }: EmptyStateProps) {
  return (
    <div className={`empty-state ${compact ? 'is-compact' : ''}`}>
      <div className="empty-emoji" aria-hidden>
        {emoji}
      </div>
      <h3>{title}</h3>
      <p>{desc}</p>
      {action}
    </div>
  );
}
