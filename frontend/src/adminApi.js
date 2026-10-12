const API = import.meta.env.VITE_API_URL;
const TOKEN_KEY = "meli-outfit-token";

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Si el navegador no deja guardar, seguimos igual
  }
}

// Pedido al backend con el token incluido. Acepta JSON o FormData (para las fotos)
export async function adminFetch(path, { method = "GET", body } = {}) {
  const token = getToken();
  const isForm = body instanceof FormData;

  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      ...(body && !isForm ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const error = new Error(data.error || "Ocurrió un error");
    error.status = res.status;
    throw error;
  }
  return data;
}
