/** Return the next enabled option, wrapping at either end; -1 means no candidate. */
export function nextEnabledIndex(
  options: readonly { disabled?: boolean }[],
  current: number,
  direction: 1 | -1,
): number {
  if (options.length === 0) return -1;
  let index = current < 0 || current >= options.length
    ? (direction === 1 ? -1 : 0)
    : current;
  for (let visited = 0; visited < options.length; visited++) {
    index = (index + direction + options.length) % options.length;
    if (!options[index].disabled) return index;
  }
  return -1;
}
