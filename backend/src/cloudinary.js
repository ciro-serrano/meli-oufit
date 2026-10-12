import { v2 as cloudinary } from "cloudinary";
import "dotenv/config";

if (!process.env.CLOUDINARY_API_SECRET) {
  console.warn(
    "Aviso: falta configurar Cloudinary en el .env (no se podrán subir fotos)",
  );
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Sube una foto que está en memoria. La guarda con un máximo de 1600 px
export function uploadBuffer(buffer, folder = "meli-outfit/products") {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        transformation: [
          { width: 1600, height: 1600, crop: "limit", quality: "auto" },
        ],
      },
      (error, result) => (error ? reject(error) : resolve(result)),
    );
    stream.end(buffer);
  });
}

export function deleteImage(publicId) {
  return cloudinary.uploader.destroy(publicId);
}
