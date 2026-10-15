import express from "express";
import cors from "cors";
import "dotenv/config";
import { pool } from "./db.js";
import productsRouter from "./routes/products.js";
import authRouter from "./routes/auth.js";
import adminRouter from "./routes/admin.js";
import { requireAuth } from "./middleware/auth.js";

if (!process.env.JWT_SECRET) {
  console.error("Falta JWT_SECRET en el archivo .env");
  process.exit(1);
}

const app = express();
app.set("trust proxy", 1);
const allowedOrigins = (process.env.FRONTEND_URL || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

// Sin FRONTEND_URL (tu PC) acepta cualquier origen; en producción, solo el de Vercel
app.use(cors({ origin: allowedOrigins.length ? allowedOrigins : true }));
app.use(express.json());
app.use("/api/products", productsRouter);
app.use("/api/auth", authRouter);
app.use("/api/admin", requireAuth, adminRouter);

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
