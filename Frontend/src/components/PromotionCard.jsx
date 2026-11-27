import { say } from "../utils/promotionMessages";
import { appliesTo, afterPrice, day, discountLabel, fmt, formatId, peso, productLabel, usedText } from "../utils/promotionRules";
import PromotionThumb from "./PromotionThumb";

const PromotionCard = ({ promo: p, products }) => {
  const status = p.status;
  const hits = products.filter((x) => appliesTo(p, x));
  const prod = !p.code && hits.length === 1 ? hits[0] : null;   // shows the new price when it targets one product
  const when = day(0) < p.startDate ? say("starts", { date: fmt(p.startDate) }) : say("until", { date: fmt(p.endDate) });

  return (
    <article className={p.disabled ? "list-item paused" : "list-item"}>
      <div className="item-top">
        <div className="thumb">
          <span className="pic">
            {p.code ? say(p.type === "percent" ? "thumbPct" : "thumbPeso") : prod ? <PromotionThumb product={prod} /> : say("thumbAll")}
          </span>
          {!p.code && <span className="cut">{p.type === "percent" ? "-" + p.value + "%" : "-" + peso(p.value)}</span>}
        </div>

        <div className="item-info">
          {p.code ? (
            <>
              <h3><span className="vcode">{p.code}</span></h3>
              <p className="muted">{p.name}: {discountLabel(p)}, {say("anyItem")}</p>
            </>
          ) : (
            <>
              <h3>{p.name}</h3>
              <p className="muted">{productLabel(p, products)}</p>
              <p className="price">
                {prod ? peso(afterPrice(p, prod)) : discountLabel(p)}
                {prod && <s>{peso(prod.price)}</s>}
              </p>
            </>
          )}
        </div>

        <span className={"badge " + status.toLowerCase()}>{say("status" + status)}</span>
      </div>

      <p className="muted">{formatId(p.id)}: {when}, {usedText(p)}</p>

    </article>
  );
};

export default PromotionCard;
