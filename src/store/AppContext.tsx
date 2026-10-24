import { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import type { Dispatch, ReactNode } from 'react';
import type { AppState, CheckIn, PantryItem, Pet, Task } from './types';
import { addDays, todayStr } from '../lib/date';
import { loadState, saveState } from './storage';

export type Action =
  | { type: 'SET_ACTIVE_PET'; id: string }
  | { type: 'ADD_PET'; pet: AppState['pets'][number] }
  | { type: 'UPDATE_PET'; pet: AppState['pets'][number] }
  | { type: 'DELETE_PET'; id: string }
  | { type: 'ADD_TASK'; task: Task }
  | { type: 'UPDATE_TASK'; task: Task }
  | { type: 'DELETE_TASK'; id: string }
  | { type: 'TOGGLE_TASK'; id: string }
  | { type: 'CHECK_IN'; task: Task; date: string; at: string }
  | { type: 'UNDO_CHECK_IN'; id: string }
  | { type: 'ADD_HEALTH'; record: AppState['health'][number] }
  | { type: 'DELETE_HEALTH'; id: string }
  | { type: 'TOGGLE_FOOD_FAV'; draw: AppState['foodFavorites'][number] }
  | { type: 'MARK_FOOD_UNSUITABLE'; draw: AppState['foodFavorites'][number] }
  | { type: 'ADD_PANTRY_ITEM'; item: PantryItem }
  | { type: 'DELETE_PANTRY_ITEM'; id: string }
  | { type: 'TOGGLE_PLAY_FAV'; fav: AppState['playFavorites'][number] }
  | { type: 'ADD_PLAY_LOG'; log: AppState['playLogs'][number] }
  | { type: 'TOGGLE_REMINDERS' };

export function isTaskDue(task: Task, date: string): boolean {
  const f = task.frequency;
  switch (f.type) {
    case 'daily':
      return true;
    case 'weekly': {
      const dow = new Date(`${date}T00:00:00`).getDay();
      return (f.days ?? []).includes(dow);
    }
    case 'interval': {
      const every = Math.max(1, f.everyDays ?? 1);
      const anchor = f.anchor ?? date;
      const diff = Math.round(
        (new Date(`${date}T00:00:00`).getTime() - new Date(`${anchor}T00:00:00`).getTime()) / 86400000,
      );
      return diff >= 0 && diff % every === 0;
    }
    case 'once':
      return f.date === date;
    default:
      return false;
  }
}

export function checkInKey(taskId: string, date: string): string {
  return `${taskId}@${date}`;
}

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_ACTIVE_PET':
      return { ...state, activePetId: action.id };

    case 'ADD_PET': {
      const pets = [...state.pets, action.pet];
      return { ...state, pets, activePetId: action.pet.id };
    }

    case 'UPDATE_PET':
      return {
        ...state,
        pets: state.pets.map((p) => (p.id === action.pet.id ? action.pet : p)),
      };

    case 'DELETE_PET': {
      const pets = state.pets.filter((p) => p.id !== action.id);
      return {
        ...state,
        pets,
        activePetId: state.activePetId === action.id ? pets[0]?.id ?? '' : state.activePetId,
        tasks: state.tasks.filter((t) => t.petId !== action.id),
        checkIns: state.checkIns.filter((c) => c.petId !== action.id),
        health: state.health.filter((h) => h.petId !== action.id),
        foodFavorites: state.foodFavorites.filter((f) => f.petId !== action.id),
        foodUnsuitable: state.foodUnsuitable.filter((f) => f.petId !== action.id),
        playFavorites: state.playFavorites.filter((f) => f.petId !== action.id),
        playLogs: state.playLogs.filter((l) => l.petId !== action.id),
      };
    }

    case 'ADD_TASK':
      return { ...state, tasks: [...state.tasks, action.task] };

    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map((t) => (t.id === action.task.id ? action.task : t)),
      };

    case 'DELETE_TASK':
      return {
        ...state,
        tasks: state.tasks.filter((t) => t.id !== action.id),
        checkIns: state.checkIns.filter((c) => c.taskId !== action.id),
      };

    case 'TOGGLE_TASK':
      return {
        ...state,
        tasks: state.tasks.map((t) => (t.id === action.id ? { ...t, enabled: !t.enabled } : t)),
      };

    case 'CHECK_IN': {
      const exists = state.checkIns.some(
        (c) => c.taskId === action.task.id && c.date === action.date,
      );
      if (exists) return state;
      const entry: CheckIn = {
        id: `chk-${action.task.id}-${action.date}`,
        taskId: action.task.id,
        petId: action.task.petId,
        date: action.date,
        at: action.at,
        kind: action.task.kind,
        title: action.task.title,
      };
      return { ...state, checkIns: [...state.checkIns, entry] };
    }

    case 'UNDO_CHECK_IN':
      return { ...state, checkIns: state.checkIns.filter((c) => c.id !== action.id) };

    case 'ADD_HEALTH':
      return { ...state, health: [...state.health, action.record] };

    case 'DELETE_HEALTH':
      return { ...state, health: state.health.filter((h) => h.id !== action.id) };

    case 'TOGGLE_FOOD_FAV': {
      const exists = state.foodFavorites.some((f) => f.id === action.draw.id);
      return {
        ...state,
        foodFavorites: exists
          ? state.foodFavorites.filter((f) => f.id !== action.draw.id)
          : [action.draw, ...state.foodFavorites],
        foodUnsuitable: state.foodUnsuitable.filter((f) => f.id !== action.draw.id),
      };
    }

    case 'MARK_FOOD_UNSUITABLE': {
      const exists = state.foodUnsuitable.some((f) => f.id === action.draw.id);
      return {
        ...state,
        foodUnsuitable: exists
          ? state.foodUnsuitable
          : [action.draw, ...state.foodUnsuitable].slice(0, 30),
        foodFavorites: state.foodFavorites.filter((f) => f.id !== action.draw.id),
      };
    }

    case 'ADD_PANTRY_ITEM':
      return { ...state, pantry: [...state.pantry, action.item] };

    case 'DELETE_PANTRY_ITEM':
      return { ...state, pantry: state.pantry.filter((p) => p.id !== action.id) };

    case 'TOGGLE_PLAY_FAV': {
      const exists = state.playFavorites.some(
        (f) => f.petId === action.fav.petId && f.activityId === action.fav.activityId,
      );
      return {
        ...state,
        playFavorites: exists
          ? state.playFavorites.filter(
              (f) => !(f.petId === action.fav.petId && f.activityId === action.fav.activityId),
            )
          : [action.fav, ...state.playFavorites],
      };
    }

    case 'ADD_PLAY_LOG':
      return { ...state, playLogs: [action.log, ...state.playLogs].slice(0, 200) };

    case 'TOGGLE_REMINDERS':
      return { ...state, remindersOn: !state.remindersOn };

    default:
      return state;
  }
}

/** 某宠物某天的任务清单（含打卡状态） */
export function tasksForDay(state: AppState, petId: string, date: string) {
  const tasks = state.tasks
    .filter((t) => t.petId === petId && t.enabled && isTaskDue(t, date))
    .sort((a, b) => a.time.localeCompare(b.time));
  return tasks.map((task) => ({
    task,
    checkIn: state.checkIns.find((c) => c.taskId === task.id && c.date === date),
  }));
}

/** 找今日之后最近的一条提醒（用于空清单时显示） */
export function nextUpcomingTask(state: AppState, petId: string, from = todayStr()) {
  for (let i = 0; i < 60; i += 1) {
    const date = addDays(from, i);
    const due = state.tasks
      .filter((t) => t.petId === petId && t.enabled && isTaskDue(t, date))
      .filter(
        (t) => !state.checkIns.some((c) => c.taskId === t.id && c.date === date),
      )
      .sort((a, b) => a.time.localeCompare(b.time));
    if (due.length > 0) return { date, task: due[0] };
  }
  return null;
}

interface AppContextValue {
  state: AppState;
  dispatch: Dispatch<Action>;
  activePet: Pet | undefined;
}

const AppCtx = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const activePet = useMemo(
    () => state.pets.find((p) => p.id === state.activePetId) ?? state.pets[0],
    [state.pets, state.activePetId],
  );

  const value = useMemo(() => ({ state, dispatch, activePet }), [state, activePet]);

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error('useApp 必须在 AppProvider 内使用');
  return ctx;
}

