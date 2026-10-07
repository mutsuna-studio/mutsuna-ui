/** Move an item to a target position while retaining locked items at their original indices. */
export function reorderItems<T>(items: readonly T[], sourceKey: string, targetKey: string,
  getKey: (item: T) => string, isLocked: (item: T) => boolean): T[] | null {
  const sourceIndex = items.findIndex(item => getKey(item) === sourceKey);
  const targetIndex = items.findIndex(item => getKey(item) === targetKey);
  if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex || isLocked(items[sourceIndex])) return null;
  const candidate = [...items];
  const [source] = candidate.splice(sourceIndex, 1);
  candidate.splice(targetIndex, 0, source);
  const movable = candidate.filter(item => !isLocked(item));
  let index = 0;
  const result = items.map(item => isLocked(item) ? item : movable[index++]);
  return result.every((item, i) => item === items[i]) ? null : result;
}
