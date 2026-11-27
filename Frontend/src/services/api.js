// ─── Base URL ────────────────────────────────────────────────────────────────
export const API_BASE = "http://localhost:3001";

export const NETWORK_ERROR =
  "Unable to connect to the server. Please check your connection or start the backend.";

// ─── Generic fetch helper ─────────────────────────────────────────────────────
// Throws an Error with the server's error message on non-OK responses.
export async function apiFetch(url, options = {}) {
  const res  = await fetch(url, options);
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || "Request failed");
  return body;
}

// ─── Auth helpers ─────────────────────────────────────────────────────────────
export const authHeaders = (token) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

// ─── Endpoint constants ───────────────────────────────────────────────────────
export const ENDPOINTS = {
  // auth
  register:       `${API_BASE}/user/register`,
  login:          `${API_BASE}/user/login`,

  // products / inventory
  products:       `${API_BASE}/inventory`,
  productSummary: `${API_BASE}/inventory/summary`,
  lowStock:       `${API_BASE}/inventory/low-stock`,

  // stock movement
  stockMovement:  `${API_BASE}/stock-movement`,

  // orders (customer_order)
  orders:         `${API_BASE}/sale/orders`,
  orderById:      (id) => `${API_BASE}/sale/orders/${id}`,
  orderStatus:    (id) => `${API_BASE}/sale/orders/${id}/status`,

  // direct sales (POS)
  sales:          `${API_BASE}/sale/sales`,
  saleById:       (id) => `${API_BASE}/sale/sales/${id}`,

  // promotions
  promotions:     `${API_BASE}/promotion`,
  promotionById:  (id) => `${API_BASE}/promotion/${id}`,
  promoEnabled:   (id) => `${API_BASE}/promotion/${id}/enabled`,

  // analytics
  analyticsSummary:  (y, m) => `${API_BASE}/analytics/summary?year=${y}&month=${m}`,
  analyticsTrend:    (y, m) => `${API_BASE}/analytics/trend?year=${y}&month=${m}`,
  analyticsOrders:   `${API_BASE}/analytics/order-status`,
  analyticsTop:      `${API_BASE}/analytics/top-products`,
  analyticsProducts: `${API_BASE}/analytics/products`,
};
