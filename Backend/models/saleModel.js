import pool from '../config/db.js';
import * as stockMovementModel from './stockMovementModel.js';

const orderLabel = (id) => `ORD-${String(id).padStart(3, '0')}`;
const saleLabel  = (id) => `RD-${String(id).padStart(3, '0')}`;


export const fetchOrders = async () => {
  const [rows] = await pool.query(
    `SELECT co.order_id, co.account_id,
            co.order_no,
            ua.first_name, ua.last_name,
            DATE_FORMAT(co.order_date, '%Y-%m-%d %H:%i')  AS order_date,
            co.order_status, co.payment_method,
            co.payment_status, co.payment_ref_no, co.total_amount,
            CAST((SELECT COALESCE(SUM(od.quantity),0)
                  FROM order_details od WHERE od.order_id = co.order_id) AS SIGNED) AS item_count
     FROM customer_order co
     JOIN user_account ua ON ua.account_id = co.account_id
     ORDER BY co.order_date DESC, co.order_id DESC`
  );
  return rows;
};

export const findOrderById = async (id) => {
  const [rows] = await pool.query(
    `SELECT co.order_id, co.account_id,
            co.order_no,
            ua.first_name, ua.last_name,
            DATE_FORMAT(co.order_date, '%Y-%m-%d %H:%i') AS order_date,
            co.order_status, co.payment_method,
            co.payment_status, co.payment_ref_no, co.total_amount
     FROM customer_order co
     JOIN user_account ua ON ua.account_id = co.account_id
     WHERE co.order_id = ?`,
    [id]
  );
  return rows;
};

export const fetchOrderItems = async (orderId) => {
  const [rows] = await pool.query(
    `SELECT od.order_details_id AS id, od.product_id,
            p.product_name, od.quantity,
            od.unit_price, od.discount_amount, od.sub_total,
            od.promotion_id
     FROM order_details od
     JOIN product p ON p.product_id = od.product_id
     WHERE od.order_id = ?
     ORDER BY od.order_details_id`,
    [orderId]
  );
  return rows;
};

export const insertOrder = async (order, items) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [result] = await connection.query(
      `INSERT INTO customer_order
         (account_id, order_date, order_status, payment_method, payment_status, total_amount)
       VALUES (?, NOW(), ?, ?, 'Unpaid', ?)`,
      [order.accountId, order.orderStatus || 'Pending',
       order.paymentMethod || 'cash', order.totalAmount]
    );
    const orderId = result.insertId;

    const orderNo = orderLabel(orderId);
    await connection.query(
      "UPDATE customer_order SET order_no = ? WHERE order_id = ?",
      [orderNo, orderId]
    );

    for (const item of items) {
      const subTotal = (item.unitPrice - (item.discountAmount || 0)) * item.quantity;
      await connection.query(
        `INSERT INTO order_details
           (order_id, product_id, promotion_id, quantity, unit_price, discount_amount, sub_total)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [orderId, item.productId, item.promotionId || null,
         item.quantity, item.unitPrice,
         item.discountAmount || 0, subTotal]
      );
    }

    // Deduct stock only when the order is immediately created as Completed
    if (order.orderStatus === 'Completed') {
      for (const item of items) {
        await stockMovementModel.applyMovement(
          connection, item.productId, -item.quantity, 'sale',
          `Order ${orderNo}`
        );
      }
    }

    await connection.commit();
    return orderId;
  } catch (e) {
    await connection.rollback();
    throw e;
  } finally {
    connection.release();
  }
};

export const updateOrderStatus = async (id, expectedStatus, newStatus) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [rows] = await connection.query(
      "SELECT order_status FROM customer_order WHERE order_id = ? FOR UPDATE", [id]
    );
    if (rows.length === 0) throw new Error('Order does not exist!');
    if (rows[0].order_status !== expectedStatus)
      throw new Error('This order was changed by someone else. Please refresh.');

    const [items] = await connection.query(
      "SELECT product_id, quantity FROM order_details WHERE order_id = ? ORDER BY product_id", [id]
    );

    // Deduct stock when completing an order
    if (newStatus === 'Completed') {
      for (const item of items) {
        await stockMovementModel.applyMovement(
          connection, item.product_id, -item.quantity, 'sale',
          `Order ${orderLabel(id)}`
        );
      }
    }

    if (expectedStatus === 'Completed' && newStatus === 'Cancelled') {
      for (const item of items) {
        await stockMovementModel.applyMovement(
          connection, item.product_id, item.quantity, 'sale',
          `Order ${orderLabel(id)} cancelled`
        );
      }
    }

    const paymentStatus = newStatus === 'Completed' ? 'Paid'
      : newStatus === 'Cancelled' ? 'Refunded'
      : undefined;

    if (paymentStatus) {
      await connection.query(
        "UPDATE customer_order SET order_status = ?, payment_status = ? WHERE order_id = ?",
        [newStatus, paymentStatus, id]
      );
    } else {
      await connection.query(
        "UPDATE customer_order SET order_status = ? WHERE order_id = ?",
        [newStatus, id]
      );
    }

    await connection.commit();
    return true;
  } catch (e) {
    await connection.rollback();
    throw e;
  } finally {
    connection.release();
  }
};


export const fetchSales = async () => {
  const [rows] = await pool.query(
    `SELECT s.sale_id, s.customer_id, c.customer_name,
            s.owner_id, s.sale_type, s.total_amount,
            DATE_FORMAT(s.sale_date, '%Y-%m-%d') AS sale_date,
            s.payment_method, s.receipt_no,
            CAST((SELECT COALESCE(SUM(sd.quantity),0)
                  FROM sale_details sd WHERE sd.sale_id = s.sale_id) AS SIGNED) AS item_count
     FROM sale s
     JOIN customer c ON c.customer_id = s.customer_id
     ORDER BY s.sale_date DESC, s.sale_id DESC`
  );
  return rows;
};

export const findSaleById = async (id) => {
  const [rows] = await pool.query(
    `SELECT s.sale_id, s.customer_id, c.customer_name,
            s.owner_id, s.sale_type, s.total_amount,
            DATE_FORMAT(s.sale_date, '%Y-%m-%d') AS sale_date,
            s.payment_method, s.receipt_no
     FROM sale s
     JOIN customer c ON c.customer_id = s.customer_id
     WHERE s.sale_id = ?`,
    [id]
  );
  return rows;
};

export const fetchSaleItems = async (saleId) => {
  const [rows] = await pool.query(
    `SELECT sd.sale_details_id AS id, sd.product_id,
            p.product_name, sd.quantity,
            sd.unit_price, sd.discount_amount, sd.sub_total,
            sd.promotion_id
     FROM sale_details sd
     JOIN product p ON p.product_id = sd.product_id
     WHERE sd.sale_id = ?
     ORDER BY sd.sale_details_id`,
    [saleId]
  );
  return rows;
};

export const findOrCreateCustomer = async (connection, customerName, contactNumber = null) => {
  const [existing] = await connection.query(
    "SELECT customer_id FROM customer WHERE customer_name = ?", [customerName]
  );
  if (existing.length > 0) return existing[0].customer_id;

  const [result] = await connection.query(
    "INSERT INTO customer (customer_name, contact_number) VALUES (?, ?)",
    [customerName, contactNumber || null]
  );
  return result.insertId;
};

export const insertSale = async (sale, items) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const customerId = await findOrCreateCustomer(connection, sale.customerName);

    const [result] = await connection.query(
      `INSERT INTO sale (customer_id, owner_id, sale_type, total_amount, sale_date, payment_method)
       VALUES (?, ?, ?, ?, NOW(), ?)`,
      [customerId, sale.ownerId, sale.saleType || 'direct',
       sale.totalAmount, sale.paymentMethod || 'cash']
    );
    const saleId = result.insertId;

    const receiptNo = saleLabel(saleId);
    await connection.query("UPDATE sale SET receipt_no = ? WHERE sale_id = ?", [receiptNo, saleId]);

    for (const item of items) {
      const subTotal = (item.unitPrice - (item.discountAmount || 0)) * item.quantity;
      await connection.query(
        `INSERT INTO sale_details
           (sale_id, product_id, promotion_id, quantity, unit_price, discount_amount, sub_total)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [saleId, item.productId, item.promotionId || null,
         item.quantity, item.unitPrice,
         item.discountAmount || 0, subTotal]
      );
    }

    for (const item of items) {
      await stockMovementModel.applyMovement(
        connection, item.productId, -item.quantity, 'sale',
        `Sale ${receiptNo}`
      );
    }

    await connection.commit();
    return saleId;
  } catch (e) {
    await connection.rollback();
    throw e;
  } finally {
    connection.release();
  }
};
