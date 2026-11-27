import { say } from "../utils/promotionMessages";
import PromotionModal from "./PromotionModal";
import { afterPrice, appliesTo, discountLabel, fmt, peso, reviewWarnings } from "../utils/promotionRules";

// Shown every time before a promotion is saved: summary, new prices and warnings
const PromotionReviewModal = ({ data: d, products, promotions, editingId, onBack, onConfirm }) => {
  const voucher = d.kind === "voucher";
  const targets = voucher ? [] : products.filter((x) => appliesTo(d, x));
  const warnings = reviewWarnings(d, targets, promotions, editingId);

  const summary = say(voucher ? "reviewVoucher" : "reviewDiscount", {
    name: d.name, code: d.code, off: discountLabel(d), from: fmt(d.startDate), to: fmt(d.endDate),
    limit: d.usageLimit ? say("limitN", { n: d.usageLimit }) : say("limitNone"),
  });

  return (
    <PromotionModal labelledBy="reviewTitle" onClose={onBack}>
      <div className="modal-head"><h2 id="reviewTitle">Review before saving</h2></div>
      <p className="review-sum">{summary}</p>

      {!voucher && (
        <div>
          <p className="muted">Products and their new prices</p>
          <ul className="review-list">
            {d.applyTo === "ALL" ? (
              <li>{say("reviewAll", { n: products.length })}</li>
            ) : (
              <>
                {targets.slice(0, 8).map((x) => (
                  <li key={x.id}>
                    <span>{x.name}</span>
                    <span>{say("reviewPrice", { was: peso(x.price), now: peso(afterPrice(d, x)) })}</span>
                  </li>
                ))}
                {targets.length > 8 && <li>{say("reviewMore", { n: targets.length - 8 })}</li>}
              </>
            )}
          </ul>
        </div>
      )}

      {warnings.length > 0 && (
        <div className="review-warn">
          <strong>Please double-check</strong>
          <ul>{warnings.map((w) => <li key={w}>{w}</li>)}</ul>
        </div>
      )}

      <div className="actions">
        <button type="button" className="btn" onClick={onBack}>Back to edit</button>
        <button type="button" className="btn primary" autoFocus onClick={() => onConfirm(d)}>Confirm and save</button>
      </div>
    </PromotionModal>
  );
};

export default PromotionReviewModal;
