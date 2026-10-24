import { ACTIVITIES, HOUSEHOLD_PROPS } from '../data/activities';
import type { Activity } from '../data/activities';
import type { EnergyLevel, Pet } from '../store/types';

export interface PlayFilters {
  pet: Pet;
  place: 'indoor' | 'outdoor';
  minutes: number;
  energy: EnergyLevel;
  toys: string[];
}

function matchesToys(activity: Activity, toys: string[]): boolean {
  const available = new Set([...toys, ...HOUSEHOLD_PROPS]);
  return activity.props.every((p) => available.has(p));
}

function basePool(filters: PlayFilters): Activity[] {
  const { pet, place, energy, toys } = filters;
  return ACTIVITIES.filter(
    (a) =>
      a.species.includes(pet.species) &&
      (a.place === 'both' || a.place === place) &&
      a.energy.includes(energy) &&
      matchesToys(a, toys),
  );
}

export interface DrawResult {
  activity: Activity;
  relaxed?: string;
}

/** 逐级放宽条件，保证一定抽得到，并把放宽说明返回给页面 */
export function drawActivity(filters: PlayFilters, excludeId?: string): DrawResult | null {
  const { pet, place, minutes, toys } = filters;
  const speciesPool = ACTIVITIES.filter((a) => a.species.includes(pet.species));

  const attempts: { list: Activity[]; relaxed?: string }[] = [
    {
      list: basePool(filters).filter((a) => a.minutes <= minutes),
    },
    {
      list: basePool(filters),
      relaxed: `没有 ${minutes} 分钟以内的活动，帮你找了一个稍长一点的`,
    },
    {
      list: ACTIVITIES.filter(
        (a) =>
          a.species.includes(pet.species) &&
          (a.place === 'both' || a.place === place) &&
          matchesToys(a, toys),
      ),
      relaxed: '精力档位匹配的灵感不够，放宽了精力条件',
    },
    {
      list: ACTIVITIES.filter(
        (a) => a.species.includes(pet.species) && matchesToys(a, toys),
      ),
      relaxed: '这个场地暂时没有合适灵感，换成另一个场地看看',
    },
    {
      list: speciesPool,
      relaxed: '没有完全匹配的灵感，先从一个通用活动开始',
    },
  ];

  for (const attempt of attempts) {
    const pool = attempt.list.filter((a) => a.id !== excludeId);
    if (pool.length === 0) continue;
    return {
      activity: pool[Math.floor(Math.random() * pool.length)],
      relaxed: attempt.relaxed,
    };
  }
  return null;
}
