import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";

export default function Header() {
  const { count } = useCart();

  return (
    <header className="header">
      <Link to="/" className="brand">
        <div className="logo">M</div>
        <h1>Meli Outfit</h1>
      </Link>

      <Link
        to="/carrito"
        className="cart-link"
        aria-label={`Carrito, ${count} productos`}
      >
        <svg
          width="26"
          height="26"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="9" cy="21" r="1" />
          <circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
        </svg>
        {count > 0 && <span className="cart-count">{count}</span>}
      </Link>
    </header>
  );
}
