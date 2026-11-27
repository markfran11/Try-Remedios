
// Returns { label, className } for use in StatusBadge and anywhere else.
// reorderLevel defaults to 10 when not supplied.
export function getStockStatus(stock, reorderLevel = 10) {
  if (stock <= 0) {
    return { label: "Out of Stock", className: "badge out" };
  }
  if (stock <= reorderLevel) {
    return { label: "Low Stock", className: "badge low" };
  }
  return { label: "In Stock", className: "badge in" };
}
