import type { EntityRef } from './entity-model';

export type PreviewState = { items: EntityRef[]; index: number };
export const emptyPreview: PreviewState = { items: [], index: -1 };
const same = (a: EntityRef, b: EntityRef) => a.kind === b.kind && a.id === b.id;

/** A list preserves its filtered order; links within a preview form a bounded history. */
export function openPreview(
  state: PreviewState,
  entity: EntityRef,
  collection?: EntityRef[],
): PreviewState {
  if (collection?.length) {
    const seen = new Set<string>();
    const items = collection.filter((item) => {
      const key = `${item.kind}:${item.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    const index = items.findIndex((item) => same(item, entity));
    if (index >= 0) return { items, index };
  }
  if (state.items[state.index] && same(state.items[state.index], entity)) return state;
  const items = [...state.items.slice(0, state.index + 1), entity].slice(-100);
  return { items, index: items.length - 1 };
}

export function movePreview(state: PreviewState, direction: -1 | 1): PreviewState {
  const index = state.index + direction;
  return index < 0 || index >= state.items.length ? state : { ...state, index };
}
