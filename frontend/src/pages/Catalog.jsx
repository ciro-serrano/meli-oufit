import { useEffect, useState } from "react";
import Filters from "../components/Filters";
import ProductCard from "../components/ProductCard";
import { getProducts, getCategories } from "../api";
import ProductSkeleton from "../components/ProductSkeleton";

const EMPTY_FILTERS = { gender: "", season: "", category: "" };

export default function Catalog() {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [slow, setSlow] = useState(false);

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

  useEffect(() => {
    if (!loading) return;
    const t = setTimeout(() => setSlow(true), 8000);
    return () => {
      clearTimeout(t);
      setSlow(false);
    };
  }, [loading]);

  return (
    <main className="container">
      <Filters
        filters={filters}
        categories={categories}
        onChange={setFilters}
      />

      {loading && (
        <>
          {slow && (
            <p className="status" role="status">
              Estamos preparando la tienda, un momento…
            </p>
          )}
          <div className="grid" aria-busy="true">
            {Array.from({ length: 8 }, (_, i) => (
              <ProductSkeleton key={i} />
            ))}
          </div>
        </>
      )}
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
