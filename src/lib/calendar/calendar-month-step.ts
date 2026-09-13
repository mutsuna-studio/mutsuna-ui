export function stepCalendarMonth(year: number, month: number, offset: number, years: number[], months: number[], isAllowed: (year: number, month: number) => boolean = () => true): { year: number; month: number } {
  const candidates = [...new Set(years)].sort((a, b) => a - b).flatMap((year) =>
    [...new Set(months)].sort((a, b) => a - b).filter((month) => isAllowed(year, month)).map((month) => ({ year, month })));
  if (!candidates.length || !offset) return { year, month };
  const key = year * 12 + month;
  let index = candidates.findIndex((item) => item.year === year && item.month === month);
  if (index < 0) {
    index = offset > 0 ? candidates.findIndex((item) => item.year * 12 + item.month > key) : candidates.reduce((found, item, i) => item.year * 12 + item.month < key ? i : found, -1);
    if (index < 0) return { year, month };
    offset -= Math.sign(offset);
  }
  return candidates[Math.max(0, Math.min(candidates.length - 1, index + offset))];
}
