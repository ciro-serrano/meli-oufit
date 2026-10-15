import path from "node:path";
import dotenv from "dotenv";
import mysql from "mysql2/promise";

const [envFile, sql] = process.argv.slice(2);
if (!envFile || !sql) {
  console.error(
    'Uso: node src/scripts/query.js <archivo.env> "<consulta SQL>"',
  );
  process.exit(1);
}

dotenv.config({ path: path.resolve(envFile) });

try {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl:
      process.env.DB_SSL === "true"
        ? { minVersion: "TLSv1.2", rejectUnauthorized: true }
        : undefined,
  });

  const [rows] = await conn.query(sql);
  console.table(rows);
  await conn.end();
} catch (err) {
  console.error("✘ Error:", err.message);
  process.exit(1);
}
