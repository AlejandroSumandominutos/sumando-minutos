export async function compressImageBeforeUpload(file, options = {}) {
  if (!(file instanceof File) || !file.type.startsWith('image/')) throw new Error('Selecciona una imagen válida.');
  const { maxDimension = 1600, targetBytes = 500 * 1024, minQuality = .55 } = options;
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  canvas.getContext('2d', { alpha: false }).drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const mime = canvas.toDataURL('image/webp').startsWith('data:image/webp') ? 'image/webp' : 'image/jpeg';
  let quality = .84;
  let blob;
  do {
    blob = await new Promise(resolve => canvas.toBlob(resolve, mime, quality));
    quality -= .07;
  } while (blob && blob.size > targetBytes && quality >= minQuality);
  if (!blob) throw new Error('No fue posible comprimir la imagen.');
  return new File([blob], `${crypto.randomUUID()}.${mime === 'image/webp' ? 'webp' : 'jpg'}`, { type: mime });
}

export async function uploadUserImage(supabase, bucket, userId, file) {
  const compressed = await compressImageBeforeUpload(file);
  const path = `${userId}/${Date.now()}-${compressed.name}`;
  const { error } = await supabase.storage.from(bucket).upload(path, compressed, { contentType: compressed.type, upsert: false });
  if (error) throw error;
  return path;
}
