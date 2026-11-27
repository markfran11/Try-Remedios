import pool from "../config/db.js";

// Columns are renamed (AS) so the JSON uses the same names as the React page.
// DATE_FORMAT keeps the dates as plain "YYYY-MM-DD" text (no timezone shifting).
const PROMOTION_COLUMNS = `
  id, name, apply_to AS applyTo, type, value, code,
  DATE_FORMAT(start_date, '%Y-%m-%d') AS startDate,
  DATE_FORMAT(end_date, '%Y-%m-%d') AS endDate,
  usage_limit AS usageLimit, used, disabled`;

// MySQL gives DECIMAL as text and TINYINT as 0/1, so clean them up here
const toPromotion = (row, productIds) => ({
  ...row,
  value: Number(row.value),
  disabled: Boolean(row.disabled),
  productIds: productIds || [],
});

const insertProducts = async (conn, promotionId, productIds) => {
  if (productIds.length === 0) return;
  await conn.query(
    "INSERT INTO promotion_product(promotion_id, product_id) VALUES ?",
    [productIds.map((productId) => [promotionId, productId])],
  );
};

// Retrieve
export const fetch = async () => {
  const [rows] = await pool.query(
    `SELECT ${PROMOTION_COLUMNS} FROM promotion ORDER BY id`,
  );
  const [links] = await pool.query(
    "SELECT promotion_id, product_id FROM promotion_product",
  );

  return rows.map((row) =>
    toPromotion(
      row,
      links.filter((l) => l.promotion_id === row.id).map((l) => l.product_id),
    ),
  );
};

export const findPromotionById = async (id) => {
  const [rows] = await pool.query(
    `SELECT ${PROMOTION_COLUMNS} FROM promotion WHERE id = ?`,
    [id],
  );
  const [links] = await pool.query(
    "SELECT product_id FROM promotion_product WHERE promotion_id = ?",
    [id],
  );
  return rows.map((row) => toPromotion(row, links.map((l) => l.product_id)));
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
      "INSERT INTO promotion(name, apply_to, type, value, code, start_date, end_date, usage_limit) VALUES (?,?,?,?,?,?,?,?)",
      [
        promotion.name,
        promotion.applyTo,
        promotion.type,
        promotion.value,
        promotion.code,
        promotion.startDate,
        promotion.endDate,
        promotion.usageLimit,
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

// update
export const update = async (promotion) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [result] = await conn.query(
      "UPDATE promotion SET name= ?, apply_to= ?, type= ?, value= ?, code= ?, start_date= ?, end_date= ?, usage_limit= ? WHERE id= ? ",
      [
        promotion.name,
        promotion.applyTo,
        promotion.type,
        promotion.value,
        promotion.code,
        promotion.startDate,
        promotion.endDate,
        promotion.usageLimit,
        promotion.id,
      ],
    );
    await conn.query("DELETE FROM promotion_product WHERE promotion_id= ?", [
      promotion.id,
    ]);
    await insertProducts(conn, promotion.id, promotion.productIds);
    await conn.commit();
    return result.affectedRows;
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
};

// Count one use. The checks and the +1 happen in ONE statement, so two orders at the
// same time can never go past the usage limit. Returns 1 if counted, 0 if it can't be used.
export const incrementUsed = async (id, today) => {
  const [result] = await pool.query(
    `UPDATE promotion SET used = used + 1
     WHERE id = ? AND disabled = 0 AND start_date <= ? AND end_date >= ?
       AND (usage_limit = 0 OR used < usage_limit)`,
    [id, today, today],
  );
  return result.affectedRows;
};

// enable / disable
export const updateDisabled = async (id, disabled) => {
  const [result] = await pool.query(
    "UPDATE promotion SET disabled= ? WHERE id= ? ",
    [disabled ? 1 : 0, id],
  );
  return result.affectedRows;
};
