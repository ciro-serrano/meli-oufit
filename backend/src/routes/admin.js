import { Router } from "express";
import { pool } from "../db.js";
import multer from "multer";
import { uploadBuffer, deleteImage } from "../cloudinary.js";

const router = Router();

const GENDERS = ["mujer", "hombre", "unisex"];
const SEASONS = ["verano", "invierno", "todo_el_anio"];
const MAX_IMAGES = 3;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: MAX_IMAGES },
  fileFilter: (req, file, cb) => {
    if (["image/jpeg", "image/png", "image/webp"].includes(file.mimetype))
      cb(null, true);
    else cb(new Error("Solo se aceptan fotos JPG, PNG o WEBP"));
  },
});

// ---------- Helpers ----------

function parseId(value) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

// "Remera Básica Ñandú!" -> "remera-basica-nandu"
function slugify(text) {
  return (
    text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .slice(0, 100)
      .replace(/^-+|-+$/g, "") || "producto"
  );
}

// Si "short-deportivo" ya existe, prueba "short-deportivo-2", "-3", etc.
async function uniqueSlug(conn, name) {
  const base = slugify(name);
  let slug = base;
  let n = 2;
  while (true) {
    const [rows] = await conn.query("SELECT 1 FROM products WHERE slug = ?", [
      slug,
    ]);
    if (rows.length === 0) return slug;
    slug = `${base}-${n++}`;
  }
}

function sendDbError(res, error, fallback) {
  if (error.code === "ER_NO_REFERENCED_ROW_2") {
    return res.status(400).json({ error: "La categoría elegida no existe" });
  }
  if (error.code === "ER_DUP_ENTRY") {
    return res
      .status(400)
      .json({ error: "Hay un talle y color repetido en las variantes" });
  }
  console.error(error);
  res.status(500).json({ error: fallback });
}

// Valida lo que manda el formulario. Devuelve { error } o { data }
function validateProduct(body) {
  const b = body ?? {};

  const name = typeof b.name === "string" ? b.name.trim() : "";
  if (!name || name.length > 120) {
    return { error: "El nombre es obligatorio (máximo 120 caracteres)" };
  }

  const price = Number(b.price);
  if (!Number.isFinite(price) || price <= 0 || price >= 100000000) {
    return { error: "El precio debe ser un número mayor a 0" };
  }

  const categoryId = Number(b.category_id);
  if (!Number.isInteger(categoryId) || categoryId < 1) {
    return { error: "Elegí una categoría" };
  }

  const gender = b.gender ?? "unisex";
  if (!GENDERS.includes(gender)) return { error: "Género inválido" };

  const season = b.season ?? "todo_el_anio";
  if (!SEASONS.includes(season)) return { error: "Temporada inválida" };

  if (!Array.isArray(b.variants) || b.variants.length === 0) {
    return { error: "Cargá al menos una variante (talle, color y stock)" };
  }

  const seen = new Set();
  const variants = [];
  for (const v of b.variants) {
    const size = (typeof v?.size === "string" && v.size.trim()) || "Único";
    const color = (typeof v?.color === "string" && v.color.trim()) || "Único";
    const stock = Number(v?.stock);

    if (size.length > 20 || color.length > 40) {
      return { error: "El talle o el color es demasiado largo" };
    }
    if (!Number.isInteger(stock) || stock < 0 || stock > 100000) {
      return { error: "El stock debe ser un número entero, 0 o más" };
    }

    const key = `${size.toLowerCase()}|${color.toLowerCase()}`;
    if (seen.has(key))
      return { error: `Variante repetida: ${size} / ${color}` };
    seen.add(key);

    variants.push({
      id: v?.id == null ? null : Number(v.id),
      size,
      color,
      stock,
    });
  }

  return {
    data: {
      name,
      description:
        typeof b.description === "string" && b.description.trim()
          ? b.description.trim()
          : null,
      price,
      categoryId,
      gender,
      season,
      isActive: b.is_active === undefined ? null : b.is_active ? 1 : 0,
      variants,
    },
  };
}

// ---------- Productos ----------

// GET /api/admin/products
router.get("/products", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT p.id, p.name, p.slug, p.price, p.gender, p.season, p.is_active,
             c.name AS category,
             (SELECT url FROM product_images i
               WHERE i.product_id = p.id ORDER BY i.position LIMIT 1) AS image,
             COALESCE((SELECT SUM(v.stock) FROM product_variants v
               WHERE v.product_id = p.id), 0) AS total_stock
      FROM products p
      JOIN categories c ON c.id = p.category_id
      ORDER BY p.created_at DESC`);

    res.json(
      rows.map((p) => ({
        ...p,
        price: Number(p.price),
        total_stock: Number(p.total_stock),
        is_active: !!p.is_active,
      })),
    );
  } catch (error) {
    sendDbError(res, error, "Error al obtener los productos");
  }
});

// GET /api/admin/products/:id
router.get("/products/:id", async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ error: "ID inválido" });

    const [products] = await pool.query(
      `SELECT id, category_id, name, slug, description, price, gender, season, is_active
       FROM products WHERE id = ?`,
      [id],
    );
    if (products.length === 0)
      return res.status(404).json({ error: "Producto no encontrado" });

    const [variants] = await pool.query(
      "SELECT id, size, color, stock FROM product_variants WHERE product_id = ? ORDER BY id",
      [id],
    );
    const [images] = await pool.query(
      "SELECT id, url, position FROM product_images WHERE product_id = ? ORDER BY position",
      [id],
    );

    const p = products[0];
    res.json({
      ...p,
      price: Number(p.price),
      is_active: !!p.is_active,
      variants,
      images,
    });
  } catch (error) {
    sendDbError(res, error, "Error al obtener el producto");
  }
});

// POST /api/admin/products
router.post("/products", async (req, res) => {
  const check = validateProduct(req.body);
  if (check.error) return res.status(400).json({ error: check.error });
  const data = check.data;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const slug = await uniqueSlug(conn, data.name);
    const [result] = await conn.query(
      `INSERT INTO products
         (category_id, name, slug, description, price, gender, season, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.categoryId,
        data.name,
        slug,
        data.description,
        data.price,
        data.gender,
        data.season,
        data.isActive ?? 1,
      ],
    );
    const productId = result.insertId;

    for (const v of data.variants) {
      await conn.query(
        "INSERT INTO product_variants (product_id, size, color, stock) VALUES (?, ?, ?, ?)",
        [productId, v.size, v.color, v.stock],
      );
    }

    await conn.commit();
    res.status(201).json({ id: productId, slug });
  } catch (error) {
    await conn.rollback();
    sendDbError(res, error, "Error al crear el producto");
  } finally {
    conn.release();
  }
});

// PUT /api/admin/products/:id
router.put("/products/:id", async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: "ID inválido" });

  const check = validateProduct(req.body);
  if (check.error) return res.status(400).json({ error: check.error });
  const data = check.data;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // El slug NO cambia al editar, para que los links ya compartidos sigan andando
    const [updated] = await conn.query(
      `UPDATE products
       SET category_id = ?, name = ?, description = ?, price = ?,
           gender = ?, season = ?, is_active = COALESCE(?, is_active)
       WHERE id = ?`,
      [
        data.categoryId,
        data.name,
        data.description,
        data.price,
        data.gender,
        data.season,
        data.isActive,
        id,
      ],
    );
    if (updated.affectedRows === 0) {
      await conn.rollback();
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    // Variantes: las que traen id se actualizan, las nuevas se agregan,
    // y las que ya no vienen en la lista se borran.
    const [existing] = await conn.query(
      "SELECT id FROM product_variants WHERE product_id = ?",
      [id],
    );
    const existingIds = new Set(existing.map((v) => v.id));
    const keepIds = data.variants
      .filter((v) => v.id !== null && existingIds.has(v.id))
      .map((v) => v.id);

    const toDelete = [...existingIds].filter((vid) => !keepIds.includes(vid));
    if (toDelete.length > 0) {
      await conn.query(
        "DELETE FROM product_variants WHERE product_id = ? AND id IN (?)",
        [id, toDelete],
      );
    }

    for (const v of data.variants) {
      if (v.id !== null && existingIds.has(v.id)) {
        await conn.query(
          "UPDATE product_variants SET size = ?, color = ?, stock = ? WHERE id = ? AND product_id = ?",
          [v.size, v.color, v.stock, v.id, id],
        );
      } else {
        await conn.query(
          "INSERT INTO product_variants (product_id, size, color, stock) VALUES (?, ?, ?, ?)",
          [id, v.size, v.color, v.stock],
        );
      }
    }

    await conn.commit();
    res.json({ ok: true });
  } catch (error) {
    await conn.rollback();
    sendDbError(res, error, "Error al actualizar el producto");
  } finally {
    conn.release();
  }
});

// PATCH /api/admin/products/:id   body: { "is_active": false }
router.patch("/products/:id", async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ error: "ID inválido" });

    if (typeof req.body?.is_active !== "boolean") {
      return res.status(400).json({ error: "is_active debe ser true o false" });
    }

    const [result] = await pool.query(
      "UPDATE products SET is_active = ? WHERE id = ?",
      [req.body.is_active ? 1 : 0, id],
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Producto no encontrado" });

    res.json({ ok: true, is_active: req.body.is_active });
  } catch (error) {
    sendDbError(res, error, "Error al cambiar la visibilidad");
  }
});

// ---------- Variantes ----------

// PATCH /api/admin/variants/:id   body: { "stock": 8 }
router.patch("/variants/:id", async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ error: "ID inválido" });

    const stock = Number(req.body?.stock);
    if (!Number.isInteger(stock) || stock < 0 || stock > 100000) {
      return res
        .status(400)
        .json({ error: "El stock debe ser un número entero, 0 o más" });
    }

    const [result] = await pool.query(
      "UPDATE product_variants SET stock = ? WHERE id = ?",
      [stock, id],
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Variante no encontrada" });

    res.json({ ok: true, stock });
  } catch (error) {
    sendDbError(res, error, "Error al actualizar el stock");
  }
});
// ---------- Fotos ----------

// POST /api/admin/products/:id/images   (multipart, campo "images")
router.post(
  "/products/:id/images",
  (req, res, next) => {
    upload.array("images", MAX_IMAGES)(req, res, (err) => {
      if (!err) return next();
      let message = err.message;
      if (err.code === "LIMIT_FILE_SIZE")
        message = "Cada foto puede pesar hasta 8 MB";
      if (err.code === "LIMIT_UNEXPECTED_FILE")
        message = `Podés subir hasta ${MAX_IMAGES} fotos por vez`;
      res.status(400).json({ error: message });
    });
  },
  async (req, res) => {
    try {
      const id = parseId(req.params.id);
      if (!id) return res.status(400).json({ error: "ID inválido" });

      const files = req.files ?? [];
      if (files.length === 0) {
        return res.status(400).json({ error: "No se recibió ninguna foto" });
      }

      const [products] = await pool.query(
        "SELECT id FROM products WHERE id = ?",
        [id],
      );
      if (products.length === 0)
        return res.status(404).json({ error: "Producto no encontrado" });

      const [existing] = await pool.query(
        "SELECT position FROM product_images WHERE product_id = ?",
        [id],
      );
      if (existing.length + files.length > MAX_IMAGES) {
        return res.status(400).json({
          error: `Cada producto puede tener hasta ${MAX_IMAGES} fotos (ya tiene ${existing.length})`,
        });
      }

      // Posiciones libres (1, 2, 3) que no estén ocupadas
      const taken = new Set(existing.map((i) => i.position));
      const free = [];
      for (let pos = 1; pos <= MAX_IMAGES; pos++)
        if (!taken.has(pos)) free.push(pos);

      const added = [];
      for (let i = 0; i < files.length; i++) {
        const result = await uploadBuffer(files[i].buffer);
        const [inserted] = await pool.query(
          "INSERT INTO product_images (product_id, url, public_id, position) VALUES (?, ?, ?, ?)",
          [id, result.secure_url, result.public_id, free[i]],
        );
        added.push({
          id: inserted.insertId,
          url: result.secure_url,
          position: free[i],
        });
      }

      res.status(201).json({ images: added });
    } catch (error) {
      sendDbError(res, error, "Error al subir las fotos");
    }
  },
);

// DELETE /api/admin/images/:id
router.delete("/images/:id", async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ error: "ID inválido" });

    const [rows] = await pool.query(
      "SELECT id, public_id FROM product_images WHERE id = ?",
      [id],
    );
    if (rows.length === 0)
      return res.status(404).json({ error: "Foto no encontrada" });

    await pool.query("DELETE FROM product_images WHERE id = ?", [id]);

    if (rows[0].public_id) {
      try {
        await deleteImage(rows[0].public_id);
      } catch (e) {
        console.error("No se pudo borrar la foto de Cloudinary:", e);
      }
    }
    res.json({ ok: true });
  } catch (error) {
    sendDbError(res, error, "Error al borrar la foto");
  }
});

// DELETE /api/admin/products/:id   (borra el producto, sus variantes y sus fotos)
router.delete("/products/:id", async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ error: "ID inválido" });

    const [images] = await pool.query(
      "SELECT public_id FROM product_images WHERE product_id = ?",
      [id],
    );
    const [result] = await pool.query("DELETE FROM products WHERE id = ?", [
      id,
    ]);
    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Producto no encontrado" });

    for (const img of images) {
      if (!img.public_id) continue;
      try {
        await deleteImage(img.public_id);
      } catch (e) {
        console.error("No se pudo borrar la foto de Cloudinary:", e);
      }
    }
    res.json({ ok: true });
  } catch (error) {
    sendDbError(res, error, "Error al borrar el producto");
  }
});

export default router;
