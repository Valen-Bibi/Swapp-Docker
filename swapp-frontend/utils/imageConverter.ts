// src/utils/imageConverter.ts

export function base64ToBlob(base64: string, mimeType: string = 'image/jpeg'): Blob {
  // Limpiamos la cabecera "data:image/jpeg;base64," si existe
  const byteString = atob(base64.split(',')[1]);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);

  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }

  return new Blob([ab], { type: mimeType });
}