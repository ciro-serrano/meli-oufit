import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getProduct } from "../api";
import { formatPrice } from "../utils";
import { useCart } from "../context/CartContext";
import { thumb } from "../utils";

export default function ProductPage() {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [imgIndex, setImgIndex] = useState(0);
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const { addItem, items } = useCart();
  const [added, setAdded] = useState(false);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError("");
    setImgIndex(0);

    getProduct(slug)
      .then((data) => {
        if (ignore) return;
        setProduct(data);
        // Preseleccionamos la primera variante que tenga stock
        const first =
          data.variants.find((v) => v.stock > 0) ?? data.variants[0];
        if (first) {
          setSize(first.size);
          setColor(first.color);
        }
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
  }, [slug]);
  // Si cambia de talle, color o producto, borramos el aviso "Agregado"
  useEffect(() => {
    setAdded(false);
  }, [size, color, slug]);

  if (loading) return <p className="status">Cargando…</p>;
  if (error || !product)
    return <p className="status">{error || "Producto no encontrado"}</p>;

  const { variants, images } = product;
  const sizes = [...new Set(variants.map((v) => v.size))];
  const colors = [...new Set(variants.map((v) => v.color))];
  const selected = variants.find((v) => v.size === size && v.color === color);

  // ¿Hay al menos una variante con stock para este talle / color?
  const inStock = (key, value) =>
    variants.some((v) => v[key] === value && v.stock > 0);

  const showSizes = !(sizes.length === 1 && sizes[0] === "Único");
  const showColors = !(colors.length === 1 && colors[0] === "Único");

  const inCart = items.find((i) => i.variantId === selected?.id)?.qty ?? 0;
  const atMax = !!selected && inCart >= selected.stock;

  let stockMsg = "";
  if (!selected) stockMsg = "Esa combinación no está disponible";
  else if (selected.stock === 0) stockMsg = "Sin stock";
  else if (atMax)
    stockMsg = "Ya tenés en el carrito todas las unidades disponibles";
  else if (selected.stock === 1) stockMsg = "¡Última unidad!";

  const handleAdd = () => {
    addItem({
      variantId: selected.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      size: selected.size,
      color: selected.color,
      image: images[0]?.url,
      stock: selected.stock,
    });
    setAdded(true);
  };

  return (
    <main className="container">
      <Link to="/" className="back">
        ← Volver al catálogo
      </Link>

      <div className="product-layout">
        <div className="gallery">
          <img
            className="gallery-main"
            src={thumb(images[imgIndex]?.url, 900)}
            alt={product.name}
          />
          {images.length > 1 && (
            <div className="thumbs">
              {images.map((img, i) => (
                <button
                  key={img.position}
                  type="button"
                  className={`thumb ${i === imgIndex ? "active" : ""}`}
                  aria-label={`Ver foto ${i + 1}`}
                  onClick={() => setImgIndex(i)}
                >
                  <img src={thumb(img.url, 120)} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="product-info">
          <h2 className="product-name">{product.name}</h2>
          <p className="product-price">{formatPrice(product.price)}</p>
          {product.description && (
            <p className="product-desc">{product.description}</p>
          )}

          {showSizes && (
            <div className="option-group">
              <span className="option-label">Talle</span>
              <div className="options">
                {sizes.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={`chip ${s === size ? "active" : ""}`}
                    aria-pressed={s === size}
                    disabled={!inStock("size", s)}
                    onClick={() => setSize(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {showColors && (
            <div className="option-group">
              <span className="option-label">Color</span>
              <div className="options">
                {colors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`chip ${c === color ? "active" : ""}`}
                    aria-pressed={c === color}
                    disabled={!inStock("color", c)}
                    onClick={() => setColor(c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          <p className="stock-msg">
            {added ? (
              <>
                Agregado al carrito. <Link to="/carrito">Ver carrito</Link>
              </>
            ) : (
              stockMsg
            )}
          </p>

          <button
            type="button"
            className="btn-primary"
            disabled={!selected || selected.stock === 0 || atMax}
            onClick={handleAdd}
          >
            Agregar al carrito
          </button>
        </div>
      </div>
    </main>
  );
}
