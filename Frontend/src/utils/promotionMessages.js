// Every sentence the page shows. Edit the words here; keep the {curly} parts.
const messages = {
  // Small messages
  saved: "Promotion saved",
  deleted: "Promotion deleted",
  disabled: "Promotion disabled",
  enabled: "Promotion enabled",
  loadFailed: "Unable to load promotions. Is the backend running?",
  // Popups
  titleCreate: "Create Promotion",
  titleEdit: "Edit Promotion",
  delTitle: "Delete promotion?",
  delText: "“{name}” will be removed. This cannot be undone.",
  delUsedText: "“{name}” was used {n} times. Deleting it removes its record for good. This cannot be undone.",
  delOk: "Delete",
  usedTitle: "Can’t delete this promotion",
  usedText: "“{name}” was already used (uses so far: {n}) and is still live, so disable it first. After that you can delete it. Disable it now?",
  usedOk: "Disable",
  discardTitle: "Discard changes?",
  discardText: "You have unsaved changes. If you close this form now, they will be lost.",
  discardOk: "Discard",
  discardKeep: "Keep editing",
  // Cards
  disable: "Disable",
  enable: "Enable",
  statusActive: "Active",
  statusScheduled: "Scheduled",
  statusExpired: "Expired",
  statusDisabled: "Disabled",
  starts: "Starts {date}",
  until: "Until {date}",
  usesLimit: "{used} of {limit} uses",
  usesFree: "{used} uses, no limit",
  pctOff: "{value}% off",
  fixedOff: "{value} off",
  anyItem: "any one item",
  thumbAll: "★",
  thumbPct: "%",
  thumbPeso: "₱",
  // Apply To list
  allProducts: "All products",
  removedProduct: "(removed product)",
  nProducts: "{n} products",
  nSelected: "{n} selected",
  // Empty lists
  whatDiscounts: "product discounts",
  whatVouchers: "voucher codes",
  noneTitle: "No {what} yet",
  matchTitle: "No {what} match your search",
  matchHint: "Try a different search or filter.",
  // Product picker
  outOfStock: "Out of stock",
  noProducts: "No products match your search.",
  // Review popup
  reviewDiscount: "{name}: {off}, from {from} to {to}, {limit}.",
  reviewVoucher: "Voucher {code} ({name}): {off} on any one item the customer chooses, from {from} to {to}, {limit}.",
  limitNone: "no usage limit",
  limitN: "limited to {n} uses",
  reviewAll: "Applies to every product ({n} products).",
  reviewMore: "+ {n} more products",
  reviewPrice: "{was} → {now}",
  warnBigPct: "This is a big discount: {value}% off.",
  warnAll: "This applies to every product.",
  warnMany: "This applies to {n} products.",
  warnHalf: "The fixed discount is more than half the price of some products.",
  warnOverlap: "{items}: already in “{name}” ({off}) until {until}.",
  warnOverlapNote: "Only the biggest discount applies to a product; discounts never add together.",
  // Form errors
  errName: "Enter a promotion name.",
  errPick: "Choose at least one product.",
  errValue: "Discount value must be greater than 0.",
  errPercent: "A percentage discount cannot be more than 100%.",
  errFixed: "A fixed discount must be lower than the product price ({lowest}).",
  errDates: "Choose a start date and an expiration date.",
  errOrder: "The expiration date cannot be before the start date.",
  errLimit: "Usage limit must be 0 or more.",
  errLimitLow: "Usage limit can’t be lower than the uses so far ({n}).",
  lockedNote: "This promotion was already used ({n} uses), so its discount, products, voucher code and start date are locked. You can still change the name, expiration date and usage limit.",
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
