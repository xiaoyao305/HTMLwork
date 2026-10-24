import type { SVGProps } from 'react';
import type { TaskKind } from '../store/types';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function base({ size = 22, ...props }: IconProps) {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    ...props,
  };
}

export const HomeIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M3.5 10.5 12 3.8l8.5 6.7V20a1 1 0 0 1-1 1h-4.6v-6.2H9.1V21H4.5a1 1 0 0 1-1-1z" />
  </svg>
);

export const PawIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <ellipse cx="6.2" cy="9.4" rx="1.9" ry="2.4" transform="rotate(-18 6.2 9.4)" />
    <ellipse cx="10.4" cy="6.5" rx="1.9" ry="2.4" />
    <ellipse cx="15" cy="6.9" rx="1.9" ry="2.4" transform="rotate(12 15 6.9)" />
    <ellipse cx="18.4" cy="10.6" rx="1.9" ry="2.4" transform="rotate(24 18.4 10.6)" />
    <path d="M12.2 11.4c2.9 0 5.4 2.2 5.4 4.7 0 1.9-1.5 3.2-3.4 3.2-1 0-1.6-.4-2.6-.4s-1.6.4-2.6.4c-1.9 0-3.4-1.3-3.4-3.2 0-2.5 2.5-4.7 5.4-4.7z" />
  </svg>
);

export const BowlIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M3.6 11.5h16.8c0 4.3-3.3 7.2-8.4 7.2s-8.4-2.9-8.4-7.2z" />
    <path d="M7.3 8.1c0-1.3 1-2.2 2.1-2.2M11.9 7.4c0-2.1 1.2-3.4 2.7-3.4" />
    <path d="M5.2 20.6h13.6" />
  </svg>
);

export const SparkIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 3.2 13.7 9l5.8 1.7-5.8 1.7L12 18.2l-1.7-5.8L4.5 10.7 10.3 9z" />
    <path d="M18.6 16.4l.7 2.2 2.2.7-2.2.7-.7 2.2-.7-2.2-2.2-.7 2.2-.7z" />
  </svg>
);

export const ListIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M8.2 6.4h12M8.2 12h12M8.2 17.6h12" />
    <circle cx="4.2" cy="6.4" r="1.2" />
    <circle cx="4.2" cy="12" r="1.2" />
    <circle cx="4.2" cy="17.6" r="1.2" />
  </svg>
);

export const PlusIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const CheckIcon = (p: IconProps) => (
  <svg {...base(p)} strokeWidth={2.4}>
    <path d="m4.8 12.4 4.6 4.6L19.4 7" />
  </svg>
);

export const ClockIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8.6" />
    <path d="M12 7.4V12l3.2 2" />
  </svg>
);

export const BellIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M6.2 9.6a5.8 5.8 0 0 1 11.6 0c0 3 .6 4.4 1.6 5.5.4.5.1 1.3-.6 1.3H5.2c-.7 0-1-.8-.6-1.3 1-1.1 1.6-2.5 1.6-5.5z" />
    <path d="M10 19.6a2.2 2.2 0 0 0 4 0" />
  </svg>
);

export const ChevronRight = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="m9 5.5 6.5 6.5L9 18.5" />
  </svg>
);

export const HeartIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 20s-7.6-4.6-7.6-9.6A4.4 4.4 0 0 1 12 7.4a4.4 4.4 0 0 1 7.6 3c0 5-7.6 9.6-7.6 9.6z" />
  </svg>
);

export const DiceIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3.8" y="3.8" width="16.4" height="16.4" rx="4.2" />
    <circle cx="8.6" cy="8.6" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="15.4" cy="8.6" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="8.6" cy="15.4" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="15.4" cy="15.4" r="1.2" fill="currentColor" stroke="none" />
  </svg>
);

export const EditIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4.5 19.5h4l10-10a2.4 2.4 0 0 0-3.4-3.4l-10 10z" />
    <path d="m13.6 7.6 3.4 3.4" />
  </svg>
);

export const TrashIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4.8 7h14.4M9.4 7V5.2h5.2V7M7 7l.8 12.2h8.4L17 7" />
    <path d="M10.4 10.8v5M13.6 10.8v5" />
  </svg>
);

export const CloseIcon = (p: IconProps) => (
  <svg {...base(p)} strokeWidth={2}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

export const ScaleIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3.8" y="7.4" width="16.4" height="12.2" rx="3.2" />
    <path d="M8.6 11.6h.01M15.4 11.6h.01" />
    <path d="M9.4 7.4V5.8A1.8 1.8 0 0 1 11.2 4h1.6a1.8 1.8 0 0 1 1.8 1.8v1.6" />
  </svg>
);

export const ShieldIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 3.2 19 6v5.2c0 4.4-3 7.8-7 9.6-4-1.8-7-5.2-7-9.6V6z" />
    <path d="m8.8 12 2.2 2.2 4.2-4.4" />
  </svg>
);

export const ThumbDown = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M14.4 14.4V20a1.4 1.4 0 0 1-1.4 1.4l-3.2-6.2V4.4h7.4a2 2 0 0 1 2 2.4l-1 5.4a2 2 0 0 1-2 1.8z" />
    <path d="M9.8 4.4H6.2v9.8h3.6" />
  </svg>
);

export const PlayIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8.6" />
    <path d="m10 8.6 5.4 3.4L10 15.4z" />
  </svg>
);

export const TASK_EMOJI: Record<TaskKind, string> = {
  feed: '🍚',
  water: '💧',
  walk: '🐾',
  litter: '🧹',
  med: '💊',
  deworm: '🪱',
  groom: '🛁',
  vaccine: '💉',
  vet: '🏥',
  custom: '✨',
};

export const TASK_LABEL: Record<TaskKind, string> = {
  feed: '喂食',
  water: '饮水',
  walk: '遛弯',
  litter: '清洁',
  med: '用药',
  deworm: '驱虫',
  groom: '洗护',
  vaccine: '疫苗',
  vet: '复诊',
  custom: '自定义',
};
