import bcrypt from "bcryptjs";
import { pool } from "../db.js";

const [email, password] = process.argv.slice(2);

if (!email || !password) {
  console.log("Uso: node src/scripts/createAdmin.js <email> <contraseña>");
  process.exit(1);
}
if (password.length < 8) {
  console.log("La contraseña debe tener al menos 8 caracteres.");
  process.exit(1);
}

const hash = await bcrypt.hash(password, 12);

await pool.query(
  `INSERT INTO admins (email, password_hash) VALUES (?, ?)
   ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)`,
  [email.trim().toLowerCase(), hash],
);

console.log(`Listo: administrador ${email} creado o actualizado.`);
await pool.end();
