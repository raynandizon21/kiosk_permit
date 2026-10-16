import { pool } from "../config/database.js";

export async function findUserByUsername(username) {
  const [rows] = await pool.execute(
    `SELECT IDNo, FIRST_NAME, LAST_NAME, POSITION, USERNAME, PASSWORD
     FROM user_info WHERE USERNAME = ? AND ACTIVE = 1`,
    [username.trim()]
  );
  return rows[0] ?? null;
}

export async function findUserName(id) {
  const [rows] = await pool.execute(
    "SELECT CONCAT(FIRST_NAME, ' ', LAST_NAME) AS NAME FROM user_info WHERE IDNo = ?",
    [id]
  );
  return rows[0]?.NAME ?? "Admin";
}
