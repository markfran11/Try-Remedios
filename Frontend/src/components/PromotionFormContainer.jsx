import { useState } from "react";
import { say } from "../utils/promotionMessages";
import PromotionModal from "./PromotionModal";
import PromotionConfirmModal from "./PromotionConfirmModal";
import PromotionProductPicker from "./PromotionProductPicker";
import { day, validate } from "../utils/promotionRules";

// Create / Edit popup. "editing" is the promotion being edited, or null when creating a new one.
const PromotionFormContainer = ({ editing, products, promotions, error, onError, onReview, onClose }) => {
  const categories = [...new Set(products.map((p) => p.category).filter(Boolean))];

  // starting values (empty for a new promotion, the saved values when editing)
  const firstProduct = editing ? products.find((x) => editing.productIds.includes(x.id)) : null;
  const [name, setName] = useState(editing ? editing.name : "");
  const [kind, setKind] = useState(editing && editing.code ? "voucher" : "discount");
  const [cat, setCat] = useState(editing && editing.applyTo === "SELECTED" && firstProduct ? firstProduct.category : "ALL");   // "ALL" or a category name
  const [ids, setIds] = useState(editing ? editing.productIds : []);
  const [type, setType] = useState(editing ? editing.type : "percent");
  const [value, setValue] = useState(editing ? String(editing.value) : "");
  const [code, setCode] = useState(editing && editing.code ? editing.code : "");
  const [startDate, setStartDate] = useState(editing ? editing.startDate : day(0));
  const [endDate, setEndDate] = useState(editing ? editing.endDate : day(30));
  const [usageLimit, setUsageLimit] = useState(editing ? String(editing.usageLimit) : "0");

  const voucher = kind === "voucher";
  const locked = Boolean(editing && editing.used > 0);   // already used: the discount details cannot be changed

  // Closing: clicking the dark background does nothing, and closing a form with unsaved
  // changes (X, Cancel or Esc) asks first, so a wrong tap does not wipe what was typed.
  const snapshot = JSON.stringify({ name, kind, cat, ids, type, value, code, startDate, endDate, usageLimit });
  const [savedSnapshot] = useState(snapshot);   // the values when the form opened
  const [askDiscard, setAskDiscard] = useState(false);
  const requestClose = () => {
    if (snapshot === savedSnapshot) onClose();
    else setAskDiscard(true);
  };

  // Generate a random voucher code (letters and numbers, no confusing 0/O or 1/I)
  const generateCode = () => {
    const A = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let c;
    do {
      c = "";
      for (let i = 0; i < 8; i++) c += A[Math.floor(Math.random() * A.length)];
    } while (promotions.some((p) => p.code === c));
    setCode(c);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const all = voucher || cat === "ALL";
    const data = {
      kind,
      name: name.trim(),
      applyTo: all ? "ALL" : "SELECTED",
      productIds: all ? [] : ids,
      type,
      value: parseFloat(value),
      code: voucher ? code.trim().toUpperCase() : "",
      startDate,
      endDate,
      usageLimit: parseInt(usageLimit || "0", 10),
    };
    const err = validate(data, products, promotions, editing ? editing.id : null);
    onError(err);
    if (!err) onReview(data);
  };

  return (
    <>
    <PromotionModal labelledBy="modalTitle" closeOnOverlay={false} onClose={requestClose}>
      <form id="promotionForm" onSubmit={handleSubmit} noValidate>
        <div className="modal-head">
          <h2 id="modalTitle">{say(editing ? "titleEdit" : "titleCreate")}</h2>
          <button type="button" className="x" aria-label="Close" onClick={requestClose}>&times;</button>
        </div>

        {locked && <p className="hint locked-note">{say("lockedNote", { n: editing.used })}</p>}

        <label>Promotion Name
          <input maxLength={40} placeholder="e.g. Native Hat Sale" autoFocus value={name} onChange={(e) => setName(e.target.value)} />
        </label>

        <fieldset className="picker">
          <legend>Promotion Kind</legend>
          <div className="chips seg" role="radiogroup" aria-label="Promotion Kind">
            <label className="chip"><input type="radio" name="kind" disabled={locked} checked={kind === "discount"} onChange={() => setKind("discount")} /><span>Product discount</span></label>
            <label className="chip"><input type="radio" name="kind" disabled={locked} checked={kind === "voucher"} onChange={() => setKind("voucher")} /><span>Voucher code</span></label>
          </div>
        </fieldset>

        {/* Apply To: pick a category first, then tick the products of that category */}
        {!voucher && (
          <fieldset className="picker">
            <legend>Apply To</legend>
            <div className="chips" role="radiogroup" aria-label="Category">
              {["ALL", ...categories].map((c) => (
                <label key={c} className="chip">
                  <input type="radio" name="cat" value={c} disabled={locked} checked={cat === c} onChange={() => setCat(c)} />
                  <span>{c === "ALL" ? say("allProducts") : c}</span>
                </label>
              ))}
            </div>
            {cat === "ALL"
              ? <p className="hint">This discount applies to every product.</p>
              : <PromotionProductPicker key={cat} products={products} cat={cat} ids={ids} onChange={setIds} disabled={locked} />}
          </fieldset>
        )}

        <div className="row">
          <fieldset className="picker">
            <legend>Discount Type</legend>
            <div className="chips seg" role="radiogroup" aria-label="Discount Type">
              <label className="chip"><input type="radio" name="type" disabled={locked} checked={type === "percent"} onChange={() => setType("percent")} /><span>% off</span></label>
              <label className="chip"><input type="radio" name="type" disabled={locked} checked={type === "fixed"} onChange={() => setType("fixed")} /><span>₱ off</span></label>
            </div>
          </fieldset>
          <label>Discount Value
            <input type="number" min="0" step="0.01" placeholder="e.g. 10" disabled={locked} value={value} onChange={(e) => setValue(e.target.value)} />
          </label>
        </div>

        {voucher && (
          <label>Voucher Code
            <span className="inline">
              <input maxLength={14} placeholder="e.g. WELCOME50" disabled={locked} value={code} onChange={(e) => setCode(e.target.value)} />
              <button type="button" className="btn" disabled={locked} onClick={generateCode}>Generate</button>
            </span>
            <small className="field-hint">4 to 14 letters or numbers</small>
          </label>
        )}

        <div className="row">
          <label>Start Date <input type="date" disabled={locked} value={startDate} onChange={(e) => setStartDate(e.target.value)} /></label>
          <label>Expiration Date <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></label>
        </div>

        <label>Usage Limit
          <input type="number" min="0" step="1" value={usageLimit} onChange={(e) => setUsageLimit(e.target.value)} />
          <small className="field-hint">0 = unlimited</small>
        </label>

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
