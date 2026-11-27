import * as promotionModel from "../models/promotionModel.js";
import ValidationError from "../utils/promotionValidationError.js";

/* ---------- Small helpers ---------- */
const pad = (n) => String(n).padStart(2, "0");
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const peso = (n) =>
  "₱" +
  Number(n).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
const round2 = (n) => Math.round(n * 100) / 100;

// Does promotion p apply to this product? Vouchers (with a code) work on any item.
export const appliesTo = (p, product) =>
  Boolean(p.code) || p.applyTo === "ALL" || p.productIds.includes(product.id);

// Status is worked out from the dates, usage and the Disable switch
export const statusOf = (p) => {
  if (p.disabled) return "Disabled";
  if (today() > p.endDate || (p.usageLimit > 0 && p.used >= p.usageLimit))
    return "Expired";
  if (today() < p.startDate) return "Scheduled";
  return "Active";
};

/* ---------- Validation (throws ValidationError, like userService) ---------- */
export const validatePromotion = (d, products) => {
  const voucher = d.kind === "voucher";

  if (!d.name) throw new ValidationError("Enter a promotion name.");
  if (d.name.length > 40)
    throw new ValidationError("Promotion name is too long (40 characters max).");
  if (d.type !== "percent" && d.type !== "fixed")
    throw new ValidationError("Choose a discount type.");
  if (!voucher && d.applyTo === "SELECTED" && d.productIds.length === 0)
    throw new ValidationError("Choose at least one product.");
  if (!Number.isFinite(d.value) || !(d.value > 0))
    throw new ValidationError("Discount value must be greater than 0.");
  if (d.type === "percent" && d.value > 100)
    throw new ValidationError("A percentage discount cannot be more than 100%.");

  if (d.type === "fixed" && !voucher) {
    // a voucher can never take an item below 0, so only discounts need this check
    const targets = products.filter(
      (p) => d.applyTo === "ALL" || d.productIds.includes(p.id),
    );
    const lowest = Math.min(...targets.map((p) => p.price));
    if (d.value >= lowest)
      throw new ValidationError(
        `A fixed discount must be lower than the product price (${peso(lowest)}).`,
      );
  }

  const isDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s || "");
  if (!isDate(d.startDate) || !isDate(d.endDate))
    throw new ValidationError("Choose a start date and an expiration date.");
  if (d.endDate < d.startDate)
    throw new ValidationError(
      "The expiration date cannot be before the start date.",
    );
  if (!Number.isInteger(d.usageLimit) || d.usageLimit < 0)
    throw new ValidationError("Usage limit must be 0 or more.");

  if (voucher && !d.code)
    throw new ValidationError("Enter a voucher code, or press Generate.");
  if (voucher && !/^[A-Z0-9]{4,14}$/.test(d.code))
    throw new ValidationError("Voucher codes use 4 to 14 letters or numbers only.");
};

// Cleans what the frontend sent so the rest of the code can trust it
const normalize = (body) => {
  const voucher = body.kind === "voucher";
  const applyTo = voucher || body.applyTo !== "SELECTED" ? "ALL" : "SELECTED";
  return {
    id: body.id,
    kind: voucher ? "voucher" : "discount",
    name: String(body.name ?? "").trim(),
    applyTo,
    productIds:
      applyTo === "SELECTED" && Array.isArray(body.productIds)
        ? [...new Set(body.productIds.map(Number))]
        : [],
    type: body.type,
    value: Number(body.value),
    code: voucher ? String(body.code ?? "").trim().toUpperCase() : null,
    startDate: body.startDate,
    endDate: body.endDate,
    usageLimit: body.usageLimit === "" || body.usageLimit == null ? 0 : Number(body.usageLimit),
  };
};

// The voucher code must be unique (a promotion may keep its own code when edited)
const checkCodeIsFree = async (code, ownId) => {
  if (!code) return;
  const existing = await promotionModel.findPromotionByCode(code);
  if (existing.length > 0 && existing[0].id !== ownId)
    throw new ValidationError(
      "That voucher code already belongs to another promotion.",
    );
};

// Once a promotion has been used, old orders depend on it. Only the name, the
// expiration date and the usage limit may still change.
const checkUsedPromotionIsNotChanged = (old, d) => {
  if (old.used <= 0) return;

  const sameProducts =
    old.productIds.length === d.productIds.length &&
    old.productIds.every((id) => d.productIds.includes(id));
  const changed =
    d.type !== old.type ||
    d.value !== old.value ||
    d.applyTo !== old.applyTo ||
    !sameProducts ||
    (d.code || null) !== (old.code || null) ||
    d.startDate !== old.startDate;
  if (changed)
    throw new ValidationError(
      "This promotion was already used, so its discount, products, voucher code and start date can't be changed. You can still change the name, expiration date and usage limit.",
      409,
    );

  if (d.usageLimit > 0 && d.usageLimit < old.used)
    throw new ValidationError(
      `Usage limit can't be lower than the uses so far (${old.used}).`,
    );
};

const checkProductsExist = (d, products) => {
  const known = new Set(products.map((p) => p.id));
  if (d.productIds.some((id) => !known.has(id)))
    throw new ValidationError("One of the chosen products no longer exists.");
};

/* ---------- Retrieve ---------- */
// Search (name, code or ID) and filters (status, discount type) are done here, not in the page
const formatId = (id) => "PRM-" + String(id).padStart(3, "0");

export const fetchAllPromotions = async (filters = {}) => {
  const search = String(filters.search || "").trim().toLowerCase();
  const promotions = (await promotionModel.fetch()).map((p) => ({ ...p, status: statusOf(p) }));

  return promotions.filter(
    (p) =>
      (!search || (formatId(p.id) + " " + p.name + " " + (p.code || "")).toLowerCase().includes(search)) &&
      (!filters.status || p.status === filters.status) &&
      (!filters.type || p.type === filters.type),
  );
};

export const fetchAllProducts = async () => {
  const products = await promotionModel.fetchProducts();
  return products;
};

/* ---------- Insert ---------- */
export const createPromotion = async (body) => {
  const promotion = normalize(body);
  const products = await promotionModel.fetchProducts();

  validatePromotion(promotion, products);
  checkProductsExist(promotion, products);
  await checkCodeIsFree(promotion.code, undefined);

  try {
    return await promotionModel.insert(promotion);
  } catch (e) {
    // two people saving the same code at the same time: the database UNIQUE rule catches it
    if (e.code === "ER_DUP_ENTRY")
      throw new ValidationError(
        "That voucher code already belongs to another promotion.",
      );
    throw e;
  }
};

/* ---------- Update ---------- */
export const updatePromotion = async (body) => {
  const promotion = normalize(body);
  const existing = await promotionModel.findPromotionById(promotion.id);
  if (existing.length === 0)
    throw new ValidationError("Promotion does not exist!", 404);

  const products = await promotionModel.fetchProducts();
  validatePromotion(promotion, products);
  checkProductsExist(promotion, products);
  checkUsedPromotionIsNotChanged(existing[0], promotion);
  await checkCodeIsFree(promotion.code, promotion.id);

  try {
    return await promotionModel.update(promotion);
  } catch (e) {
    if (e.code === "ER_DUP_ENTRY")
      throw new ValidationError(
        "That voucher code already belongs to another promotion.",
      );
    throw e;
  }
};

/* ---------- Enable / Disable ---------- */
export const setPromotionDisabled = async (id, disabled) => {
  const existing = await promotionModel.findPromotionById(id);
  if (existing.length === 0)
    throw new ValidationError("Promotion does not exist!", 404);

  return await promotionModel.updateDisabled(id, Boolean(disabled));
};

/* ---------- Delete ---------- */
export const deletePromotion = async (id) => {
  const existing = await promotionModel.findPromotionById(id);
  if (existing.length === 0)
    throw new ValidationError("Promotion does not exist!", 404);

  // a used promotion that is still live (Active or Scheduled) must be disabled first
  const status = statusOf(existing[0]);
  if (existing[0].used > 0 && status !== "Disabled" && status !== "Expired")
    throw new ValidationError(
      "This promotion was already used and is still live. Disable it first, then you can delete it.",
      409,
    );

  return await promotionModel.remove(id);
};

/* ---------- Pricing (BRD ReqID 21 and 22) ----------
   Used by the Orders / Shop part of the system.
   Applies the single best active discount (no stacking). A voucher needs the
   matching code. A percentage voucher takes % off the item total; a fixed
   voucher comes off once. */
export const computePromoPrice = (product, promotions, qty, code) => {
  const full = product.price * qty;
  const typed = String(code ?? "").toUpperCase();
  let best = 0;
  let applied = null;

  promotions.forEach((p) => {
    if (statusOf(p) !== "Active" || !appliesTo(p, product)) return;
    if (p.code && p.code !== typed) return; // vouchers need the matching code
    const off = Math.min(
      full,
      p.type === "percent"
        ? (full * p.value) / 100
        : p.value * (p.code ? 1 : qty),
    );
    if (off > best) {
      best = off;
      applied = p;
    }
  });

  const total = round2(full - best);
  return {
    unitPrice: qty > 0 ? round2(total / qty) : product.price,
    total,
    discount: round2(best),
    promo: applied,
  };
};

export const getPromoPrice = async (productId, qty, code) => {
  const quantity = Number(qty);
  if (!Number.isInteger(quantity) || quantity <= 0)
    throw new ValidationError("Quantity must be a whole number above 0.");

  const products = await promotionModel.fetchProducts();
  const product = products.find((p) => p.id === Number(productId));
  if (!product) throw new ValidationError("Product does not exist!", 404);

  const promotions = await promotionModel.fetch();
  return computePromoPrice(product, promotions, quantity, code);
};

/* Price of a whole cart (1 or more products).
   Step 1: every product gets its own automatic discount, if it has one.
   Step 2: a voucher code is taken off the WHOLE total, once, after the product
   discounts (both can be used together). A fixed voucher of 50 pesos takes 50 off
   the total, however many products are in the cart. A percentage voucher takes
   that % off the total. The code never makes the total go below 0. */
export const computeCartPrice = (products, promotions, items, code) => {
  const typed = String(code ?? "").trim().toUpperCase();

  // same product listed twice -> one line
  const qtyById = new Map();
  items.forEach((i) => qtyById.set(Number(i.productId), (qtyById.get(Number(i.productId)) || 0) + Number(i.qty)));

  const lines = [...qtyById].map(([productId, qty]) => {
    const product = products.find((p) => p.id === productId);
    if (!product) throw new ValidationError("Product does not exist!", 404);
    if (!Number.isInteger(qty) || qty <= 0)
      throw new ValidationError("Quantity must be a whole number above 0.");
    const price = computePromoPrice(product, promotions, qty, ""); // product discounts only
    return {
      productId: product.id,
      name: product.name,
      qty,
      unitPrice: price.unitPrice,
      total: price.total,
      discount: price.discount,
      promo: price.promo,
    };
  });

  const sum = (key) => round2(lines.reduce((s, l) => s + l[key], 0));
  const subtotal = sum("total");
  const productDiscount = sum("discount");

  let voucher = null;
  let voucherDiscount = 0;
  if (typed) {
    const promo = promotions.find((p) => p.code === typed);
    if (!promo) throw new ValidationError("Voucher code not found.", 404);
    if (statusOf(promo) !== "Active")
      throw new ValidationError(`This voucher can't be used (${statusOf(promo).toLowerCase()}).`, 409);

    const off = promo.type === "percent" ? (subtotal * promo.value) / 100 : promo.value;
    voucherDiscount = round2(Math.min(subtotal, off));
    voucher = { id: promo.id, code: promo.code, discount: voucherDiscount };
  }

  return {
    lines,
    subtotal,                                            // after the product discounts, before the voucher
    productDiscount,
    voucher,                                             // null when no code was used
    discount: round2(productDiscount + voucherDiscount), // all discounts together
    total: round2(subtotal - voucherDiscount),
  };
};

export const getCartPrice = async (items, code) => {
  if (!Array.isArray(items) || items.length === 0)
    throw new ValidationError("The cart is empty.");

  const products = await promotionModel.fetchProducts();
  const promotions = await promotionModel.fetch();
  return computeCartPrice(products, promotions, items, code);
};

// Called by the Orders part when an order is confirmed: counts one use of the promotion.
// It only works while the promotion is Active and the usage limit is not reached yet.
export const usePromotion = async (id) => {
  const existing = await promotionModel.findPromotionById(id);
  if (existing.length === 0)
    throw new ValidationError("Promotion does not exist!", 404);

  const counted = await promotionModel.incrementUsed(id, today());
  const [latest] = await promotionModel.findPromotionById(id);
  if (counted === 0)
    throw new ValidationError(
      `This promotion can't be used (${statusOf(latest).toLowerCase()}).`,
      409,
    );

  return { used: latest.used };
};

// Checks a typed voucher code. reason: "empty", "notfound", "disabled", "scheduled" or "expired"
export const checkVoucher = async (code) => {
  const typed = String(code ?? "").trim().toUpperCase();
  if (!typed) return { ok: false, promo: null, reason: "empty" };

  const found = await promotionModel.findPromotionByCode(typed);
  if (found.length === 0) return { ok: false, promo: null, reason: "notfound" };

  const status = statusOf(found[0]);
  return status === "Active"
    ? { ok: true, promo: found[0], reason: "" }
    : { ok: false, promo: found[0], reason: status.toLowerCase() };
};
