/** Match path plus the query values declared by a menu destination. */
export function navIsActive(target: string, pathname: string, search = '') {
  const [path, query = ''] = target.replace(/^\//, '').split('?');
  if (path !== pathname.replace(/^\//, '')) return false;
  const expected = new URLSearchParams(query),
    current = new URLSearchParams(search);
  return [...expected.keys()].every((key) =>
    expected.getAll(key).every((value) => current.getAll(key).includes(value)),
  );
}
