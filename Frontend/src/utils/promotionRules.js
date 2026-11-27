import { say } from "./promotionMessages";

/* ---------- Small helpers ---------- */
const iso = (d) =>
  d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
export const day = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return iso(d); };   // today + n days
export const peso = (n) =>
  "₱" + Number(n).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const fmt = (s) =>
  new Date(s + "T00:00:00").toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
export const formatId = (id) => "PRM-" + String(id).padStart(3, "0");

/* Does promotion p apply to this product? Vouchers (with a code) work on any item. */
export const appliesTo = (p, product) =>
  Boolean(p.code) || p.applyTo === "ALL" || p.productIds.includes(product.id);

/* ---------- Text pieces built from data ---------- */
export const discountLabel = (p) =>
  p.type === "percent" ? say("pctOff", { value: p.value }) : say("fixedOff", { value: peso(p.value) });

export const usedText = (p) =>
  p.usageLimit ? say("usesLimit", { used: p.used, limit: p.usageLimit }) : say("usesFree", { used: p.used });

export const productLabel = (p, products) => {
  if (p.applyTo === "ALL") return say("allProducts");
  if (p.productIds.length === 1) {
    const found = products.find((x) => x.id === p.productIds[0]);
    return found ? found.name : say("removedProduct");
  }
  return say("nProducts", { n: p.productIds.length });
};

export const afterPrice = (d, product) =>
  Math.max(0, d.type === "percent" ? product.price * (1 - d.value / 100) : product.price - d.value);

/* ---------- Check the form. Returns an error message, or "" when everything is fine. ----------
   (The backend checks again, this is just so the owner sees mistakes before the review popup.) */
export const validate = (d, products, promotions, editingId) => {
  const voucher = d.kind === "voucher";
  if (!d.name) return say("errName");
  if (!voucher && d.applyTo === "SELECTED" && !d.productIds.length) return say("errPick");
  if (!(d.value > 0)) return say("errValue");
  if (d.type === "percent" && d.value > 100) return say("errPercent");
  if (d.type === "fixed" && !voucher) {   // a voucher can never take an item below 0, so only discounts need this check
    const targets = products.filter((p) => d.applyTo === "ALL" || d.productIds.includes(p.id));
    const lowest = Math.min(...targets.map((p) => p.price));
    if (d.value >= lowest) return say("errFixed", { lowest: peso(lowest) });
  }
  if (!d.startDate || !d.endDate) return say("errDates");
  if (d.endDate < d.startDate) return say("errOrder");
  if (!(d.usageLimit >= 0)) return say("errLimit");
  if (voucher && !d.code) return say("errCodeReq");
  if (voucher && !/^[A-Z0-9]{4,14}$/.test(d.code)) return say("errCodeFmt");
  if (voucher && promotions.some((p) => p.code === d.code && p.id !== editingId)) return say("errCodeDup");
  return "";
};

/* ---------- Warnings shown in the review popup ---------- */
export const reviewWarnings = (d, targets, promotions, editingId) => {
  const w = [];
  const voucher = d.kind === "voucher";
  if (d.type === "percent" && d.value > 50) w.push(say("warnBigPct", { value: d.value }));
  if (voucher) return w;
  if (d.applyTo === "ALL") w.push(say("warnAll"));
  else if (targets.length > 10) w.push(say("warnMany", { n: targets.length }));
  if (d.type === "fixed" && targets.some((x) => d.value >= x.price / 2)) w.push(say("warnHalf"));

  let overlap = false;   // other automatic discounts on the same products in the same dates
  promotions
    .filter((p) => p.id !== editingId && !p.code && !p.disabled && p.status !== "Expired"
      && p.endDate >= d.startDate && p.startDate <= d.endDate)
    .forEach((p) => {
      const names = targets.filter((x) => appliesTo(p, x)).map((x) => x.name);
      if (!names.length) return;
      overlap = true;
      w.push(say("warnOverlap", {
        items: names.slice(0, 3).join(", ") + (names.length > 3 ? " +" + (names.length - 3) : ""),
        name: p.name, off: discountLabel(p), until: fmt(p.endDate),
      }));
    });
  if (overlap) w.push(say("warnOverlapNote"));
  return w;
};
