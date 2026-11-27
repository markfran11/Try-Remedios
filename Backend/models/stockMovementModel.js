import pool from '../config/db.js';

export const fetch = async () => {
  const [rows] = await pool.query(
    `SELECT sm.id, sm.product_id, p.product_name,
            sm.movement_type, sm.previous_stock,
            sm.quantity_change, sm.updated_stock,
            sm.reason, sm.created_at
     FROM stock_movement sm
     JOIN product p ON p.product_id = sm.product_id
     ORDER BY sm.created_at DESC, sm.id DESC`
  );
  return rows;
};


export const insert = async (productId, quantity, movementType, reason) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Lock the row so concurrent requests cannot corrupt the balance
    const [rows] = await connection.query(
      "SELECT stock_quantity FROM product WHERE product_id = ? FOR UPDATE", [productId]
    );
    if (rows.length === 0) throw new Error('Product does not exist!');

    const previousStock  = rows[0].stock_quantity;
    const isDecrease     = movementType === 'adjustment_decrease';
    const quantityChange = isDecrease ? -quantity : quantity;
    const updatedStock   = previousStock + quantityChange;

    if (updatedStock < 0) throw new Error('Stock cannot go below zero.');

    // Map UI type to the two values stored in the DB column
    const dbMovementType = movementType === 'stock_in' ? 'stock_in' : 'adjustment';

    await connection.query(
      "UPDATE product SET stock_quantity = ? WHERE product_id = ?",
      [updatedStock, productId]
    );

    const [result] = await connection.query(
      `INSERT INTO stock_movement
         (product_id, movement_type, previous_stock, quantity_change, updated_stock, reason)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [productId, dbMovementType, previousStock, quantityChange, updatedStock, reason || null]
    );

    await connection.commit();
    return result.insertId;
  } catch (e) {
    await connection.rollback();
    throw e;
  } finally {
    connection.release();
  }
};

export const applyMovement = async (connection, productId, quantityChange, movementType, reason) => {
  const [rows] = await connection.query(
    "SELECT stock_quantity FROM product WHERE product_id = ? FOR UPDATE", [productId]
  );
  if (rows.length === 0) throw new Error(`Product ${productId} does not exist!`);

  const previousStock = rows[0].stock_quantity;
  const updatedStock  = previousStock + quantityChange;

  if (updatedStock < 0) {
    throw new Error(
      `Not enough stock for product ID ${productId}. Available: ${previousStock}, needed: ${Math.abs(quantityChange)}.`
    );
  }

  await connection.query(
    "UPDATE product SET stock_quantity = ? WHERE product_id = ?", [updatedStock, productId]
  );

  await connection.query(
    `INSERT INTO stock_movement (product_id, movement_type, previous_stock, quantity_change, updated_stock, reason)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [productId, movementType, previousStock, quantityChange, updatedStock, reason || null]
  );
};
