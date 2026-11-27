import { say } from "./promotionMessages";

/* ---------- Small helpers ---------- */

/* ---------- Check the form. Returns an error message, or "" when everything is fine. ----------
   (The backend checks again, this is just so the owner sees mistakes before the review popup.) */
export const validate = (d) => {
  if (!d.name) return say("errName");
  if (!(d.value > 0)) return say("errValue");
  if (d.type === "percent" && d.value > 100) return say("errPercent");
  return "";
};
