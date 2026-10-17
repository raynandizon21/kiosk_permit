import { pool } from "../config/database.js";

export async function createPayment(data) {
  const [result] = await pool.execute(
    `INSERT INTO payment
     (STUDENT_ID, PERIOD_ID, OR_NUMBER, AMOUNT, PAYMENT_METHOD, ALLOCATION, REMARKS, PAYMENT_DT, ENCODED_BY)
     VALUES (?, ?, ?, ?, ?, ?, ?, CURDATE(), ?)`,
    [
      data.student_id,
      data.period_id,
      data.or_number,
      data.amount,
      data.payment_method,
      data.allocation,
      data.remarks,
      data.encoded_by,
    ]
  );
  return result.insertId;
}

export async function updateOrNumber(id, orNumber) {
  await pool.execute("UPDATE payment SET OR_NUMBER = ? WHERE IDNo = ?", [orNumber, id]);
}
