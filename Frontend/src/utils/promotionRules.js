import { say } from "./promotionMessages";

/* ---------- Small helpers ---------- */
export const peso = (n) =>
  "₱" + Number(n).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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
  if (voucher && !d.code) return say("errCodeReq");
  if (voucher && !/^[A-Z0-9]{4,14}$/.test(d.code)) return say("errCodeFmt");
  if (voucher && promotions.some((p) => p.code === d.code && p.id !== editingId)) return say("errCodeDup");
  return "";
};
