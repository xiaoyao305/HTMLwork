export type Species = 'cat' | 'dog';
export type EnergyLevel = 'low' | 'mid' | 'high';

export interface Pet {
  id: string;
  name: string;
  avatar: string;
  species: Species;
  breed: string;
  birthday: string;
  weightKg: number;
  allergies: string[];
  avoid: string[];
  concerns: string[];
  energy: EnergyLevel;
  createdAt: string;
}

export type TaskKind =
  | 'feed'
  | 'water'
  | 'walk'
  | 'litter'
  | 'med'
  | 'deworm'
  | 'groom'
  | 'vaccine'
  | 'vet'
  | 'custom';

export type FrequencyType = 'daily' | 'weekly' | 'interval' | 'once';

export interface TaskFrequency {
  type: FrequencyType;
  days?: number[];
  everyDays?: number;
  date?: string;
  anchor?: string;
}

export interface Task {
  id: string;
  petId: string;
  kind: TaskKind;
  title: string;
  time: string;
  frequency: TaskFrequency;
  enabled: boolean;
  note?: string;
}

export interface CheckIn {
  id: string;
  taskId: string;
  petId: string;
  date: string;
  at: string;
  kind: TaskKind;
  title: string;
}

export type HealthTag = '体重' | '用药' | '驱虫' | '洗护' | '疫苗' | '复诊' | '其他';

export interface HealthRecord {
  id: string;
  petId: string;
  date: string;
  weightKg?: number;
  tags: HealthTag[];
  note?: string;
}

export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'extra';
export type FoodPref = 'light' | 'protein' | 'digest' | 'weight';

export type PantryRole = 'main' | 'side' | 'snack';

/** 家里现有的食物（用户自己维护的清单） */
export interface PantryItem {
  id: string;
  name: string;
  role: PantryRole;
  /** 适用的物种；['cat','dog'] 表示猫狗都行 */
  species: Species[];
  note?: string;
  /** 命中危险食物关键词：保留在清单里示警，但不参与抽签 */
  unsafe?: boolean;
  createdAt: string;
}

export interface FoodPick {
  id: string;
  name: string;
  note: string;
}

export interface FoodDraw {
  id: string;
  petId: string;
  slot: MealSlot;
  prefs: FoodPref[];
  main: FoodPick;
  sides: FoodPick[];
  snack: FoodPick;
  reason: string;
  tip: string;
  /** library = 灵感库随机推荐；pantry = 家里的食物清单 */
  source?: 'library' | 'pantry';
  at: string;
}

export type Place = 'indoor' | 'outdoor' | 'both';
export type Reaction = 'happy' | 'neutral' | 'bored';

export interface PlayFavorite {
  id: string;
  petId: string;
  activityId: string;
  at: string;
}

export interface PlayLog {
  id: string;
  petId: string;
  activityId: string;
  activityName: string;
  reaction: Reaction;
  note?: string;
  at: string;
}

export interface AppState {
  version: number;
  pets: Pet[];
  activePetId: string;
  tasks: Task[];
  checkIns: CheckIn[];
  health: HealthRecord[];
  foodFavorites: FoodDraw[];
  foodUnsuitable: FoodDraw[];
  pantry: PantryItem[];
  playFavorites: PlayFavorite[];
  playLogs: PlayLog[];
  remindersOn: boolean;
}
