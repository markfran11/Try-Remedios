
import pool from '../config/db.js';

export const fetch = async () => {
  const [rows] = await pool.query(
    "SELECT * FROM product WHERE status = 'active' ORDER BY product_id"
  );
  return rows;
};

export const fetchAll = async () => {
  const [rows] = await pool.query("SELECT * FROM product ORDER BY product_id");
  return rows;
};

export const findProductById = async (id) => {
  const [rows] = await pool.query(
    "SELECT * FROM product WHERE product_id = ?", [id]
  );
  return rows;
};

export const findProductByNameAndCategory = async (name, category) => {
  const [rows] = await pool.query(
    "SELECT * FROM product WHERE product_name = ? AND category = ?",
    [name, category]
  );
  return rows;
};

export const insert = async (product) => {
  const [result] = await pool.query(
    `INSERT INTO product (owner_id, product_name, category, description, price, stock_quantity, reorder_level, image, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
    [
      product.owner_id,
      product.product_name,
      product.category,
      product.description || null,
      product.price,
      product.stock_quantity ?? 0,
      product.reorder_level ?? 10,
      product.image || null
    ]
  );
  return result.insertId;
};

export const update = async (product) => {
  const [result] = await pool.query(
    `UPDATE product SET product_name = ?, category = ?, description = ?,
     price = ?, reorder_level = ?, image = ?, status = ? WHERE product_id = ?`,
    [
      product.product_name,
      product.category,
      product.description || null,
      product.price,
      product.reorder_level ?? 10,
      product.image !== undefined ? product.image : null,
      product.status || 'active',
      product.product_id
    ]
  );
  return result.affectedRows;
};

export const remove = async (id) => {
  const [result] = await pool.query(
    "UPDATE product SET status = 'inactive' WHERE product_id = ?", [id]
  );
  return result.affectedRows;
};

export const summary = async () => {
  const [[row]] = await pool.query(`
    SELECT
      COUNT(*) AS totalProducts,
      COALESCE(SUM(stock_quantity), 0) AS totalUnits,
      SUM(stock_quantity > 0 AND stock_quantity <= reorder_level) AS lowStock,
      SUM(stock_quantity = 0) AS outOfStock
    FROM product WHERE status = 'active'
  `);
  return {
    totalProducts: Number(row.totalProducts),
    totalUnits: Number(row.totalUnits),
    lowStock: Number(row.lowStock),
    outOfStock: Number(row.outOfStock),
  };
};

export const fetchLowStock = async () => {
  const [rows] = await pool.query(
    "SELECT * FROM product WHERE status = 'active' AND stock_quantity <= reorder_level ORDER BY stock_quantity ASC"
  );
  return rows;
};
