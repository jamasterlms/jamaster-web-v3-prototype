export const imageTypes = ['image/jpeg', 'image/png', 'image/webp'];
export function imageFileError(file: { type: string; size: number }) {
  if (!imageTypes.includes(file.type)) return 'JPG, PNG veya WebP dosyası seçin.';
  if (file.size > 5 * 1024 * 1024) return 'Fotoğraf en fazla 5 MB olabilir.';
  if (!file.size) return 'Dosya boş.';
  return null;
}
export function isLocalProfileImage(value: string) {
  return (
    value.length <= 400000 &&
    /^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(value)
  );
}
export async function prepareProfileImage(file: File): Promise<string> {
  const error = imageFileError(file);
  if (error) throw new Error(error);
  const bitmap = await createImageBitmap(file);
  try {
    if (!bitmap.width || !bitmap.height || bitmap.width * bitmap.height > 40000000)
      throw new Error('Görsel boyutları desteklenmiyor.');
    const ratio = Math.min(1, 384 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * ratio);
    canvas.height = Math.round(bitmap.height * ratio);
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Görsel işlenemedi.');
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const value = canvas.toDataURL('image/webp', 0.85);
    if (!isLocalProfileImage(value))
      throw new Error('Görsel çok büyük. Daha küçük bir dosya seçin.');
    return value;
  } finally {
    bitmap.close();
  }
}
