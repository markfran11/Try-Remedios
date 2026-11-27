import { say } from "../utils/promotionMessages";
import PromotionCard from "./PromotionCard";

// One list of cards (used twice: product discounts and voucher codes)
const PromotionListContainer = ({ title, what, data, products, filtering, onEdit, onToggle, onDelete }) => {
  return (
    <>
      <h2 className="sec">{title} <span className="count">{data.length}</span></h2>
      <div className="list-container">
        {data.length === 0 ? (
          <div className="empty">
            <strong>{say(filtering ? "matchTitle" : "noneTitle", { what: say(what) })}</strong>
            <span>{filtering ? say("matchHint") : ""}</span>
          </div>
        ) : (
          data.map((p) => (
            <PromotionCard key={p.id} promo={p} products={products} onEdit={onEdit} onToggle={onToggle} onDelete={onDelete} />
          ))
        )}
      </div>
    </>
  );
};

export default PromotionListContainer;
