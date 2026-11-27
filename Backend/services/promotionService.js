import * as promotionModel from "../models/promotionModel.js";
import ValidationError from "../utils/promotionValidationError.js";

/* ---------- Small helpers ---------- */
const peso = (n) =>
  "₱" +
  Number(n).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

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

const checkProductsExist = (d, products) => {
  const known = new Set(products.map((p) => p.id));
  if (d.productIds.some((id) => !known.has(id)))
    throw new ValidationError("One of the chosen products no longer exists.");
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
