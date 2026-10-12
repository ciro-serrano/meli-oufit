import { useRef, useState } from "react";
import { compressImage } from "../image.js";
import { thumb } from "../utils.js";

export default function PhotoPicker({
  existing, // [{ id, url }] fotos ya guardadas
  pending, // [{ key, file, preview }] fotos nuevas, todavía sin subir
  max = 3,
  onAdd, // (nuevasFotos) => void
  onRemoveExisting, // (id) => void
  onRemovePending, // (key) => void
}) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const total = existing.length + pending.length;
  const left = max - total;

  async function handleChange(e) {
    const files = Array.from(e.target.files || []);
    e.target.value = ""; // permite elegir la misma foto de nuevo
    if (!files.length) return;

    setError("");
    setBusy(true);
    try {
      const chosen = files.slice(0, left);
      const compressed = await Promise.all(chosen.map((f) => compressImage(f)));
      onAdd(
        compressed.map((file) => ({
          key: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          file,
          preview: URL.createObjectURL(file),
        })),
      );
      if (files.length > left) {
        setError(`Solo entran ${max} fotos por producto.`);
      }
    } catch {
      setError("No se pudo leer alguna foto. Probá con otra.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="field">
      <label>
        Fotos ({total}/{max})
      </label>

      <div className="photo-grid">
        {existing.map((p, i) => (
          <div className="photo-item" key={`e${p.id}`}>
            <img src={thumb(p.url, 300)} alt="" />
            {i === 0 && total > 0 && (
              <span className="photo-main">Principal</span>
            )}
            <button
              type="button"
              className="photo-remove"
              aria-label="Quitar foto"
              onClick={() => onRemoveExisting(p.id)}
            >
              ×
            </button>
          </div>
        ))}

        {pending.map((p) => (
          <div className="photo-item" key={p.key}>
            <img src={p.preview} alt="" />
            <span className="photo-new">Nueva</span>
            <button
              type="button"
              className="photo-remove"
              aria-label="Quitar foto"
              onClick={() => onRemovePending(p.key)}
            >
              ×
            </button>
          </div>
        ))}

        {left > 0 && (
          <button
            type="button"
            className="photo-add"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
          >
            {busy ? "Procesando…" : "+ Agregar foto"}
          </button>
        )}
      </div>

      {/* Sin "capture": en el celu ofrece elegir entre Cámara y Galería */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={handleChange}
      />

      <p className="hint">La primera foto es la que se ve en el catálogo.</p>
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}
