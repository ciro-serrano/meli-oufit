import { createContext, useContext, useEffect, useState } from "react";

const CartContext = createContext(null);
const STORAGE_KEY = "meli-outfit-cart";

function loadCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadCart);

  // Cada vez que cambia el carrito, lo guardamos
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Si el navegador no deja guardar, seguimos igual
    }
  }, [items]);

  const addItem = (item) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.variantId === item.variantId);
      if (existing) {
        return prev.map((i) =>
          i.variantId === item.variantId
            ? { ...i, stock: item.stock, qty: Math.min(i.qty + 1, item.stock) }
            : i,
        );
      }
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const changeQty = (variantId, qty) =>
    setItems((prev) =>
      prev.map((i) =>
        i.variantId === variantId
          ? { ...i, qty: Math.max(1, Math.min(qty, i.stock)) }
          : i,
      ),
    );

  const removeItem = (variantId) =>
    setItems((prev) => prev.filter((i) => i.variantId !== variantId));

  const clear = () => setItems([]);

  const count = items.reduce((n, i) => n + i.qty, 0);
  const total = items.reduce((sum, i) => sum + i.qty * i.price, 0);

  return (
    <CartContext.Provider
      value={{ items, addItem, changeQty, removeItem, clear, count, total }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
