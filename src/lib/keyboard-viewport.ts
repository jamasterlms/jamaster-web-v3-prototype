/** Compare unzoomed heights: a smaller visual viewport can also mean pinch zoom. */
export function isSoftwareKeyboardVisible({
  editable,
  coarse,
  baseline,
  height,
  scale,
}: {
  editable: boolean;
  coarse: boolean;
  baseline: number;
  height: number;
  scale: number;
}) {
  return editable && coarse && baseline - height * scale > 120;
}
