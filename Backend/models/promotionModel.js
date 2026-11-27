import pool from "../config/db.js";

// Columns are renamed (AS) so the JSON uses the same names as the React page.
// DATE_FORMAT keeps the dates as plain "YYYY-MM-DD" text (no timezone shifting).
const PROMOTION_COLUMNS = `
  id, name, apply_to AS applyTo, type, value, code`;

// MySQL gives DECIMAL as text and TINYINT as 0/1, so clean them up here
const toPromotion = (row, productIds) => ({
  ...row,
  value: Number(row.value),
  productIds: productIds || [],
});

const insertProducts = async (conn, promotionId, productIds) => {
  if (productIds.length === 0) return;
  await conn.query(
    "INSERT INTO promotion_product(promotion_id, product_id) VALUES ?",
    [productIds.map((productId) => [promotionId, productId])],
  );
};

export const findPromotionByCode = async (code) => {
  const [rows] = await pool.query(
    `SELECT ${PROMOTION_COLUMNS} FROM promotion WHERE code = ?`,
    [code],
  );
  return rows.map((row) => toPromotion(row, []));
};

// Products (read only, owned by the Inventory page: product table) used by the "Apply To" picker and the pricing
export const fetchProducts = async () => {
  const [rows] = await pool.query(
    "SELECT product_id AS id, product_name AS name, category, price, stock_quantity AS stock, NULL AS image FROM product WHERE status = 'active' ORDER BY category, product_name",
  );
  return rows.map((row) => ({ ...row, price: Number(row.price) }));
};

// insert (promotion + its products are saved together, or not at all)
export const insert = async (promotion) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [result] = await conn.query(
      "INSERT INTO promotion(name, apply_to, type, value, code) VALUES (?,?,?,?,?)",
      [
        promotion.name,
        promotion.applyTo,
        promotion.type,
        promotion.value,
        promotion.code,
      ],
    );
    await insertProducts(conn, result.insertId, promotion.productIds);
    await conn.commit();
    return result.insertId;
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
};
