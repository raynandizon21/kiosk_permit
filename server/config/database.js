import mysql from "mysql2/promise";

export const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || "localhost",
  port: Number(process.env.MYSQL_PORT) || 3306,
  user: process.env.MYSQL_USER || "root",
  password: process.env.MYSQL_PASSWORD || "",
  database: process.env.MYSQL_DATABASE || "kiosk_permit",
  waitForConnections: true,
  connectionLimit: 10,
  // Keep DATE/DATETIME as plain strings (no timezone shift) and DECIMAL as numbers
  dateStrings: true,
  decimalNumbers: true,
});

export async function testConnection() {
  await pool.execute("SELECT 1");
  console.log("MySQL connected:", process.env.MYSQL_DATABASE || "kiosk_permit");
}
