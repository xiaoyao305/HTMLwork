import type { AppState } from './types';
import { createSeedState } from './seeds';

const KEY = 'zhuazhua-daily-v1';

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return createSeedState();
    const parsed = JSON.parse(raw) as AppState;
    if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.pets)) {
      return createSeedState();
    }
    return {
      ...createSeedState(),
      ...parsed,
      checkIns: parsed.checkIns ?? [],
      health: parsed.health ?? [],
      tasks: parsed.tasks ?? [],
      foodFavorites: parsed.foodFavorites ?? [],
      foodUnsuitable: parsed.foodUnsuitable ?? [],
      pantry: parsed.pantry ?? [],
      playFavorites: parsed.playFavorites ?? [],
      playLogs: parsed.playLogs ?? [],
      remindersOn: parsed.remindersOn ?? true,
      activePetId: parsed.pets.some((p) => p.id === parsed.activePetId)
        ? parsed.activePetId
        : parsed.pets[0]?.id ?? '',
    };
  } catch {
    return createSeedState();
  }
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // 存储空间不足时静默失败，页面仍可继续使用
  }
}

export function uid(prefix = 'id'): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
