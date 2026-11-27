import { useState } from "react";
import { say } from "../utils/promotionMessages";
import { peso } from "../utils/promotionRules";
import PromotionThumb from "./PromotionThumb";

// Tick the products of the chosen category. The ticked ids are kept by the form (ids / onChange).
const PromotionProductPicker = ({ products, cat, ids, onChange, disabled = false }) => {
  const [query, setQuery] = useState("");

  const items = products.filter(
    (p) => p.category === cat && p.name.toLowerCase().includes(query.trim().toLowerCase()),
  );
  const ticked = items.filter((p) => ids.includes(p.id)).length;

  const toggleOne = (id, checked) => {
    onChange(checked ? [...ids, id] : ids.filter((x) => x !== id));
  };

  const toggleAll = (checked) => {   // ticks or unticks the products currently shown
    const shown = items.map((p) => p.id);
    onChange(checked ? [...new Set([...ids, ...shown])] : ids.filter((x) => !shown.includes(x)));
  };

  return (
    <div>
      <input
        type="search"
        placeholder="Search products in this category..."
        aria-label="Search products"
        id="pickSearch"
        disabled={disabled}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="picker-head">
        <label className="check">
          <input
            type="checkbox"
            checked={items.length > 0 && ticked === items.length}
            disabled={disabled}
            ref={(el) => { if (el) el.indeterminate = ticked > 0 && ticked < items.length; }}
            onChange={(e) => toggleAll(e.target.checked)}
          /> Select all
        </label>
        <span className="muted">{say("nSelected", { n: ids.length })}</span>
      </div>
      <div className="prod-list">
        {items.length === 0 ? (
          <p className="hint pad">{say("noProducts")}</p>
        ) : (
          items.map((p) => {
            const out = typeof p.stock === "number" && p.stock <= 0;   // out of stock: still selectable, just marked
            return (
              <label key={p.id} className={out ? "prod out" : "prod"}>
                <input type="checkbox" disabled={disabled} checked={ids.includes(p.id)} onChange={(e) => toggleOne(p.id, e.target.checked)} />
                <span className="pthumb"><PromotionThumb product={p} /></span>
                <span className="pname">{p.name} {out && <small>{say("outOfStock")}</small>}</span>
                <span className="pprice">{peso(p.price)}</span>
              </label>
            );
          })
        )}
      </div>
    </div>
  );
};

export default PromotionProductPicker;
