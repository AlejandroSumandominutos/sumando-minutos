export async function compressImageBeforeUpload(file, options = {}) {
  if (!(file instanceof File) || !file.type.startsWith('image/')) throw new Error('Selecciona una imagen válida.');
  const { maxDimension = 1600, targetBytes = 500 * 1024, minQuality = .55 } = options;
  let source;
  let releaseSource = () => {};
  try {
    if (typeof createImageBitmap !== 'function') throw new Error('createImageBitmap no disponible');
    source = await createImageBitmap(file, { imageOrientation: 'from-image' });
    releaseSource = () => source.close?.();
  } catch (bitmapError) {
    const objectUrl = URL.createObjectURL(file);
    try {
      source = await new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('El dispositivo no pudo leer la fotografía seleccionada.'));
        image.src = objectUrl;
      });
      releaseSource = () => URL.revokeObjectURL(objectUrl);
    } catch (fallbackError) {
      URL.revokeObjectURL(objectUrl);
      throw new Error('No fue posible procesar esta fotografía. Intenta tomarla nuevamente desde la cámara o elige otra imagen.');
    }
  }
  const sourceWidth = source.width || source.naturalWidth;
  const sourceHeight = source.height || source.naturalHeight;
  const scale = Math.min(1, maxDimension / Math.max(sourceWidth, sourceHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(sourceWidth * scale));
  canvas.height = Math.max(1, Math.round(sourceHeight * scale));
  canvas.getContext('2d', { alpha: false }).drawImage(source, 0, 0, canvas.width, canvas.height);
  releaseSource();
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
