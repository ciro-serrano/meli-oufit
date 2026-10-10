import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

// GET /api/products?gender=mujer&season=verano&category=remeras
router.get("/", async (req, res) => {
  try {
    const { gender, season, category } = req.query;

    let sql = `
      SELECT p.id, p.name, p.slug, p.price, p.gender, p.season,
             c.name AS category,
             (SELECT url FROM product_images i
               WHERE i.product_id = p.id
               ORDER BY i.position LIMIT 1) AS image,
             COALESCE((SELECT SUM(v.stock) FROM product_variants v
               WHERE v.product_id = p.id), 0) AS total_stock
      FROM products p
      JOIN categories c ON c.id = p.category_id
      WHERE p.is_active = 1`;
    const params = [];

    if (gender) {
      sql += " AND p.gender = ?";
      params.push(gender);
    }
    if (season) {
      sql += " AND p.season = ?";
      params.push(season);
    }
    if (category) {
      sql += " AND c.slug = ?";
      params.push(category);
    }

    sql += " ORDER BY p.created_at DESC";

    const [rows] = await pool.query(sql, params);

    res.json(
      rows.map((p) => ({
        ...p,
        price: Number(p.price),
        total_stock: Number(p.total_stock),
        in_stock: Number(p.total_stock) > 0,
      })),
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener productos" });
  }
});

// GET /api/products/remera-basica-algodon
router.get("/:slug", async (req, res) => {
  try {
    const [products] = await pool.query(
      `SELECT p.id, p.name, p.slug, p.description, p.price,
              p.gender, p.season, c.name AS category
       FROM products p
       JOIN categories c ON c.id = p.category_id
       WHERE p.slug = ? AND p.is_active = 1`,
      [req.params.slug],
    );

    if (products.length === 0) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    const product = products[0];

    const [variants] = await pool.query(
      "SELECT id, size, color, stock FROM product_variants WHERE product_id = ? ORDER BY id",
      [product.id],
    );

    const [images] = await pool.query(
      "SELECT url, position FROM product_images WHERE product_id = ? ORDER BY position",
      [product.id],
    );

    res.json({ ...product, price: Number(product.price), variants, images });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener el producto" });
  }
});

export default router;
