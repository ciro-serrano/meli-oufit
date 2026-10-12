const API = import.meta.env.VITE_API_URL;

export async function getProducts(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  const query = params.toString();
  const res = await fetch(`${API}/api/products${query ? `?${query}` : ""}`);
  if (!res.ok) throw new Error("No se pudieron cargar los productos");
  return res.json();
}

export async function getCategories() {
  const res = await fetch(`${API}/api/categories`);
  if (!res.ok) throw new Error("No se pudieron cargar las categorías");
  return res.json();
}

export async function getProduct(slug) {
  const res = await fetch(`${API}/api/products/${slug}`);
  if (res.status === 404) throw new Error("Producto no encontrado");
  if (!res.ok) throw new Error("No se pudo cargar el producto");
  return res.json();
}
