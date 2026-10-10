import express from "express";
import cors from "cors";
import "dotenv/config";
import { pool } from "./db.js";
import productsRouter from "./routes/products.js";

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/products", productsRouter);

// ¿El servidor y la base están vivos?
app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ ok: true, db: "conectada" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, db: "sin conexión" });
  }
});

// Prueba: leer las categorías que cargaste
app.get("/api/categories", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT id, name, slug FROM categories");
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener categorías" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor en http://localhost:${PORT}`));
