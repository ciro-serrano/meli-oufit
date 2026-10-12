export const formatPrice = (n) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n);

// Pide a Cloudinary una versión más chica y liviana de la foto (recortada 3:4)
export function thumb(url, width = 200) {
  if (!url || !url.includes("/upload/")) return url;
  return url.replace(
    "/upload/",
    `/upload/c_fill,ar_3:4,w_${width},f_auto,q_auto/`,
  );
}
