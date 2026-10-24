export const pad2 = (n: number) => String(n).padStart(2, '0');

export function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function todayStr(): string {
  return toDateStr(new Date());
}

export function parseDate(s: string): Date {
  return new Date(`${s}T00:00:00`);
}

export function addDays(s: string, n: number): string {
  const d = parseDate(s);
  d.setDate(d.getDate() + n);
  return toDateStr(d);
}

export function diffDays(a: string, b: string): number {
  return Math.round((parseDate(b).getTime() - parseDate(a).getTime()) / 86400000);
}

export function weekdayCN(s: string): string {
  return ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][parseDate(s).getDay()];
}

export function shortDate(s: string): string {
  const d = parseDate(s);
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

export function nowTime(): string {
  const d = new Date();
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

export function ageText(birthday: string): string {
  if (!birthday) return '生日未知';
  const b = parseDate(birthday);
  const now = new Date();
  let months = (now.getFullYear() - b.getFullYear()) * 12 + (now.getMonth() - b.getMonth());
  if (now.getDate() < b.getDate()) months -= 1;
  if (months < 0) return '生日未知';
  if (months < 12) return `${months} 个月`;
  const years = Math.floor(months / 12);
  const rest = months % 12;
  return rest === 0 ? `${years} 岁` : `${years} 岁 ${rest} 个月`;
}

export function monthsOld(birthday: string): number {
  if (!birthday) return 24;
  const b = parseDate(birthday);
  const now = new Date();
  let months = (now.getFullYear() - b.getFullYear()) * 12 + (now.getMonth() - b.getMonth());
  if (now.getDate() < b.getDate()) months -= 1;
  return Math.max(0, months);
}

export function relativeDay(s: string): string {
  const t = todayStr();
  if (s === t) return '今天';
  if (s === addDays(t, 1)) return '明天';
  if (s === addDays(t, -1)) return '昨天';
  return shortDate(s);
}

export function greeting(): string {
  const h = new Date().getHours();
  if (h < 6) return '夜猫子时光';
  if (h < 11) return '早上好';
  if (h < 14) return '午安';
  if (h < 18) return '下午好';
  return '晚上好';
}

export function monthDayLabel(): string {
  const d = new Date();
  return `${d.getMonth() + 1}月${d.getDate()}日 · ${weekdayCN(todayStr())}`;
}
