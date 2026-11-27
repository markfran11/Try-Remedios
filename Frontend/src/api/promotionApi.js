// All calls to the Promotions backend live here.
import { API_BASE } from "../constants/api";
const BASE = `${API_BASE}/promotion`;

// Throws an Error with the backend's message (e.g. "Voucher code already exists") so the page can show it
const request = async (path, options = {}) => {
  const response = await fetch(BASE + path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Something went wrong");
  }
  return data;
};

// filters = { search, status, type } (empty ones are left out)
export const getPromotions = (filters = {}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => value && params.set(key, value));
  const query = params.toString();
  return request("/" + (query ? "?" + query : ""));
};
export const getProducts = () => request("/products");
export const createPromotion = (promotion) =>
  request("/", { method: "POST", body: JSON.stringify(promotion) });
export const updatePromotion = (id, promotion) =>
  request("/" + id, { method: "PUT", body: JSON.stringify(promotion) });
export const setDisabled = (id, disabled) =>
  request("/" + id + "/status", { method: "PATCH", body: JSON.stringify({ disabled }) });
export const deletePromotion = (id) => request("/" + id, { method: "DELETE" });
