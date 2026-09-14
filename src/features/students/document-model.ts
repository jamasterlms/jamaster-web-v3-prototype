export type LocalDocumentFile = { name: string; type: string; dataUrl: string };
export function documentFileIssue(file: LocalDocumentFile) {
  if (
    !file.name ||
    !['application/pdf', 'image/png', 'image/jpeg', 'image/webp'].includes(file.type)
  )
    return 'PDF, PNG, JPEG veya WebP dosyası seçin.';
  if (!file.dataUrl.startsWith(`data:${file.type};base64,`) || file.dataUrl.length > 1500000)
    return 'Dosya okunamıyor veya 1 MB sınırını aşıyor.';
  const encoded = file.dataUrl.split(',')[1];
  if (!encoded || !/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)) return 'Dosya içeriği geçersiz.';
  try {
    const header = atob(encoded.slice(0, 32));
    if (
      !(file.type === 'application/pdf'
        ? header.startsWith('%PDF-')
        : file.type === 'image/png'
          ? header.startsWith('\x89PNG\r\n\x1a\n')
          : file.type === 'image/jpeg'
            ? header.startsWith('\xff\xd8\xff')
            : header.startsWith('RIFF') && header.slice(8, 12) === 'WEBP')
    )
      return 'Dosyanın içeriği seçilen dosya türüyle eşleşmiyor.';
  } catch {
    return 'Dosya okunamadı.';
  }
  return null;
}
