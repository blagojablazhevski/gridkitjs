/**
 * The shape behind a click or keypress that changes sort, resize, or
 * selection state: compute the next value, bail out if it's reference-equal
 * to the current one, persist it, then report it. Returns whether it
 * actually committed, for a caller with more to do only when it did.
 */
export function commitIfChanged<T>(
  current: T,
  next: T,
  setState: (value: T) => void,
  onCommit?: (next: T) => void,
): boolean {
  if (next === current) {
    return false;
  }
  setState(next);
  onCommit?.(next);
  return true;
}
