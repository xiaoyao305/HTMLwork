import { FOOD_LIBRARY, NEVER_FEED_KEYWORDS, PREF_LABEL, stageOf } from '../data/foods';
import type { FoodDraw, FoodPref, MealSlot, PantryItem, Pet } from '../store/types';
import { monthsOld } from './date';
import { uid } from '../store/storage';

export const SLOT_LABEL: Record<MealSlot, string> = {
  breakfast: '早餐',
  lunch: '午餐',
  dinner: '晚餐',
  extra: '加餐',
};

export const SLOT_OPTIONS: MealSlot[] = ['breakfast', 'lunch', 'dinner', 'extra'];
export const PREF_OPTIONS: FoodPref[] = ['light', 'protein', 'digest', 'weight'];

function conflict(a: string[], b: string[]): boolean {
  return a.some((x) => b.some((y) => x.includes(y) || y.includes(x)));
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickMany<T>(arr: T[], count: number): T[] {
  const pool = [...arr];
  const out: T[] = [];
  while (out.length < count && pool.length > 0) {
    out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  }
  return out;
}

const FLAVOR_WORDS: Record<FoodPref, string> = {
  light: '清淡',
  protein: '蛋白质充足',
  digest: '好消化',
  weight: '热量克制',
};

export function foodPoolFor(pet: Pet, prefs: FoodPref[], unsuitableMainIds: string[]) {
  const stage = stageOf(monthsOld(pet.birthday));
  const restricted = [...pet.allergies, ...pet.avoid];

  const safe = FOOD_LIBRARY.filter(
    (item) =>
      item.species.includes(pet.species) &&
      item.stages.includes(stage) &&
      !conflict(item.conflicts, restricted) &&
      !unsuitableMainIds.includes(item.id),
  );

  const matchPref = (item: (typeof FOOD_LIBRARY)[number]) =>
    prefs.length === 0 || item.tags.some((t) => prefs.includes(t));

  return {
    mains: safe.filter((i) => i.role === 'main').filter(matchPref),
    sides: safe.filter((i) => i.role === 'side').filter(matchPref),
    snacks: safe.filter((i) => i.role === 'snack').filter(matchPref),
    allMains: safe.filter((i) => i.role === 'main'),
    allSides: safe.filter((i) => i.role === 'side'),
    allSnacks: safe.filter((i) => i.role === 'snack'),
  };
}

export function drawFood(
  pet: Pet,
  slot: MealSlot,
  prefs: FoodPref[],
  unsuitableMainIds: string[],
): FoodDraw | null {
  const pool = foodPoolFor(pet, prefs, unsuitableMainIds);
  const mains = pool.mains.length > 0 ? pool.mains : pool.allMains;
  if (mains.length === 0) return null;

  const main = pick(mains);
  const sidesPool = pool.sides.length > 0 ? pool.sides : pool.allSides;
  const snacksPool = pool.snacks.length > 0 ? pool.snacks : pool.allSnacks;
  const sideCount = Math.random() > 0.55 ? 2 : 1;
  const sides = pickMany(sidesPool, sideCount);
  const snack = snacksPool.length > 0 ? pick(snacksPool) : null;

  const sideText =
    sides.length > 0
      ? `再配 ${sides.map((s) => `「${s.name}」`).join('、')}，各一小勺，拌进主粮里`
      : '';
  const snackText = snack
    ? `零食选「${snack.name}」，${snack.note}。`
    : '今天不加零食，把热量留给正餐。';

  const flavor =
    prefs.length > 0
      ? `整体走${prefs.map((p) => FLAVOR_WORDS[p]).join('、')}路线`
      : '搭配温和，先从它吃惯的食物开始';

  const reason = `${pet.name}的${SLOT_LABEL[slot]}主食是「${main.name}」，${main.note}；${sideText}${
    sideText ? '。' : ''
  }${snackText}${flavor}。`;

  const tips = [
    '加新食物时一次只加一种，用 3–7 天慢慢过渡，观察食欲和便便。',
    '零食要算进当天总热量，正餐仍按包装建议的克数喂。',
    '如果出现软便、呕吐或抓挠变多，先停掉新食物，再咨询兽医。',
  ];

  return {
    id: uid('food'),
    petId: pet.id,
    slot,
    prefs,
    main: { id: main.id, name: main.name, note: main.note },
    sides: sides.map((s) => ({ id: s.id, name: s.name, note: s.note })),
    snack: snack
      ? { id: snack.id, name: snack.name, note: snack.note }
      : { id: 'none', name: '今天不加零食', note: '控制总热量' },
    reason,
    tip: pick(tips),
    source: 'library',
    at: new Date().toISOString(),
  };
}

/** 抽签结果里需要提醒注意的食物（有 caution 字段的） */
export function drawCautions(draw: FoodDraw): string[] {
  const ids = [draw.main.id, ...draw.sides.map((s) => s.id), draw.snack.id];
  return FOOD_LIBRARY.filter((item) => ids.includes(item.id) && item.caution).map(
    (item) => `${item.name}：${item.caution}`,
  );
}

/* ---------------- 家里的食物（pantry 模式） ---------------- */

/** 常见忌口词的同义扩展，提升自由文本名称的匹配可靠性 */
const KEYWORD_EXPANSIONS: Record<string, string[]> = {
  乳制品: ['奶', '酸奶', '牛奶', '羊奶', '奶酪', '芝士', '奶油'],
  奶: ['乳制品', '酸奶', '牛奶', '羊奶'],
  鸡肉: ['鸡', '鸡胸', '鸡腿'],
  鸡: ['鸡肉', '鸡胸', '鸡腿'],
  牛肉: ['牛'],
  羊肉: ['羊'],
  猪肉: ['猪'],
  鱼: ['三文鱼', '金枪鱼', '鳕鱼', '鲣鱼', '小鱼干'],
  蛋: ['鸡蛋', '蛋黄', '蛋白', '鹌鹑蛋'],
  小麦: ['麸质', '面粉'],
};

/** 把过敏/忌口词扩展成一组匹配关键词 */
export function expandKeywords(words: string[]): string[] {
  const out = new Set<string>();
  for (const raw of words) {
    const w = raw.trim();
    if (!w) continue;
    out.add(w);
    for (const [key, list] of Object.entries(KEYWORD_EXPANSIONS)) {
      if (w === key || w.includes(key) || key.includes(w)) {
        out.add(key);
        list.forEach((x) => out.add(x));
      }
    }
  }
  return [...out];
}

/** 自填名称是否命中危险食物关键词；返回命中的词 */
export function detectUnsafeFood(name: string): string | null {
  return NEVER_FEED_KEYWORDS.find((k) => name.includes(k)) ?? null;
}

function nameHitsKeywords(name: string, keywords: string[]): boolean {
  return keywords.some((k) => k.length > 0 && name.includes(k));
}

export interface PantryPool {
  mains: PantryItem[];
  sides: PantryItem[];
  snacks: PantryItem[];
  /** 清单里能被这只宠物吃的总数（不含 unsafe 与过敏/忌口命中项） */
  usableCount: number;
  /** 因过敏/忌口被避开的数量 */
  blockedCount: number;
}

export function pantryPoolFor(
  pet: Pet,
  pantry: PantryItem[],
  unsuitableMainIds: string[],
): PantryPool {
  const restricted = expandKeywords([...pet.allergies, ...pet.avoid]);
  const forSpecies = pantry.filter((item) => item.species.includes(pet.species));
  const blocked = forSpecies.filter(
    (item) => !item.unsafe && nameHitsKeywords(item.name, restricted),
  );
  const usable = forSpecies.filter(
    (item) => !item.unsafe && !nameHitsKeywords(item.name, restricted),
  );
  return {
    mains: usable.filter((i) => i.role === 'main' && !unsuitableMainIds.includes(i.id)),
    sides: usable.filter((i) => i.role === 'side'),
    snacks: usable.filter((i) => i.role === 'snack'),
    usableCount: usable.length,
    blockedCount: blocked.length,
  };
}

const PANTRY_TIPS = [
  '清单里的食物要新鲜，开封太久、受潮或变味的就不要喂了。',
  '只抽它平时吃过、适应良好的食物；第一次接触的新食材先少量试。',
  '零食要算进当天总热量，正餐仍按平时的分量喂。',
  '如果出现软便、呕吐或抓挠变多，先停掉新食物，再咨询兽医。',
];

/** 从家里现有食物中抽签；主食为空时返回 null */
export function drawPantryFood(
  pet: Pet,
  slot: MealSlot,
  pool: PantryPool,
): FoodDraw | null {
  if (pool.mains.length === 0) return null;

  const main = pick(pool.mains);
  const sideCount = Math.random() > 0.55 ? 2 : 1;
  const sides = pickMany(pool.sides, sideCount);
  const snack = pool.snacks.length > 0 ? pick(pool.snacks) : null;

  const sideText =
    sides.length > 0
      ? `再配 ${sides.map((s) => `「${s.name}」`).join('、')}，按平时的量给`
      : '';
  const snackText = snack
    ? `零食选「${snack.name}」。`
    : '今天不加零食，把热量留给正餐。';

  const reason = `从家里的存货里给${pet.name}安排${SLOT_LABEL[slot]}：主食是「${main.name}」${
    main.note ? `，${main.note}` : ''
  }；${sideText}${sideText ? '。' : ''}${snackText}都是清单里现有的，不用再翻购物软件。`;

  return {
    id: uid('food'),
    petId: pet.id,
    slot,
    prefs: [],
    main: { id: main.id, name: main.name, note: main.note || '家里常备的主食' },
    sides: sides.map((s) => ({ id: s.id, name: s.name, note: s.note || '适量就好' })),
    snack: snack
      ? { id: snack.id, name: snack.name, note: snack.note || '少量当作奖励' }
      : { id: 'none', name: '今天不加零食', note: '控制总热量' },
    reason,
    tip: pick(PANTRY_TIPS),
    source: 'pantry',
    at: new Date().toISOString(),
  };
}

export function prefsText(prefs: FoodPref[]): string {
  return prefs.length > 0 ? prefs.map((p) => PREF_LABEL[p]).join(' · ') : '不限定偏好';
}
