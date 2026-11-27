import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { API_BASE, NETWORK_ERROR, apiFetch } from "../../services/api";
import { fmtPrice, fmtDate } from "../../constants/format";
import Modal from "../../components/Modal";
import { printReceipt } from "../../utils/printReceipt";

const INV_URL   = `${API_BASE}/inventory`;
const ORDER_URL = `${API_BASE}/sale/orders`;
const SALE_URL  = `${API_BASE}/sale/sales`;

const statusClass = { Pending:"low", Confirmed:"low", Completed:"in", Cancelled:"out" };

function Notice({ notice, onClose }) {
  if (!notice) return null;
  return (
    <div className={`notice ${notice.type}`}>
      <span>{notice.text}</span>
      <button onClick={onClose}>×</button>
    </div>
  );
}

function POSTab() {
  const { auth } = useAuth();
  const ownerId  = auth?.user?.id ?? 1;

  const [products,     setProducts]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState("");
  const [category,     setCategory]     = useState("All");
  const [cart,         setCart]         = useState([]);
  const [customer,     setCustomer]     = useState("");
  const [payment,      setPayment]      = useState("cash");
  const [notice,       setNotice]       = useState(null);
  const [lastReceipt,  setLastReceipt]  = useState(null);
  const [saving,       setSaving]       = useState(false);

  const showNotice = (type, text) => {
    setNotice({ type, text });
    if (type === "success") setTimeout(() => setNotice(null), 5000);
  };
  const showError = (e) =>
    showNotice("error", e instanceof TypeError ? NETWORK_ERROR : e.message);

  useEffect(() => {
    apiFetch(INV_URL)
      .then(setProducts)
      .catch(showError)
      .finally(() => setLoading(false));
  }, []);

  const categories = [
    "All",
    ...new Set(products.map((p) => (p.category ?? "").trim()).filter(Boolean)),
  ];

  const visible = products.filter((p) => {
    const matchSearch = p.product_name.toLowerCase().includes(search.toLowerCase());
    const matchCat    = category === "All" || p.category === category;
    return matchSearch && matchCat;
  });

  // Block add if product has no stock; cap cart quantity at available stock
  const addToCart = (product) => {
    if (product.stock_quantity <= 0) return;
    setCart((prev) => {
      const existing = prev.find((c) => c.product.product_id === product.product_id);
      if (existing) {
        if (existing.quantity >= product.stock_quantity) return prev;
        return prev.map((c) =>
          c.product.product_id === product.product_id
            ? { ...c, quantity: c.quantity + 1 }
            : c
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const changeQty = (productId, delta) => {
    setCart((prev) =>
      prev
        .map((c) =>
          c.product.product_id === productId
            ? { ...c, quantity: Math.max(1, Math.min(c.quantity + delta, c.product.stock_quantity)) }
            : c
        )
        .filter((c) => c.quantity > 0)
    );
  };

  const removeFromCart = (productId) =>
    setCart((prev) => prev.filter((c) => c.product.product_id !== productId));

  const cartTotal     = cart.reduce((sum, c) => sum + Number(c.product.price) * c.quantity, 0);
  const cartItemCount = cart.reduce((n, c) => n + c.quantity, 0);

  const handlePurchase = async () => {
    if (cart.length === 0) {
      showNotice("error", "Add at least one product to the cart.");
      return;
    }
    setSaving(true);
    try {
      const result = await apiFetch(SALE_URL, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName:  customer.trim() || "Walk-in Customer",
          ownerId,
          paymentMethod: payment,
          items: cart.map((c) => ({
            productId: c.product.product_id,
            quantity:  c.quantity,
          })),
        }),
      });

      const saleId = result.message?.saleId ?? result.saleId;
      const sale   = await apiFetch(`${SALE_URL}/${saleId}`);
      setLastReceipt(sale);
      setCart([]);
      setCustomer("");
      // Refresh product list so updated stock quantities are shown immediately
      apiFetch(INV_URL).then(setProducts);
    } catch (e) {
      showError(e); // surfaces "Insufficient stock for …" from the backend
    } finally {
      setSaving(false);
    }
  };

  const now = new Date();
  const dateLabel = now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const timeLabel = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="pos-layout">

      {/* LEFT PANEL */}
      <div className="pos-left">
        <div className="pos-left-header">
          <h1 className="pos-title">Point of Sales</h1>
          <div className="pos-search-bar">
            <svg className="pos-search-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="8.5" cy="8.5" r="5.5"/><path d="M15 15l-3-3"/>
            </svg>
            <input
              type="search"
              placeholder="Search Product"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <Notice notice={notice} onClose={() => setNotice(null)} />

        <div className="pos-categories">
          <h2 className="pos-section-title">Categories</h2>
          <div className="pos-cat-tabs">
            {categories.map((cat) => {
              const count = cat === "All"
                ? products.length
                : products.filter((p) => (p.category ?? "").trim() === cat).length;
              return (
                <button
                  key={cat}
                  className={`pos-cat-tab${category === cat ? " active" : ""}`}
                  onClick={() => setCategory(cat)}
                >
                  <span className="pos-cat-name">{cat}</span>
                  <span className="pos-cat-count">{count} Items</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="pos-products">
          <h2 className="pos-section-title">Products</h2>
          {loading && <p className="muted">Loading products…</p>}
          {!loading && visible.length === 0 && <p className="muted">No products found.</p>}
          <div className="pos-product-grid">
            {visible.map((p) => {
              const inStock = p.stock_quantity > 0;
              const inCart  = cart.find((c) => c.product.product_id === p.product_id);
              return (
                <div
                  key={p.product_id}
                  className={`pos-product-card${!inStock ? " pos-out" : ""}`}
                >
                  <div className="pos-product-img">
                    {p.image
                      ? <img src={p.image} alt={p.product_name} />
                      : <span className="pos-product-initial">{p.product_name[0].toUpperCase()}</span>
                    }
                    {inCart && <span className="pos-cart-badge">{inCart.quantity}</span>}
                  </div>
                  <div className="pos-product-info">
                    <span className="pos-product-name">{p.product_name}</span>
                    <span className="pos-product-cat">{p.category}</span>
                    <span className="pos-product-price">{fmtPrice(p.price)}</span>
                    {/* Show available stock quantity on each card */}
                    <span className="muted" style={{ fontSize: "0.78rem" }}>
                      {inStock ? `${p.stock_quantity} in stock` : "Out of stock"}
                    </span>
                  </div>
                  <button
                    className="pos-add-btn"
                    onClick={() => addToCart(p)}
                    disabled={!inStock}
                  >
                    {inStock ? "Add" : "Out of Stock"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="pos-right">
        <div className="pos-order-header">
          <h2 className="pos-order-title">
            Order Detail
            {cartItemCount > 0 && (
              <span className="pos-order-count">{cartItemCount} item{cartItemCount !== 1 ? "s" : ""}</span>
            )}
          </h2>
          <span className="pos-order-date">
            <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5" style={{marginRight:4,verticalAlign:"middle"}}>
              <rect x="1" y="3" width="14" height="12" rx="2"/><path d="M5 1v4M11 1v4M1 7h14"/>
            </svg>
            {timeLabel} · {dateLabel}
          </span>
        </div>

        <div className="pos-cart">
          {cart.length === 0 && (
            <p className="pos-cart-empty">No items added yet.<br />Click <strong>Add</strong> on a product.</p>
          )}
          {cart.map(({ product: p, quantity: qty }) => (
            <div key={p.product_id} className="pos-cart-item">
              <div className="pos-cart-img">
                {p.image
                  ? <img src={p.image} alt={p.product_name} />
                  : <span>{p.product_name[0].toUpperCase()}</span>
                }
              </div>
              <div className="pos-cart-details">
                <span className="pos-cart-name">{p.product_name}</span>
                <span className="pos-cart-price">{fmtPrice(p.price)}</span>
              </div>
              <div className="pos-cart-qty">
                <button className="pos-qty-btn" onClick={() => changeQty(p.product_id, -1)}>−</button>
                <span className="pos-qty-num">{qty}</span>
                <button className="pos-qty-btn" onClick={() => changeQty(p.product_id, +1)}>+</button>
              </div>
              <button className="pos-cart-remove" onClick={() => removeFromCart(p.product_id)}>
                <svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5"/><rect x="3" y="4" width="10" height="10" rx="1"/>
                </svg>
              </button>
            </div>
          ))}
        </div>

        <div className="pos-payment">
          <h2 className="pos-payment-title">Payment Detail</h2>
          <input
            className="pos-customer-input"
            placeholder="Customer Name (optional)"
            value={customer}
            onChange={(e) => setCustomer(e.target.value)}
          />
          <div className="pos-pay-methods">
            <button className={`pos-pay-method${payment === "cash"  ? " active" : ""}`} onClick={() => setPayment("cash")}>
              <svg viewBox="0 0 20 14" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6">
                <rect x="1" y="1" width="18" height="12" rx="2"/><circle cx="10" cy="7" r="2.5"/>
                <path d="M1 4h2M17 4h2M1 10h2M17 10h2"/>
              </svg>
              Cash
            </button>
            <button className={`pos-pay-method${payment === "gcash" ? " active" : ""}`} onClick={() => setPayment("gcash")}>
              <svg viewBox="0 0 14 20" width="14" height="18" fill="none" stroke="currentColor" strokeWidth="1.6">
                <rect x="2" y="1" width="10" height="18" rx="2"/><circle cx="7" cy="16" r="1"/><path d="M5 4h4"/>
              </svg>
              GCash
            </button>
          </div>
          <div className="pos-totals">
            <div className="pos-total-row"><span>Sub Total</span><span>{fmtPrice(cartTotal)}</span></div>
            <div className="pos-total-row pos-total-final"><span>Total Payment</span><span>{fmtPrice(cartTotal)}</span></div>
          </div>
          <button
            className="pos-purchase-btn"
            onClick={handlePurchase}
            disabled={saving || cart.length === 0}
          >
            {saving ? "Processing…" : "Purchase"}
          </button>
        </div>
      </div>

      {lastReceipt && (
        <Modal title={`Receipt — ${lastReceipt.receipt_no ?? ""}`} onClose={() => setLastReceipt(null)}>
          <div id="pos-receipt-print" className="panel receipt-panel">
            <div className="receipt-store">
              <strong>Remedios</strong>
              <span>Plastic Ware &amp; Native Products</span>
            </div>
            <dl className="meta">
              <dt>Receipt #</dt> <dd><strong>{lastReceipt.receipt_no}</strong></dd>
              <dt>Customer</dt>  <dd>{lastReceipt.customer_name}</dd>
              <dt>Date</dt>      <dd>{fmtDate(lastReceipt.sale_date)}</dd>
              <dt>Payment</dt>   <dd>{lastReceipt.payment_method === "gcash" ? "GCash" : "Cash"}</dd>
            </dl>
            <table className="detail-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th style={{ textAlign: "right" }}>Qty</th>
                  <th style={{ textAlign: "right" }}>Price</th>
                  <th style={{ textAlign: "right" }}>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {(lastReceipt.items ?? []).map((item) => (
                  <tr key={item.id}>
                    <td>{item.product_name}</td>
                    <td style={{ textAlign: "right" }}>{item.quantity}</td>
                    <td style={{ textAlign: "right" }}>{fmtPrice(item.unit_price)}</td>
                    <td style={{ textAlign: "right" }}>{fmtPrice(item.sub_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="total">Total: {fmtPrice(lastReceipt.total_amount)}</p>
            <p className="receipt-thanks">Thank you for your purchase!</p>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button onClick={() => printReceipt("pos-receipt-print")}>🖨 Print</button>
              <button className="secondary" onClick={() => setLastReceipt(null)}>Close</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function OrdersTab() {
  const [orders,   setOrders]   = useState([]);
  const [selected, setSelected] = useState(null);
  const [search,   setSearch]   = useState("");
  const [notice,   setNotice]   = useState(null);
  const [loading,  setLoading]  = useState(true);

  const showNotice = (type, text) => {
    setNotice({ type, text });
    if (type === "success") setTimeout(() => setNotice(null), 4000);
  };
  const showError = (e) =>
    showNotice("error", e instanceof TypeError ? NETWORK_ERROR : e.message);

  const load = () =>
    apiFetch(ORDER_URL).then(setOrders).catch(showError).finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const viewOrder = async (o) => {
    try { setSelected(await apiFetch(`${ORDER_URL}/${o.order_id}`)); }
    catch (e) { showError(e); }
  };

  const changeStatus = async (o, newStatus) => {
    try {
      await apiFetch(`${ORDER_URL}/${o.order_id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      showNotice("success", `Order marked ${newStatus}.`);
      setSelected(null);
      load();
    } catch (e) { showError(e); }
  };

  const visible = orders.filter((o) =>
    `ORD-${String(o.order_id).padStart(3, "0")} ${o.first_name} ${o.last_name}`
      .toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <section id="headerContainer">
        <h1>Customer Orders</h1>
        <small>Manage and fulfil customer orders</small>
        <div className="toolbar">
          <input type="search" placeholder="Search orders…"
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </section>

      <Notice notice={notice} onClose={() => setNotice(null)} />

      <section id="listContainer">
        <table>
          <thead>
            <tr>
              <th>Order #</th><th>Customer</th><th>Date</th>
              <th>Payment</th><th>Items</th><th>Total</th><th>Status</th><th></th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={8} className="empty">Loading…</td></tr>}
            {!loading && visible.length === 0 && (
              <tr><td colSpan={8} className="empty">No orders found.</td></tr>
            )}
            {visible.map((o) => (
              <tr key={o.order_id} className="list-item">
                <td><strong>ORD-{String(o.order_id).padStart(3, "0")}</strong></td>
                <td>{o.first_name} {o.last_name}</td>
                <td>{fmtDate(o.order_date)}</td>
                <td>{o.payment_method === "gcash" ? "GCash" : "Cash"}</td>
                <td>{o.item_count}</td>
                <td>{fmtPrice(o.total_amount)}</td>
                <td><span className={`badge ${statusClass[o.order_status] ?? ""}`}>{o.order_status}</span></td>
                <td className="actions">
                  <button onClick={() => viewOrder(o)}>View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {selected && (
        <Modal
          title={`Order ORD-${String(selected.order_id).padStart(3, "0")}`}
          onClose={() => setSelected(null)}
        >
          <div className="panel">
            <dl className="meta">
              <dt>Customer</dt> <dd>{selected.first_name} {selected.last_name}</dd>
              <dt>Date</dt>    <dd>{fmtDate(selected.order_date)}</dd>
              <dt>Payment</dt> <dd>{selected.payment_method === "gcash" ? "GCash" : "Cash"}</dd>
              <dt>Status</dt>
              <dd>
                <span className={`badge ${statusClass[selected.order_status] ?? ""}`}>
                  {selected.order_status}
                </span>
              </dd>
            </dl>
            <table className="detail-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th style={{ textAlign: "right" }}>Qty</th>
                  <th style={{ textAlign: "right" }}>Price</th>
                  <th style={{ textAlign: "right" }}>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {(selected.items ?? []).map((item) => (
                  <tr key={item.id}>
                    <td>{item.product_name}</td>
                    <td style={{ textAlign: "right" }}>{item.quantity}</td>
                    <td style={{ textAlign: "right" }}>{fmtPrice(item.unit_price)}</td>
                    <td style={{ textAlign: "right" }}>{fmtPrice(item.sub_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="total">Total: {fmtPrice(selected.total_amount)}</p>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              {selected.order_status === "Pending"   && <button onClick={() => changeStatus(selected, "Confirmed")}>Confirm</button>}
              {selected.order_status === "Confirmed" && <button onClick={() => changeStatus(selected, "Completed")}>Complete</button>}
              {selected.order_status !== "Cancelled" && (
                <button className="secondary" onClick={() => changeStatus(selected, "Cancelled")}>Cancel</button>
              )}
              <button className="secondary" onClick={() => setSelected(null)}>Close</button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

function TransactionsTab() {
  const [sales,    setSales]    = useState([]);
  const [selected, setSelected] = useState(null);
  const [search,   setSearch]   = useState("");
  const [notice,   setNotice]   = useState(null);
  const [loading,  setLoading]  = useState(true);

  const showError = (e) =>
    setNotice({ type: "error", text: e instanceof TypeError ? NETWORK_ERROR : e.message });

  const load = () =>
    apiFetch(SALE_URL).then(setSales).catch(showError).finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const viewSale = async (s) => {
    try { setSelected(await apiFetch(`${SALE_URL}/${s.sale_id}`)); }
    catch (e) { showError(e); }
  };

  const visible = sales.filter((s) =>
    `${s.receipt_no ?? ""} ${s.customer_name}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <section id="headerContainer">
        <h1>Transaction History</h1>
        <small>All direct sales</small>
        <div className="toolbar">
          <input type="search" placeholder="Search by receipt or customer…"
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </section>

      {notice && (
        <div className={`notice ${notice.type}`}>
          <span>{notice.text}</span>
          <button onClick={() => setNotice(null)}>×</button>
        </div>
      )}

      <section id="listContainer">
        <table>
          <thead>
            <tr>
              <th>Receipt</th><th>Customer</th><th>Date</th><th>Payment</th><th>Total</th><th></th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={6} className="empty">Loading…</td></tr>}
            {!loading && visible.length === 0 && (
              <tr><td colSpan={6} className="empty">No transactions found.</td></tr>
            )}
            {visible.map((s) => (
              <tr key={s.sale_id} className="list-item">
                <td><strong>{s.receipt_no ?? `RD-${String(s.sale_id).padStart(3, "0")}`}</strong></td>
                <td>{s.customer_name}</td>
                <td>{fmtDate(s.sale_date)}</td>
                <td>{s.payment_method === "gcash" ? "GCash" : "Cash"}</td>
                <td>{fmtPrice(s.total_amount)}</td>
                <td className="actions">
                  <button onClick={() => viewSale(s)}>View Receipt</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {selected && (
        <Modal title={`Receipt ${selected.receipt_no ?? ""}`} onClose={() => setSelected(null)}>
          <div id="transaction-receipt-print" className="panel receipt-panel">
            <div className="receipt-store">
              <strong>Remedios</strong>
              <span>Plastic Ware &amp; Native Products</span>
            </div>
            <dl className="meta">
              <dt>Customer</dt> <dd>{selected.customer_name}</dd>
              <dt>Date</dt>     <dd>{fmtDate(selected.sale_date)}</dd>
              <dt>Payment</dt>  <dd>{selected.payment_method === "gcash" ? "GCash" : "Cash"}</dd>
            </dl>
            <table className="detail-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th style={{ textAlign: "right" }}>Qty</th>
                  <th style={{ textAlign: "right" }}>Price</th>
                  <th style={{ textAlign: "right" }}>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {(selected.items ?? []).map((item) => (
                  <tr key={item.id}>
                    <td>{item.product_name}</td>
                    <td style={{ textAlign: "right" }}>{item.quantity}</td>
                    <td style={{ textAlign: "right" }}>{fmtPrice(item.unit_price)}</td>
                    <td style={{ textAlign: "right" }}>{fmtPrice(item.sub_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="total">Total: {fmtPrice(selected.total_amount)}</p>
            <p className="receipt-thanks">Thank you for your purchase!</p>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button onClick={() => printReceipt("transaction-receipt-print")}>🖨 Print</button>
              <button className="secondary" onClick={() => setSelected(null)}>Close</button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

export default function POSOrders() {
  const [tab, setTab] = useState("pos");

  return (
    <>
      <div id="pageTabs" role="tablist">
        <button role="tab" className={tab === "pos"          ? "active" : ""} onClick={() => setTab("pos")}>POS</button>
        <button role="tab" className={tab === "orders"       ? "active" : ""} onClick={() => setTab("orders")}>Customer Orders</button>
        <button role="tab" className={tab === "transactions" ? "active" : ""} onClick={() => setTab("transactions")}>Transactions</button>
      </div>
      {tab === "pos"          && <POSTab />}
      {tab === "orders"       && <OrdersTab />}
      {tab === "transactions" && <TransactionsTab />}
    </>
  );
}
