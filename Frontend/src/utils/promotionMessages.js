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
  // Empty lists
  // Product picker
  // Review popup
  // Form errors
  errName: "Enter a promotion name.",
  errValue: "Discount value must be greater than 0.",
  errPercent: "A percentage discount cannot be more than 100%.",
};

// say("saved"), say("starts", { date: "Nov 1" })
export const say = (key, vars = {}) => {
  let t = messages[key] || "";
  for (const k in vars) t = t.split("{" + k + "}").join(vars[k]);
  return t;
};

export default messages;
