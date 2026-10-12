import { useEffect, useState } from "react";
import Filters from "../components/Filters";
import ProductCard from "../components/ProductCard";
import { getProducts, getCategories } from "../api";

const EMPTY_FILTERS = { gender: "", season: "", category: "" };

export default function Catalog() {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => {});
  }, []);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError("");

    getProducts(filters)
      .then((data) => {
        if (!ignore) setProducts(data);
      })
      .catch((e) => {
        if (!ignore) setError(e.message);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [filters]);

  return (
    <main className="container">
      <Filters
        filters={filters}
        categories={categories}
        onChange={setFilters}
      />

      {loading && <p className="status">Cargando productos…</p>}
      {error && <p className="status">{error}</p>}
      {!loading && !error && products.length === 0 && (
        <p className="status">No hay productos con esos filtros.</p>
      )}
      {!loading && !error && products.length > 0 && (
        <div className="grid">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </main>
  );
}
