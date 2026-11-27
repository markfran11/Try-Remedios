import { useState } from "react";
import { say } from "../utils/promotionMessages";
import PromotionModal from "./PromotionModal";
import PromotionConfirmModal from "./PromotionConfirmModal";
import { validate } from "../utils/promotionRules";

// Create popup: the owner fills in the promotion, then it goes to the page to be saved.
const PromotionFormContainer = ({ error, onError, onReview, onClose }) => {
  const [name, setName] = useState("");
  const [type, setType] = useState("percent");
  const [value, setValue] = useState("");

  // Closing: clicking the dark background does nothing, and closing a form with unsaved
  // changes (X, Cancel or Esc) asks first, so a wrong tap does not wipe what was typed.
  const snapshot = JSON.stringify({ name, type, value });
  const [savedSnapshot] = useState(snapshot);   // the values when the form opened
  const [askDiscard, setAskDiscard] = useState(false);
  const requestClose = () => {
    if (snapshot === savedSnapshot) onClose();
    else setAskDiscard(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      name: name.trim(),
      type,
      value: parseFloat(value),
    };
    const err = validate(data);
    onError(err);
    if (!err) onReview(data);
  };

  return (
    <>
    <PromotionModal labelledBy="modalTitle" closeOnOverlay={false} onClose={requestClose}>
      <form id="promotionForm" onSubmit={handleSubmit} noValidate>
        <div className="modal-head">
          <h2 id="modalTitle">{say("titleCreate")}</h2>
          <button type="button" className="x" aria-label="Close" onClick={requestClose}>&times;</button>
        </div>

        <label>Promotion Name
          <input maxLength={40} placeholder="e.g. Native Hat Sale" autoFocus value={name} onChange={(e) => setName(e.target.value)} />
        </label>

        <div className="row">
          <fieldset className="picker">
            <legend>Discount Type</legend>
            <div className="chips seg" role="radiogroup" aria-label="Discount Type">
              <label className="chip"><input type="radio" name="type" checked={type === "percent"} onChange={() => setType("percent")} /><span>% off</span></label>
              <label className="chip"><input type="radio" name="type" checked={type === "fixed"} onChange={() => setType("fixed")} /><span>₱ off</span></label>
            </div>
          </fieldset>
          <label>Discount Value
            <input type="number" min="0" step="0.01" placeholder="e.g. 10" value={value} onChange={(e) => setValue(e.target.value)} />
          </label>
        </div>

        <p className="error" role="alert">{error}</p>
        <div className="actions">
          <button type="button" className="btn" onClick={requestClose}>Cancel</button>
          <button type="submit" className="btn primary">Save Promotion</button>
        </div>
      </form>
    </PromotionModal>
    {askDiscard && (
      <PromotionConfirmModal
        title={say("discardTitle")}
        text={say("discardText")}
        okLabel={say("discardOk")}
        cancelLabel={say("discardKeep")}
        danger
        onOk={onClose}
        onCancel={() => setAskDiscard(false)}
      />
    )}
    </>
  );
};

export default PromotionFormContainer;
