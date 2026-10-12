import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { formatPrice } from "../utils";
import { buildWhatsAppUrl } from "../whatsapp";

export default function Cart() {
  const { items, changeQty, removeItem, clear, total } = useCart();

  if (items.length === 0) {
    return (
      <main className="container">
        <p className="status">Tu carrito está vacío.</p>
        <p className="status">
          <Link to="/" className="back">
            Ver productos
          </Link>
        </p>
      </main>
    );
  }

  return (
    <main className="container">
      <h2 className="page-title">Tu carrito</h2>

      <ul className="cart-list">
        {items.map((item) => (
          <li key={item.variantId} className="cart-item">
            <img className="cart-img" src={item.image} alt={item.name} />
            <div className="cart-body">
              <Link to={`/producto/${item.slug}`} className="cart-name">
                {item.name}
              </Link>
              <div className="cart-variant">
                {[item.size, item.color]
                  .filter((v) => v !== "Único")
                  .join(" · ")}
              </div>
              <div className="cart-price">{formatPrice(item.price)}</div>
              <div className="qty">
                <button
                  type="button"
                  aria-label="Quitar una unidad"
                  disabled={item.qty <= 1}
                  onClick={() => changeQty(item.variantId, item.qty - 1)}
                >
                  −
                </button>
                <span>{item.qty}</span>
                <button
                  type="button"
                  aria-label="Sumar una unidad"
                  disabled={item.qty >= item.stock}
                  onClick={() => changeQty(item.variantId, item.qty + 1)}
                >
                  +
                </button>
                <button
                  type="button"
                  className="link-btn"
                  onClick={() => removeItem(item.variantId)}
                >
                  Quitar
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="cart-total">
        <span>Total</span>
        <strong>{formatPrice(total)}</strong>
      </div>

      <a
        className="btn-primary"
        href={buildWhatsAppUrl(items, total)}
        target="_blank"
        rel="noopener noreferrer"
      >
        Pedir por WhatsApp
      </a>
      <button type="button" className="link-btn" onClick={clear}>
        Vaciar carrito
      </button>
    </main>
  );
}
