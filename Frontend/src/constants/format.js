export const fmtPrice = (v) => `₱${Number(v).toFixed(2)}`;

export const fmtDate = (v) =>
  new Date(v).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

export const fmtMonth = (year, month) => {
  const d = new Date(year, month - 1, 1);
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
};

export const padId = (id, prefix = "PRD") =>
  `${prefix}-${String(id).padStart(3, "0")}`;
