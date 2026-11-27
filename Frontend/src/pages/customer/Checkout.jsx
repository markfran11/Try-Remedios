import { useState } from "react";
import { ENDPOINTS, apiFetch, NETWORK_ERROR } from "../../services/api";
import { fmtPrice, fmtDate } from "../../constants/format";
import { printReceipt } from "../../utils/printReceipt";

function OrderConfirmation({ order, onClose }) {
  const orderNo = order.order_no ?? `ORD-${String(order.order_id).padStart(3, "0")}`;

  return (
    <div id="checkout-receipt-print" className="panel receipt-panel">
      <div className="receipt-store">
        <strong>Remedios</strong>
        <span>Plastic Ware &amp; Native Products</span>
      </div>

      <div className="panel-head">
        <h2 style={{ margin: 0, fontSize: "1.1rem", color: "var(--ok)" }}>
          ✓ Order Placed!
        </h2>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="secondary" onClick={() => printReceipt("checkout-receipt-print")}>🖨 Print</button>
          <button className="secondary" onClick={onClose}>Close</button>
        </div>
      </div>

      <dl className="meta">
        <dt>Order #</dt>  <dd><strong>{orderNo}</strong></dd>
        <dt>Date</dt>     <dd>{fmtDate(order.order_date)}</dd>
        <dt>Payment</dt>  <dd>{order.payment_method === "gcash" ? "GCash QR Code" : "Cash (Pay at Counter)"}</dd>
        <dt>Status</dt>   <dd><span className="badge low">{order.order_status}</span></dd>
      </dl>

      <table className="detail-table">
        <thead>
          <tr>
            <th>Product</th>
            <th style={{ textAlign: "right" }}>Qty</th>
            <th style={{ textAlign: "right" }}>Unit Price</th>
            <th style={{ textAlign: "right" }}>Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {(order.items ?? []).map((item) => (
            <tr key={item.id}>
              <td>{item.product_name}</td>
              <td style={{ textAlign: "right" }}>{item.quantity}</td>
              <td style={{ textAlign: "right" }}>{fmtPrice(item.unit_price)}</td>
              <td style={{ textAlign: "right" }}>{fmtPrice(item.sub_total)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="total">Total: {fmtPrice(order.total_amount)}</p>
      <p className="receipt-thanks">
        Your order is being processed. You can track it in <strong>My Orders</strong>.
      </p>
    </div>
  );
}

export default function Checkout({ product, user, onSuccess, onCancel }) {
  const [qty,          setQty]          = useState(1);
  const [method,       setMethod]       = useState("cash");
  const [error,        setError]        = useState("");
  const [saving,       setSaving]       = useState(false);
  const [confirmation, setConfirmation] = useState(null);

  // Available stock is the maximum the customer can order
  const max   = product.stock_quantity;
  const total = Number(product.price) * qty;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    if (qty > max) {
      setError(`Only ${max} in stock.`);
      return;
    }

    setSaving(true);
    try {
      const result = await apiFetch(ENDPOINTS.orders, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId:     user?.id,
          paymentMethod: method,
          orderStatus:   "Pending",
          items: [{ productId: product.product_id, quantity: qty }],
        }),
      });

      const orderId = result.message?.orderId ?? result.orderId;
      const full    = await apiFetch(ENDPOINTS.orderById(orderId));
      setConfirmation(full);
    } catch (err) {
      setError(err instanceof TypeError ? NETWORK_ERROR : err.message);
    } finally {
      setSaving(false);
    }
  };

  if (confirmation) {
    return (
      <OrderConfirmation
        order={confirmation}
        onClose={() => {
          setConfirmation(null);
          onSuccess(`Order ${confirmation.order_no ?? ""} placed successfully!`);
        }}
      />
    );
  }

  return (
    <form className="sale-form" onSubmit={handleSubmit}>
      <div className="sale-fields">

        <div className="input-field wide">
          <label>Product</label>
          <div style={{
            padding: "8px 10px", border: "1px solid var(--line)",
            borderRadius: 6, background: "#f9f9f9", fontSize: "0.9rem"
          }}>
            <strong>{product.product_name}</strong>
            <span className="muted" style={{ marginLeft: 8 }}>{product.category}</span>
            <span style={{ marginLeft: 8 }}>{fmtPrice(product.price)} each</span>
          </div>
        </div>

        {/* Quantity — capped at available stock via max attribute */}
        <div className="input-field">
          <label htmlFor="qty">Quantity</label>
          <input
            id="qty" type="number" min="1" max={max} step="1"
            value={qty}
            onChange={(e) => setQty(Number(e.target.value))}
            required
          />
          {/* Show current available stock */}
          <small className="muted">
            {max > 0
              ? `${max} in stock`
              : <span style={{ color: "var(--danger)" }}>Out of stock</span>
            }
          </small>
        </div>

        <div className="input-field">
          <label htmlFor="method">Payment Method</label>
          <select id="method" value={method} onChange={(e) => setMethod(e.target.value)}>
            <option value="cash">Cash (Pay at Counter)</option>
            <option value="gcash">GCash QR Code</option>
          </select>
        </div>
      </div>

      <p className="total" style={{ margin: "12px 0" }}>
        Total: {fmtPrice(total)}
      </p>

      {/* Surfaces insufficient-stock errors from the backend */}
      {error && (
        <p className="notice error form-error" role="alert">
          <span>{error}</span>
        </p>
      )}

      <div className="form-footer">
        <button type="submit" disabled={saving || max <= 0}>
          {saving ? "Placing order…" : "Place Order"}
        </button>
        <button type="button" className="secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
