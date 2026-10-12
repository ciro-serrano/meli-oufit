import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// Máximo 10 intentos de login cada 15 minutos por IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiados intentos. Probá de nuevo en unos minutos." },
});

// POST /api/auth/login
router.post("/login", loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body ?? {};

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email ||
      !password
    ) {
      return res.status(400).json({ error: "Falta el email o la contraseña" });
    }

    const [rows] = await pool.query(
      "SELECT id, email, password_hash FROM admins WHERE email = ?",
      [email.trim().toLowerCase()],
    );
    const admin = rows[0];

    const ok = admin && (await bcrypt.compare(password, admin.password_hash));
    if (!ok) {
      // Mismo mensaje si falla el email o la contraseña: no damos pistas
      return res.status(401).json({ error: "Email o contraseña incorrectos" });
    }

    const token = jwt.sign(
      { id: admin.id, email: admin.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.json({ token, admin: { id: admin.id, email: admin.email } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al iniciar sesión" });
  }
});

// GET /api/auth/me  (ruta protegida de prueba)
router.get("/me", requireAuth, (req, res) => {
  res.json({ admin: { id: req.admin.id, email: req.admin.email } });
});

export default router;
