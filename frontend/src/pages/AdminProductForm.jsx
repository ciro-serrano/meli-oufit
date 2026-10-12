import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getCategories } from "../api";
import { adminFetch } from "../adminApi";
import { useAuth } from "../context/AuthContext";
import PhotoPicker from "../components/PhotoPicker.jsx";

const SIZE_OPTIONS = [
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "XXL",
  "36",
  "38",
  "40",
  "42",
  "44",
  "46",
];
const COLOR_OPTIONS = [
  "Negro",
  "Blanco",
  "Gris",
  "Azul",
  "Celeste",
  "Rojo",
  "Rosa",
  "Verde",
  "Beige",
  "Marrón",
];

// Cada fila necesita una clave estable para que React no se confunda al quitar filas
let counter = 0;
const newKey = () => `new-${++counter}`;
const emptyVariant = (color = "") => ({
  key: newKey(),
  size: "",
  color,
  stock: "",
});

const EMPTY_FORM = {
  name: "",
  description: "",
  price: "",
  category_id: "",
  gender: "unisex",
  season: "todo_el_anio",
  is_active: true,
  unique: false,
  variants: [emptyVariant()],
};

function fromProduct(p) {
  const unique =
    p.variants.length === 1 &&
    p.variants[0].size === "Único" &&
    p.variants[0].color === "Único";
  return {
    name: p.name,
    description: p.description ?? "",
    price: String(p.price),
    category_id: String(p.category_id),
    gender: p.gender,
    season: p.season,
    is_active: p.is_active,
    unique,
    variants: p.variants.map((v) => ({
      key: v.id,
      id: v.id,
      size: v.size,
      color: v.color,
      stock: String(v.stock),
    })),
  };
}

export default function AdminProductForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [form, setForm] = useState(EMPTY_FORM);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [existingPhotos, setExistingPhotos] = useState([]);
  const [pendingPhotos, setPendingPhotos] = useState([]);

  useEffect(() => {
    let ignore = false;
    const requests = [getCategories()];
    if (isEdit) requests.push(adminFetch(`/api/admin/products/${id}`));

    Promise.all(requests)
      .then(([cats, product]) => {
        if (ignore) return;
        setCategories(cats);
        if (product) {
          setForm(fromProduct(product));
          setExistingPhotos(product.images || []);
        }
      })
      .catch((e) => {
        if (ignore) return;
        if (e.status === 401) logout();
        else setError(e.message);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [id, isEdit, logout]);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const setVariant = (index, key, value) =>
    setForm((f) => ({
      ...f,
      variants: f.variants.map((v, i) =>
        i === index ? { ...v, [key]: value } : v,
      ),
    }));

  const addVariant = () =>
    setForm((f) => {
      // La fila nueva arranca con el mismo color que la anterior (es lo más común)
      const last = f.variants[f.variants.length - 1];
      return {
        ...f,
        variants: [...f.variants, emptyVariant(last?.color ?? "")],
      };
    });

  const removeVariant = (index) =>
    setForm((f) => ({
      ...f,
      variants: f.variants.filter((_, i) => i !== index),
    }));

  const toggleUnique = (checked) => {
    if (checked && form.variants.length > 1) {
      const ok = window.confirm(
        "Se van a quitar los demás talles y colores, y quedará una sola unidad. ¿Seguir?",
      );
      if (!ok) return;
    }
    setForm((f) => {
      const first = f.variants[0];
      return {
        ...f,
        unique: checked,
        variants: [
          {
            key: first.key,
            id: first.id,
            size: checked ? "Único" : "",
            color: checked ? "Único" : "",
            stock: first.stock,
          },
        ],
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const price = Number(form.price);
    if (!form.name.trim()) return setError("Escribí el nombre del producto");
    if (!(price > 0)) return setError("Ingresá un precio mayor a 0");
    if (!form.category_id) return setError("Elegí una categoría");
    if (
      !form.unique &&
      form.variants.some((v) => !v.size.trim() && !v.color.trim())
    ) {
      return setError("Completá el talle o el color en cada fila");
    }

    const body = {
      name: form.name,
      description: form.description,
      price,
      category_id: Number(form.category_id),
      gender: form.gender,
      season: form.season,
      is_active: form.is_active,
      variants: form.variants.map((v) => ({
        id: v.id,
        size: form.unique ? "Único" : v.size,
        color: form.unique ? "Único" : v.color,
        stock: Number(v.stock) || 0,
      })),
    };

    setSaving(true);
    try {
      let savedId = id;

      if (isEdit) {
        await adminFetch(`/api/admin/products/${id}`, { method: "PUT", body });
      } else {
        const created = await adminFetch("/api/admin/products", {
          method: "POST",
          body,
        });
        savedId = created.id; // en producto nuevo, lo devuelve el backend
      }

      // `savedId` = id del producto recién creado, o el id que ya estás editando
      if (pendingPhotos.length) {
        const fd = new FormData();
        pendingPhotos.forEach((p) => fd.append("images", p.file));
        try {
          await adminFetch(`/api/admin/products/${savedId}/images`, {
            method: "POST",
            body: fd,
          });
        } catch (err) {
          // El producto YA quedó guardado: llevamos a Melina a editarlo
          // para que reintente solo las fotos (y no cree un duplicado).
          navigate(`/admin/productos/${savedId}`);
          return;
        }
      }
      navigate("/admin");
    } catch (err) {
      if (err.status === 401) logout();
      else setError(err.message);
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const ok = window.confirm(
      "¿Borrar este producto para siempre? Se borran también sus fotos.\n\nSi solo querés que no se vea en la tienda, es mejor ocultarlo.",
    );
    if (!ok) return;

    try {
      await adminFetch(`/api/admin/products/${id}`, { method: "DELETE" });
      navigate("/admin");
    } catch (err) {
      if (err.status === 401) logout();
      else setError(err.message);
    }
  };

  if (loading) return <p className="status">Cargando…</p>;

  return (
    <main className="container auth-box">
      <Link to="/admin" className="back">
        ← Volver a productos
      </Link>
      <h2 className="page-title">
        {isEdit ? "Editar producto" : "Nuevo producto"}
      </h2>
      <PhotoPicker
        existing={existingPhotos}
        pending={pendingPhotos}
        onAdd={(nuevas) => setPendingPhotos((prev) => [...prev, ...nuevas])}
        onRemovePending={(key) =>
          setPendingPhotos((prev) => prev.filter((p) => p.key !== key))
        }
        onRemoveExisting={async (id) => {
          if (!window.confirm("¿Quitar esta foto?")) return;
          try {
            await adminFetch(`/api/admin/images/${id}`, { method: "DELETE" });
            setExistingPhotos((prev) => prev.filter((p) => p.id !== id));
          } catch (err) {
            setError(err.message);
          }
        }}
      />

      <form onSubmit={handleSubmit} className="form">
        <label className="field">
          <span>Nombre</span>
          <input
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            maxLength={120}
            required
          />
        </label>

        <label className="field">
          <span>Precio ($)</span>
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="any"
            value={form.price}
            onChange={(e) => set("price", e.target.value)}
            required
          />
        </label>

        <label className="field">
          <span>Categoría</span>
          <select
            value={form.category_id}
            onChange={(e) => set("category_id", e.target.value)}
            required
          >
            <option value="">Elegir…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Para</span>
          <select
            value={form.gender}
            onChange={(e) => set("gender", e.target.value)}
          >
            <option value="mujer">Mujer</option>
            <option value="hombre">Hombre</option>
            <option value="unisex">Unisex</option>
          </select>
        </label>

        <label className="field">
          <span>Temporada</span>
          <select
            value={form.season}
            onChange={(e) => set("season", e.target.value)}
          >
            <option value="verano">Verano</option>
            <option value="invierno">Invierno</option>
            <option value="todo_el_anio">Todo el año</option>
          </select>
        </label>

        <label className="field">
          <span>Descripción (opcional)</span>
          <textarea
            rows={4}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
          />
        </label>

        <label className="check">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => set("is_active", e.target.checked)}
          />
          Mostrar en la tienda
        </label>

        <h3 className="section-title">Talles, colores y stock</h3>

        <label className="check">
          <input
            type="checkbox"
            checked={form.unique}
            onChange={(e) => toggleUnique(e.target.checked)}
          />
          Prenda única (sin talles ni colores)
        </label>

        <datalist id="size-options">
          {SIZE_OPTIONS.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
        <datalist id="color-options">
          {COLOR_OPTIONS.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>

        {form.variants.map((v, i) => (
          <div key={v.key} className="variant-card">
            {!form.unique && (
              <>
                <label className="field">
                  <span>Talle</span>
                  <input
                    list="size-options"
                    value={v.size}
                    onChange={(e) => setVariant(i, "size", e.target.value)}
                    maxLength={20}
                  />
                </label>
                <label className="field">
                  <span>Color</span>
                  <input
                    list="color-options"
                    value={v.color}
                    onChange={(e) => setVariant(i, "color", e.target.value)}
                    maxLength={40}
                  />
                </label>
              </>
            )}

            <label className="field">
              <span>Stock</span>
              <input
                type="number"
                inputMode="numeric"
                min="0"
                step="1"
                value={v.stock}
                onChange={(e) => setVariant(i, "stock", e.target.value)}
              />
            </label>

            {!form.unique && (
              <button
                type="button"
                className="link-btn variant-remove"
                onClick={() => removeVariant(i)}
                disabled={form.variants.length === 1}
              >
                Quitar fila
              </button>
            )}
          </div>
        ))}

        {!form.unique && (
          <button type="button" className="btn-outline" onClick={addVariant}>
            + Agregar otro talle o color
          </button>
        )}

        <div className="form-actions">
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Guardando…" : "Guardar"}
          </button>
        </div>

        {isEdit && (
          <button
            type="button"
            className="link-btn danger"
            onClick={handleDelete}
          >
            Borrar producto
          </button>
        )}
      </form>
    </main>
  );
}
