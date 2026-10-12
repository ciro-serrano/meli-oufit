import { formatPrice } from "./utils";

const PHONE = import.meta.env.VITE_WHATSAPP_NUMBER;

export function buildWhatsAppUrl(items, total) {
  const lines = items.map((i) => {
    const detail = [i.size, i.color].filter((v) => v !== "Único").join(", ");
    return `• ${i.qty} x ${i.name}${detail ? ` (${detail})` : ""} - ${formatPrice(i.price * i.qty)}`;
  });

  const text = [
    "¡Hola! Quiero hacer este pedido en Meli Outfit:",
    "",
    ...lines,
    "",
    `Total: ${formatPrice(total)}`,
    "",
    "¿Me confirmás disponibilidad y cómo coordinamos la entrega?",
  ].join("\n");

  return `https://wa.me/${PHONE}?text=${encodeURIComponent(text)}`;
}
