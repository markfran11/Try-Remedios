import * as promotionModel from "../models/promotionModel.js";
import ValidationError from "../utils/promotionValidationError.js";


/* ---------- Validation (throws ValidationError, like userService) ---------- */
export const validatePromotion = (d) => {

  if (!d.name) throw new ValidationError("Enter a promotion name.");
  if (d.name.length > 40)
    throw new ValidationError("Promotion name is too long (40 characters max).");
  if (d.type !== "percent" && d.type !== "fixed")
    throw new ValidationError("Choose a discount type.");
  if (!Number.isFinite(d.value) || !(d.value > 0))
    throw new ValidationError("Discount value must be greater than 0.");
  if (d.type === "percent" && d.value > 100)
    throw new ValidationError("A percentage discount cannot be more than 100%.");
};

// Cleans what the frontend sent so the rest of the code can trust it
const normalize = (body) => {
  return {
    name: String(body.name ?? "").trim(),
    type: body.type,
    value: Number(body.value),
  };
};

/* ---------- Insert ---------- */
export const createPromotion = async (body) => {
  const promotion = normalize(body);

  validatePromotion(promotion);

  return await promotionModel.insert(promotion);
};
