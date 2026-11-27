import { fmtPrice, fmtDate, padId } from "../constants/format";

const statusClass = { Completed: "in", Pending: "low", Cancelled: "out" };

const SaleDetail = ({ sale, onClose, onStatusChange }) => {
  const receiptNo = sale.receipt_number
    ?? padId(sale.id, sale.sale_type === "order" ? "ORD" : "RD");

  const canComplete = sale.status === "Pending";
  const canCancel   = sale.status !== "Cancelled";

  const handlePrint = () => window.print();

  return (
    <div className="panel receipt-panel">
      {/* ── Receipt header ── */}
      <div className="receipt-store">
        <strong>Remedios</strong>
        <span>Plastic Ware &amp; Native Products</span>
      </div>

      <div className="panel-head">
        <h2>Receipt #{receiptNo}</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="secondary no-print" onClick={handlePrint}>Print</button>
          <button className="secondary no-print" onClick={onClose}>Close</button>
        </div>
      </div>

      <dl className="meta">
        <dt>Customer</dt> <dd>{sale.customer_name}</dd>
        <dt>Date</dt>     <dd>{fmtDate(sale.sale_date)}</dd>
        <dt>Payment</dt>  <dd>{sale.payment_method === "gcash" ? "GCash" : "Cash"}</dd>
        <dt>Status</dt>
        <dd>
          <span className={statusClass[sale.status] ?? ""}>{sale.status}</span>
        </dd>
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
          {(sale.items ?? []).map((item) => (
            <tr key={item.id}>
              <td>{item.product_name}</td>
              <td style={{ textAlign: "right" }}>{item.quantity}</td>
              <td style={{ textAlign: "right" }}>{fmtPrice(item.unit_price)}</td>
              <td style={{ textAlign: "right" }}>
                {fmtPrice(item.unit_price * item.quantity)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="total">Total: {fmtPrice(sale.total)}</p>

      <p className="receipt-thanks">Thank you for your purchase!</p>

      {/* ── Status actions (admin-only, hidden on print) ── */}
      {onStatusChange && (
        <div className="no-print" style={{ display: "flex", gap: 8, marginTop: 16 }}>
          {canComplete && (
            <button onClick={() => onStatusChange(sale, "Completed")}>
              Mark Completed
            </button>
          )}
          {canCancel && (
            <button className="secondary" onClick={() => onStatusChange(sale, "Cancelled")}>
              Cancel Order
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default SaleDetail;
