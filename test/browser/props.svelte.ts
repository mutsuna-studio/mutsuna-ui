/** Update mounted component props without coupling tests to internal component state. */
export function reactiveProps<T extends object>(initial: T): T {
  const props = $state(initial);
  return props;
}
