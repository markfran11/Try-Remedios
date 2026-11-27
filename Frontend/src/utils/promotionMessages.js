// Every sentence the page shows. Edit the words here; keep the {curly} parts.
const messages = {
  // Small messages
  saved: "Promotion saved",
  // Popups
  titleCreate: "Create Promotion",
  discardTitle: "Discard changes?",
  discardText: "You have unsaved changes. If you close this form now, they will be lost.",
  discardOk: "Discard",
  discardKeep: "Keep editing",
  // Cards
  // Apply To list
  allProducts: "All products",
  nSelected: "{n} selected",
  // Empty lists
  // Product picker
  outOfStock: "Out of stock",
  noProducts: "No products match your search.",
  // Review popup
  // Form errors
  errName: "Enter a promotion name.",
  errPick: "Choose at least one product.",
  errValue: "Discount value must be greater than 0.",
  errPercent: "A percentage discount cannot be more than 100%.",
  errFixed: "A fixed discount must be lower than the product price ({lowest}).",
  errCodeReq: "Enter a voucher code, or press Generate.",
  errCodeFmt: "Voucher codes use 4 to 14 letters or numbers only.",
  errCodeDup: "That voucher code already belongs to another promotion.",
};

// say("saved"), say("starts", { date: "Nov 1" })
export const say = (key, vars = {}) => {
  let t = messages[key] || "";
  for (const k in vars) t = t.split("{" + k + "}").join(vars[k]);
  return t;
};

export default messages;
