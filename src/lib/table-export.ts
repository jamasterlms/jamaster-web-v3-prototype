export type ExportValue = string | number | boolean | null | undefined;
export type ExportColumn<T> = { key: string; label: string; value: (row: T) => ExportValue };
export type TableExport<T> = { filename: string; columns: ExportColumn<T>[] };

/** Remove only confirmed successes; failed or newly selected rows remain available for retry. */
export function clearCompletedSelection(
  selection: Record<string, boolean>,
  completed?: readonly string[],
) {
  if (!completed) return {};
  const ids = new Set(completed);
  return Object.fromEntries(Object.entries(selection).filter(([id]) => !ids.has(id)));
}

/** Keep only explicitly selected, currently available records. Hidden selections never reappear. */
export function retainSelection(selection: Record<string, boolean>, ids: readonly string[]) {
  const available = new Set(ids);
  const entries = Object.entries(selection).filter(([id, checked]) => checked && available.has(id));
  return entries.length === Object.keys(selection).length ? selection : Object.fromEntries(entries);
}

export function serializeCSV(rows: readonly (readonly unknown[])[]) {
  return (
    '\uFEFF' +
    rows
      .map((row) =>
        row
          .map((value) => {
            const text = String(value ?? '');
            // Spreadsheet applications may ignore whitespace before interpreting a formula.
            const escaped =
              typeof value !== 'number' &&
              (/^[\s\u0000-\u001f]*[=+@-]/.test(text) || /^[\t\r\n]/.test(text))
                ? "'" + text
                : text;
            return '"' + escaped.replaceAll('"', '""') + '"';
          })
          .join(';'),
      )
      .join('\r\n')
  );
}

export function serializeTable<T>(rows: T[], columns: ExportColumn<T>[], format: 'csv' | 'json') {
  return format === 'csv'
    ? serializeCSV([
        columns.map((c) => c.label),
        ...rows.map((row) => columns.map((c) => c.value(row))),
      ])
    : JSON.stringify(
        rows.map((row) => Object.fromEntries(columns.map((c) => [c.key, c.value(row) ?? null]))),
        null,
        2,
      );
}

export function downloadText(filename: string, content: string, type: string) {
  const href = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement('a');
  anchor.href = href;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(href), 1000);
}
