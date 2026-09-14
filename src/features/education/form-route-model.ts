export function formRouteRecord<T extends { id: string }>(
  records: T[],
  params: URLSearchParams,
  key: string,
) {
  const requested = params.has(key);
  const id = params.get(key);
  return { requested, record: requested && id ? records.find((r) => r.id === id) : undefined };
}
