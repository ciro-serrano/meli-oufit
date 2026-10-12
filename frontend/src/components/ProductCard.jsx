import { Link } from "react-router-dom";
import { formatPrice } from "../utils";

export default function ProductCard({ product }) {
  return (
    <Link to={`/producto/${product.slug}`} className="card-link">
      <article className="card">
        <img
          className="card-img"
          src={product.image}
          alt={product.name}
          loading="lazy"
        />
        <div className="card-name">{product.name}</div>
        <div className="card-price">{formatPrice(product.price)}</div>
        {!product.in_stock && <span className="badge">Sin stock</span>}
      </article>
    </Link>
  );
}
