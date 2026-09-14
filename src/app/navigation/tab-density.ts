/** Compact in order: remove icons, reduce horizontal space, then reduce type slightly. */
export function tabDensity(count: number, availableRem: number): 0 | 1 | 2 | 3 {
  if (count <= 3) return 0;
  const perTab = availableRem > 0 ? availableRem / count : 12;
  if (count >= 12 || perTab < 6.75) return 3;
  if (count >= 9 || perTab < 8.25) return 2;
  if (count >= 6 || perTab < 10) return 1;
  return 0;
}
