import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { adminFetch } from "../adminApi";
import { useAuth } from "../context/AuthContext";
import { formatPrice, thumb } from "../utils";

const GENDER_LABEL = { mujer: "Mujer", hombre: "Hombre", unisex: "Unisex" };
const SEASON_LABEL = {
  verano: "Verano",
  invierno: "Invierno",
  todo_el_anio: "Todo el año",
};

// Para que "algodon" encuentre "algodón"
const normalize = (s) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

export default function AdminHome() {
  const { logout } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    adminFetch("/api/admin/products")
      .then(setProducts)
      .catch((e) => {
        if (e.status === 401)
          logout(); // sesión vencida: vuelve al login
        else setError(e.message);
      })
      .finally(() => setLoading(false));
  }, [logout]);

  const visibleProducts = useMemo(() => {
    const q = normalize(query.trim());
    return q ? products.filter((p) => normalize(p.name).includes(q)) : products;
  }, [products, query]);

  const toggleActive = async (product) => {
    const next = !product.is_active;
    setError("");

    // Cambiamos en pantalla enseguida y, si falla, volvemos atrás
    const update = (value) =>
      setProducts((list) =>
        list.map((p) => (p.id === product.id ? { ...p, is_active: value } : p)),
      );
    update(next);

    try {
      await adminFetch(`/api/admin/products/${product.id}`, {
        method: "PATCH",
        body: { is_active: next },
      });
    } catch (e) {
      update(!next);
      if (e.status === 401) logout();
      else setError(e.message);
    }
  };

  return (
    <main className="container">
      <div className="admin-head">
        <h2 className="page-title">Productos</h2>
        <button type="button" className="link-btn" onClick={logout}>
          Cerrar sesión
        </button>
      </div>

      <div className="toolbar">
        <input
          className="search"
          type="search"
          placeholder="Buscar producto…"
          aria-label="Buscar producto"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Link to="/admin/productos/nuevo" className="btn-small">
          + Nuevo
        </Link>
      </div>

      {loading && <p className="status">Cargando productos…</p>}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {!loading && !error && products.length === 0 && (
        <p className="status">Todavía no cargaste productos.</p>
      )}
      {!loading && products.length > 0 && visibleProducts.length === 0 && (
        <p className="status">No encontramos productos con ese nombre.</p>
      )}

      <ul className="admin-list">
        {visibleProducts.map((p) => (
          <li
            key={p.id}
            className={`admin-item ${p.is_active ? "" : "hidden"}`}
          >
            <img
              className="admin-thumb"
              src={thumb(p.image, 160)}
              alt=""
              loading="lazy"
            />

            <div className="admin-info">
              <span className="admin-name">{p.name}</span>
              <span className="admin-meta">
                {p.category} · {GENDER_LABEL[p.gender]} ·{" "}
                {SEASON_LABEL[p.season]}
              </span>
              <span className="admin-meta">{formatPrice(p.price)}</span>
              <div>
                <span
                  className={`stock-pill ${p.total_stock === 0 ? "empty" : ""}`}
                >
                  {p.total_stock === 0
                    ? "Sin stock"
                    : `${p.total_stock} en stock`}
                </span>
              </div>

              <div className="admin-actions">
                <button
                  type="button"
                  className="switch"
                  role="switch"
                  aria-checked={p.is_active}
                  onClick={() => toggleActive(p)}
                >
                  <span className="switch-track" aria-hidden="true" />
                  {p.is_active ? "Visible" : "Oculto"}
                </button>
                <Link to={`/admin/productos/${p.id}`} className="link-btn">
                  Editar
                </Link>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
