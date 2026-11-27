import { useState } from "react";
import { fmtPrice } from "../constants/format";

const emptyRow = () => ({ productId: "", quantity: 1 });

// defaultCustomerName: pre-fills the name field and locks it (used on the customer side)
// adminMode: shows the status selector (admin-only)
const SaleForm = ({ products, saleType = "direct", onSave, onCancel, defaultCustomerName = "" }) => {
  const today = new Date().toISOString().slice(0, 10);
  const isCustomer = Boolean(defaultCustomerName);

  const [form, setForm] = useState({
    customerName: defaultCustomerName,
    saleDate:     today,
    paymentMethod: "cash",
    status:       "Pending",
  });
  const [rows, setRows]   = useState([emptyRow()]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const setField = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const setRow = (i, field, value) => {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)));
  };

  const addRow    = () => setRows((prev) => [...prev, emptyRow()]);
  const removeRow = (i) => setRows((prev) => prev.filter((_, idx) => idx !== i));

  const getProduct = (id) => products.find((p) => String(p.id) === String(id));

  const total = rows.reduce((sum, r) => {
    const p = getProduct(r.productId);
    return sum + (p ? Number(p.price) * Number(r.quantity || 0) : 0);
  }, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    const payload = {
      saleType,
      customerName:  form.customerName,
      saleDate:      form.saleDate,
      paymentMethod: form.paymentMethod,
      // customers always submit as Pending; direct POS is always Completed
      status: saleType === "direct"
        ? "Completed"
        : isCustomer
          ? "Pending"
          : form.status,
      items: rows.map((r) => ({
        productId: r.productId,
        quantity:  Number(r.quantity),
      })),
    };
    const problem = await onSave(payload);
    setSaving(false);
    if (problem) setError(problem);
  };

  return (
    <form className="sale-form" onSubmit={handleSubmit}>
      <div className="sale-fields">
        {/* Customer name — locked when pre-filled for logged-in customer */}
        <div className="input-field">
          <label htmlFor="customerName">Customer Name</label>
          <input
            id="customerName" name="customerName"
            value={form.customerName}
            onChange={setField}
            readOnly={isCustomer}
            style={isCustomer ? { background: "#f4f4f4", color: "#6a736a" } : undefined}
            required
          />
        </div>

        {/* Date — only shown to admin */}
        {!isCustomer && (
          <div className="input-field">
            <label htmlFor="saleDate">Date</label>
            <input id="saleDate" name="saleDate" type="date"
              value={form.saleDate} onChange={setField} required />
          </div>
        )}

        <div className="input-field">
          <label htmlFor="paymentMethod">Payment Method</label>
          <select id="paymentMethod" name="paymentMethod"
            value={form.paymentMethod} onChange={setField}>
            <option value="cash">Cash (Pay at Counter)</option>
            <option value="gcash">GCash QR Code</option>
          </select>
        </div>

        {/* Status — only shown to admin for order-type */}
        {saleType === "order" && !isCustomer && (
          <div className="input-field">
            <label htmlFor="status">Status</label>
            <select id="status" name="status" value={form.status} onChange={setField}>
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        )}
      </div>

      {/* Product rows */}
      <div className="sale-rows">
        {rows.map((row, i) => {
          const product = getProduct(row.productId);
          return (
            <div className="sale-row" key={i}>
              <select
                value={row.productId}
                onChange={(e) => setRow(i, "productId", e.target.value)}
                required
              >
                <option value="">Select product…</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id} disabled={p.stock <= 0}>
                    {p.name} — {p.category} ({p.stock} left) — {fmtPrice(p.price)}
                  </option>
                ))}
              </select>
              <input
                type="number" min="1" step="1"
                value={row.quantity}
                onChange={(e) => setRow(i, "quantity", e.target.value)}
                required
              />
              <button
                type="button" className="secondary"
                onClick={() => removeRow(i)}
                disabled={rows.length === 1}
                aria-label="Remove row"
              >×</button>
              {product && (
                <small className="hint">
                  Subtotal: {fmtPrice(Number(product.price) * Number(row.quantity || 0))}
                </small>
              )}
            </div>
          );
        })}
      </div>

      <div className="sale-actions">
        <button type="button" className="secondary" onClick={addRow}>+ Add Product</button>
        <p className="total">Total: {fmtPrice(total)}</p>
        <div>
          <button type="submit" disabled={saving}>
            {saleType === "order" ? "Place Order" : "Complete Sale"}
          </button>
          {onCancel && (
            <button type="button" className="secondary" onClick={onCancel}>Cancel</button>
          )}
        </div>
      </div>

      {error && (
        <p className="notice error form-error" role="alert"><span>{error}</span></p>
      )}
    </form>
  );
};

export default SaleForm;
