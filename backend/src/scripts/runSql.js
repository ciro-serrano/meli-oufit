import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import mysql from "mysql2/promise";

const [envFile, sqlFile] = process.argv.slice(2);
if (!envFile || !sqlFile) {
  console.error("Uso: node src/scripts/runSql.js <archivo.env> <archivo.sql>");
  process.exit(1);
}

dotenv.config({ path: path.resolve(envFile) });

try {
  // Sin "database": el .sql crea la base y entra a ella con USE
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl:
      process.env.DB_SSL === "true"
        ? { minVersion: "TLSv1.2", rejectUnauthorized: true }
        : undefined,
    multipleStatements: true,
  });

  await conn.query(fs.readFileSync(path.resolve(sqlFile), "utf8"));
  console.log("✔ SQL ejecutado correctamente");
  await conn.end();
} catch (err) {
  console.error("✘ Error:", err.message);
  process.exit(1);
}
