import { zipSync, strToU8 } from 'fflate';
import type { ExportColumn } from './table-export.ts';
const xml = (value: unknown) =>
  String(value ?? '')
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
const name = (index: number): string =>
  index < 26
    ? String.fromCharCode(65 + index)
    : name(Math.floor(index / 26) - 1) + name(index % 26);
/** Native OOXML workbook: numbers remain numeric; user strings are never formulas. */
export function tableXlsx<T>(rows: T[], columns: ExportColumn<T>[]) {
  if (!columns.length || columns.length > 16384 || rows.length > 1048575)
    throw new Error('Excel satır veya sütun sınırı aşıldı. Filtrelerinizi daraltın.');
  const values = [
    columns.map((c) => c.label),
    ...rows.map((row) => columns.map((c) => c.value(row))),
  ];
  const sheet =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>' +
    columns
      .map(
        (c, i) =>
          `<col min="${i + 1}" max="${i + 1}" width="${Math.min(48, Math.max(14, c.label.length + 4))}" customWidth="1"/>`,
      )
      .join('') +
    '</cols><sheetData>' +
    values
      .map(
        (row, y) =>
          `<row r="${y + 1}">` +
          row
            .map((value, x) => {
              const position = `${name(x)}${y + 1}`;
              if (typeof value === 'number' && Number.isFinite(value))
                return `<c r="${position}"><v>${value}</v></c>`;
              if (typeof value === 'boolean')
                return `<c r="${position}" t="b"><v>${value ? 1 : 0}</v></c>`;
              return `<c r="${position}" t="inlineStr"><is><t xml:space="preserve">${xml(String(value ?? '').slice(0, 32767))}</t></is></c>`;
            })
            .join('') +
          '</row>',
      )
      .join('') +
    `</sheetData><autoFilter ref="A1:${name(columns.length - 1)}${rows.length + 1}"/></worksheet>`;
  const files = {
    '[Content_Types].xml':
      '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>',
    '_rels/.rels':
      '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
    'xl/workbook.xml':
      '<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Kayıtlar" sheetId="1" r:id="rId1"/></sheets></workbook>',
    'xl/_rels/workbook.xml.rels':
      '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>',
    'xl/worksheets/sheet1.xml': sheet,
  };
  return zipSync(
    Object.fromEntries(Object.entries(files).map(([path, content]) => [path, strToU8(content)])),
    { level: 1 },
  );
}
export function downloadXlsx<T>(filename: string, rows: T[], columns: ExportColumn<T>[]) {
  const bytes = tableXlsx(rows, columns);
  const url = URL.createObjectURL(
    new Blob([new Uint8Array(bytes)], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
  );
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
