import pool from "../config/db.js";

// insert
export const insert = async (promotion) => {
  const [result] = await pool.query(
    "INSERT INTO promotion(name, type, value) VALUES (?,?,?)",
    [promotion.name, promotion.type, promotion.value],
  );
  return result.insertId;
};
