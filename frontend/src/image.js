// Achica una foto en el celular antes de subirla.
// Devuelve un File JPEG de máx. 1600px de lado mayor.
export async function compressImage(file, maxSize = 1600, quality = 0.8) {
  // 'from-image' respeta la rotación EXIF (si no, las fotos sacadas
  // con la cámara pueden quedar de costado)
  const bitmap = await createImageBitmap(file, {
    imageOrientation: "from-image",
  });

  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  canvas.getContext("2d").drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();

  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", quality),
  );
  if (!blob) throw new Error("No se pudo procesar la foto");

  const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
  return new File([blob], name, { type: "image/jpeg" });
}
