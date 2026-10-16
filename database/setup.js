// npm run db:setup — creates the kiosk_permit database, tables, and sample data.
// WARNING: drops and recreates every table of this system (see schema.sql).
import "dotenv/config";
import { readFile } from "node:fs/promises";
import mysql from "mysql2/promise";

const dir = new URL(".", import.meta.url);

const conn = await mysql.createConnection({
  host: process.env.MYSQL_HOST || "localhost",
  port: Number(process.env.MYSQL_PORT) || 3306,
  user: process.env.MYSQL_USER || "root",
  password: process.env.MYSQL_PASSWORD || "",
  multipleStatements: true,
});

try {
  for (const file of ["schema.sql", "seed.sql"]) {
    await conn.query(await readFile(new URL(file, dir), "utf8"));
    console.log(`✓ ${file}`);
  }
  console.log("Database ready. Admin login: admin / admin123");
} finally {
  await conn.end();
}
