import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { API_BASE, NETWORK_ERROR, apiFetch } from "../../services/api";
import { fmtPrice, fmtDate } from "../../constants/format";
import { getStockStatus } from "../../constants/stockStatus";

const INV_URL  = `${API_BASE}/inventory`;
const MOVE_URL = `${API_BASE}/stock-movement`;

const CATEGORIES = [
  "Plasticware",
  "Native Products",
  "Baskets",
  "Bags",
  "Home Decor",
  "Kitchen",
  "Others",
];

const MOVE_TYPES = [
  { value: "stock_in",            label: "Stock In" },
  { value: "adjustment_increase", label: "Increase" },
  { value: "adjustment_decrease", label: "Decrease" },
];

const MOVE_LABEL = { stock_in: "Stock-in", adjustment: "Adjustment", sale: "Sale" };

function Notice({ notice, onClose }) {
  if (!notice) return null;
  return (
    <div className={`notice ${notice.type}`}>
      <span>{notice.text}</span>
      <button onClick={onClose}>×</button>
    </div>
  );
}

function StatusBadge({ stock, reorderLevel }) {
  const { label, className } = getStockStatus(stock, reorderLevel);
  return <span className={className}>{label}</span>;
}

const emptyForm = {
  product_name: "", category: "Plasticware",
  description: "", price: "", stock_quantity: "", reorder_level: "10",
};

function ProductModal({ product, ownerId, onSave, onClose }) {
  const isEdit = Boolean(product);
  const [form, setForm] = useState(
    isEdit
      ? {
          product_name:  product.product_name,
          category:      product.category,
          description:   product.description ?? "",
          price:         product.price,
          reorder_level: product.reorder_level,
        }
      : { ...emptyForm }
  );
  const [imageData,  setImageData]  = useState(product?.image ?? null);
  const [imageError, setImageError] = useState("");
  const [error,      setError]      = useState("");
  const [saving,     setSaving]     = useState(false);

  const setField = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageError("");
    const reader = new FileReader();
    reader.onload = () => setImageData(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    const url    = isEdit ? `${INV_URL}/${product.product_id}` : INV_URL;
    const method = isEdit ? "PUT" : "POST";
    try {
      await apiFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, owner_id: ownerId, image: imageData }),
      });
      onSave(isEdit ? "Product updated successfully." : "Product added successfully.");
    } catch (e) {
      setError(e instanceof TypeError ? NETWORK_ERROR : e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal inv-modal">
        <div className="modal-head">
          <h2>{isEdit ? "Edit Product" : "Add Product"}</h2>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">×</button>
        </div>

        <form onSubmit={handleSubmit} className="inv-modal-form">

          <div className="inv-field">
            <label htmlFor="product_name">Product Name</label>
            <input
              id="product_name" name="product_name"
              placeholder="e.g. Native Hat"
              value={form.product_name}
              onChange={setField} required
            />
          </div>

          <div className="inv-field">
            <label>Category</label>
            <div className="inv-toggle-group">
              {CATEGORIES.map((c) => (
                <button
                  key={c} type="button"
                  className={`inv-toggle${form.category === c ? " active" : ""}`}
                  onClick={() => setForm((prev) => ({ ...prev, category: c }))}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="inv-field">
            <label htmlFor="description">
              Description <span className="inv-optional">(optional)</span>
            </label>
            <input
              id="description" name="description"
              placeholder="Short product description"
              value={form.description}
              onChange={setField}
            />
          </div>

          <div className="inv-field-row">
            <div className="inv-field">
              <label htmlFor="price">Price (₱)</label>
              <input
                id="price" name="price" type="number"
                min="0" step="0.01" placeholder="e.g. 180.00"
                value={form.price} onChange={setField} required
              />
            </div>
            <div className="inv-field">
              <label htmlFor="reorder_level">Low-Stock Level</label>
              <input
                id="reorder_level" name="reorder_level" type="number"
                min="0" step="1" placeholder="e.g. 10"
                value={form.reorder_level} onChange={setField} required
              />
            </div>
          </div>

          {!isEdit && (
            <div className="inv-field">
              <label htmlFor="stock_quantity">Starting Stock</label>
              <input
                id="stock_quantity" name="stock_quantity" type="number"
                min="0" step="1" placeholder="e.g. 20"
                value={form.stock_quantity} onChange={setField} required
              />
              <small className="inv-hint">
                Stock changes after creation go through Stock Movement.
              </small>
            </div>
          )}

          <div className="inv-field">
            <label>
              Product Photo <span className="inv-optional">(optional)</span>
            </label>
            <div className="inv-img-preview">
              {imageData
                ? <img src={imageData} alt="Product preview" />
                : (
                  <div className="inv-img-empty">
                    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" width="40" height="40">
                      <rect x="4" y="8" width="40" height="32" rx="4"/>
                      <circle cx="16" cy="20" r="4"/>
                      <path d="M4 36l10-10 8 8 6-6 10 10"/>
                    </svg>
                    <span>No photo yet</span>
                  </div>
                )
              }
            </div>
            <div className="inv-img-actions">
              <label className="inv-upload-btn">
                {imageData ? "Change Photo" : "Upload Photo"}
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleImageChange}
                />
              </label>
              {imageData && (
                <button
                  type="button"
                  className="inv-btn-cancel"
                  onClick={() => { setImageData(null); setImageError(""); }}
                >
                  Remove
                </button>
              )}
            </div>
            {imageError && <small className="inv-img-error">{imageError}</small>}
            <small className="inv-hint">JPG, PNG, WEBP — any size</small>
          </div>

          {error && (
            <p className="notice error form-error" role="alert">
              <span>{error}</span>
            </p>
          )}

          <div className="inv-modal-footer">
            <button type="button" className="inv-btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="inv-btn-save" disabled={saving}>
              {saving ? "Saving…" : isEdit ? "Save Changes" : "Add Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteModal({ product, onConfirm, onClose }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    await onConfirm();
    setDeleting(false);
  };

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal" style={{ maxWidth: 420 }}>
        <div className="modal-head">
          <h2>Delete Product</h2>
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>
        <p style={{ margin: "0 0 20px", fontSize: "0.95rem" }}>
          Are you sure you want to delete <strong>"{product.product_name}"</strong>?
          This action cannot be undone.
        </p>
        <div className="inv-modal-footer">
          <button type="button" className="inv-btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="inv-btn-delete"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? "Deleting…" : "Delete Product"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ProductsTab() {
  const { auth }  = useAuth();
  const ownerId   = auth?.user?.id ?? 1;

  const [products,  setProducts]  = useState([]);
  const [summary,   setSummary]   = useState(null);
  const [lowStock,  setLowStock]  = useState([]);
  const [modal,     setModal]     = useState(null);
  const [search,    setSearch]    = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [notice,    setNotice]    = useState(null);
  const [loading,   setLoading]   = useState(true);

  const showNotice = (type, text) => {
    setNotice({ type, text });
    if (type === "success") setTimeout(() => setNotice(null), 4000);
  };
  const showError = (e) =>
    showNotice("error", e instanceof TypeError ? NETWORK_ERROR : e.message);

  const loadAll = () => {
    Promise.all([
      apiFetch(INV_URL),
      apiFetch(`${INV_URL}/summary`),
      apiFetch(`${INV_URL}/low-stock`),
    ])
      .then(([prods, summ, low]) => {
        setProducts(prods);
        setSummary(summ);
        setLowStock(low);
      })
      .catch(showError)
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadAll(); }, []);

  const handleSave = (msg) => {
    setModal(null);
    showNotice("success", msg);
    loadAll();
  };

  const handleDelete = async () => {
    try {
      await apiFetch(`${INV_URL}/${modal.product.product_id}`, { method: "DELETE" });
      setModal(null);
      showNotice("success", `"${modal.product.product_name}" deleted.`);
      loadAll();
    } catch (e) { showError(e); }
  };

  const usedCats = [...new Set(products.map((p) => p.category))].sort();
  const visible  = products.filter((p) => {
    const matchSearch = `${p.product_name} ${p.category}`
      .toLowerCase().includes(search.toLowerCase());
    const matchCat = !catFilter || p.category === catFilter;
    return matchSearch && matchCat;
  });

  return (
    <>
      <section id="headerContainer">
        <h1>Inventory</h1>
        <small>Manage your product catalogue</small>
        <div className="toolbar">
          <input
            type="search"
            placeholder="Search by name or category…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="inv-add-btn" onClick={() => setModal({ mode: "add" })}>
            + Add Product
          </button>
        </div>
      </section>

      <Notice notice={notice} onClose={() => setNotice(null)} />

      {summary && (
        <section id="summaryCards">
          <div className="summary-card">
            <strong>{summary.totalProducts}</strong><span>Products</span>
          </div>
          <div className="summary-card">
            <strong>{summary.totalUnits}</strong><span>Units on hand</span>
          </div>
          <div className="summary-card low">
            <strong>{summary.lowStock}</strong><span>Low stock</span>
          </div>
          <div className="summary-card out">
            <strong>{summary.outOfStock}</strong><span>Out of stock</span>
          </div>
        </section>
      )}

      {lowStock.length > 0 && (
        <section id="lowStockAlert" role="alert">
          <strong>
            {lowStock.length} {lowStock.length === 1 ? "product needs" : "products need"} restocking
          </strong>
          <ul>
            {lowStock.slice(0, 5).map((p) => (
              <li key={p.product_id}>
                {p.product_name}:{" "}
                {p.stock_quantity === 0
                  ? "out of stock"
                  : `${p.stock_quantity} left (reorder at ${p.reorder_level})`}
              </li>
            ))}
          </ul>
          {lowStock.length > 5 && <small>…and {lowStock.length - 5} more</small>}
        </section>
      )}

      <div className="chips">
        <button className={`chip${!catFilter ? " active" : ""}`} onClick={() => setCatFilter("")}>
          All
        </button>
        {usedCats.map((c) => (
          <button
            key={c}
            className={`chip${catFilter === c ? " active" : ""}`}
            onClick={() => setCatFilter(c)}
          >{c}</button>
        ))}
      </div>

      <section id="listContainer">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Product Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Reorder At</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={8} className="empty">Loading…</td></tr>
            )}
            {!loading && visible.length === 0 && (
              <tr><td colSpan={8} className="empty">No products found.</td></tr>
            )}
            {visible.map((p) => (
              <tr key={p.product_id} className="list-item">
                <td><strong>PRD-{String(p.product_id).padStart(3, "0")}</strong></td>
                <td>
                  <strong>{p.product_name}</strong>
                  {p.description && (
                    <><br /><small className="muted">{p.description}</small></>
                  )}
                </td>
                <td>{p.category}</td>
                <td>{fmtPrice(p.price)}</td>
                <td>{p.stock_quantity}</td>
                <td>{p.reorder_level}</td>
                <td>
                  <StatusBadge stock={p.stock_quantity} reorderLevel={p.reorder_level} />
                </td>
                <td className="actions">
                  <button onClick={() => setModal({ mode: "edit", product: p })}>Edit</button>
                  <button
                    className="danger"
                    onClick={() => setModal({ mode: "delete", product: p })}
                  >Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {(modal?.mode === "add" || modal?.mode === "edit") && (
        <ProductModal
          product={modal.mode === "edit" ? modal.product : null}
          ownerId={ownerId}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}

      {modal?.mode === "delete" && (
        <DeleteModal
          product={modal.product}
          onConfirm={handleDelete}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}

function StockMovementTab() {
  const [movements, setMovements] = useState([]);
  const [products,  setProducts]  = useState([]);
  const [form,      setForm]      = useState({
    productId: "", type: "stock_in", quantity: "", reason: ""
  });
  const [notice,  setNotice]  = useState(null);
  const [loading, setLoading] = useState(true);

  const showNotice = (type, text) => {
    setNotice({ type, text });
    if (type === "success") setTimeout(() => setNotice(null), 4000);
  };
  const showError = (e) =>
    showNotice("error", e instanceof TypeError ? NETWORK_ERROR : e.message);

  const loadAll = () => {
    Promise.all([apiFetch(MOVE_URL), apiFetch(INV_URL)])
      .then(([moves, prods]) => { setMovements(moves); setProducts(prods); })
      .catch(showError)
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadAll(); }, []);

  const setField = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiFetch(MOVE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      showNotice("success", "Stock movement recorded.");
      setForm({ productId: "", type: "stock_in", quantity: "", reason: "" });
      loadAll();
    } catch (e) { showError(e); }
  };

  const needsReason = form.type.startsWith("adjustment");

  const selectedProduct = products.find(
    (p) => String(p.product_id) === String(form.productId)
  );

  return (
    <>
      <section id="headerContainer">
        <h1>Stock Management</h1>
        <small>Record stock-ins and manual adjustments</small>
      </section>

      <Notice notice={notice} onClose={() => setNotice(null)} />

      <section id="formContainer">
        <form onSubmit={handleSubmit}>
          <h2>Record Movement</h2>

          <div className="input-field">
            <label>Product</label>
            <select name="productId" value={form.productId} onChange={setField} required>
              <option value="">Select product…</option>
              {products.map((p) => (
                <option key={p.product_id} value={p.product_id}>
                  {p.product_name} — {p.category} (stock: {p.stock_quantity})
                </option>
              ))}
            </select>
            {selectedProduct && (
              <small className="inv-hint">
                Current stock: <strong>{selectedProduct.stock_quantity}</strong> units
              </small>
            )}
          </div>

          <div className="input-field">
            <label>Movement Type</label>
            <div className="inv-toggle-group" style={{ marginTop: 4 }}>
              {MOVE_TYPES.map((t) => (
                <button
                  key={t.value} type="button"
                  className={`inv-toggle${form.type === t.value ? " active" : ""}`}
                  onClick={() => setForm((prev) => ({ ...prev, type: t.value }))}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="input-field">
            <label>Quantity</label>
            <input
              name="quantity" type="number" min="1" step="1"
              placeholder="e.g. 10"
              value={form.quantity} onChange={setField} required
            />
          </div>

          <div className="input-field">
            <label>Reason{needsReason ? "" : " (optional)"}</label>
            <input
              name="reason"
              placeholder={needsReason
                ? "Required for adjustments (e.g. damaged, lost)"
                : "e.g. supplier delivery"}
              value={form.reason} onChange={setField}
              required={needsReason}
            />
          </div>

          <div>
            <button type="submit" className="inv-btn-save">Save Movement</button>
          </div>
        </form>
      </section>

      <section id="listContainer">
        <table>
          <thead>
            <tr>
              <th>Product</th><th>Type</th><th>Previous</th>
              <th>Change</th><th>Updated</th><th>Reason</th><th>Date</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={7} className="empty">Loading…</td></tr>
            )}
            {!loading && movements.length === 0 && (
              <tr><td colSpan={7} className="empty">No stock movements yet.</td></tr>
            )}
            {movements.map((m) => (
              <tr key={m.id} className="list-item">
                <td>{m.product_name}</td>
                <td>{MOVE_LABEL[m.movement_type] ?? m.movement_type}</td>
                <td>{m.previous_stock}</td>
                <td>
                  <span className={m.quantity_change > 0 ? "in" : "out"}>
                    {m.quantity_change > 0 ? `+${m.quantity_change}` : m.quantity_change}
                  </span>
                </td>
                <td>{m.updated_stock}</td>
                <td>{m.reason || "—"}</td>
                <td>{fmtDate(m.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}

export default function Inventory() {
  const [tab, setTab] = useState("products");

  return (
    <>
      <div id="pageTabs" role="tablist">
        <button
          role="tab"
          className={tab === "products" ? "active" : ""}
          onClick={() => setTab("products")}
        >
          Products
        </button>
        {/* 2.2.1 — Stock Management tab */}
        <button
          role="tab"
          className={tab === "stock" ? "active" : ""}
          onClick={() => setTab("stock")}
        >
          Stock Management
        </button>
      </div>
      {tab === "products" ? <ProductsTab /> : <StockMovementTab />}
    </>
  );
}
