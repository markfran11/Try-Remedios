import "../../promotions.css";
import { useEffect, useState } from "react";
import { say } from "../../utils/promotionMessages";
import * as promotionApi from "../../api/promotionApi";
import PromotionHeaderContainer from "../../components/PromotionHeaderContainer";
import PromotionListContainer from "../../components/PromotionListContainer";
import PromotionFormContainer from "../../components/PromotionFormContainer";
import PromotionReviewModal from "../../components/PromotionReviewModal";
import PromotionToasts from "../../components/PromotionToasts";

// gets the promotions and the products (for the "Apply To" picker) from the backend
const fetchAll = async () => {
  const [promotions, products] = await Promise.all([
    promotionApi.getPromotions(),
    promotionApi.getProducts(),
  ]);
  return { promotions, products };
};

const Promotions = () => {
  const [promotions, setPromotions] = useState([]);
  const [products, setProducts] = useState([]);
  const [loadError, setLoadError] = useState("");

  // popups
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);   // null = creating a new promotion
  const [formError, setFormError] = useState("");
  const [review, setReview] = useState(null);     // the promotion waiting for "Confirm and save"
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    fetchAll()
      .then((data) => {
        setPromotions(data.promotions);
        setProducts(data.products);
      })
      .catch((e) => {
        console.log(e.message);
        setLoadError(say("loadFailed"));
      });
  }, []);

  const refresh = async () => {
    const data = await fetchAll();
    setPromotions(data.promotions);
    setProducts(data.products);
  };

  /* ---------- Small message that fades out by itself ---------- */
  const showToast = (text) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, text, out: false }]);
    setTimeout(() => setToasts((t) => t.map((x) => (x.id === id ? { ...x, out: true } : x))), 2700);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000);
  };

  /* ---------- Create / Edit ---------- */
  const openForm = (promotion) => {
    setEditing(promotion);
    setFormError("");
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
    setFormError("");
    setReview(null);
  };

  const save = async (data) => {
    try {
      if (editing) await promotionApi.updatePromotion(editing.id, data);
      else await promotionApi.createPromotion(data);
    } catch (e) {
      setReview(null);          // back to the form, showing what the backend said
      setFormError(e.message);
      return;
    }
    closeForm();
    await refresh().catch((e) => console.log(e.message));
    showToast(say("saved"));
  };

  /* ---------- Disable / Enable ---------- */
  const toggle = async (p) => {
    try {
      await promotionApi.setDisabled(p.id, !p.disabled);
      await refresh();
      showToast(say(p.disabled ? "enabled" : "disabled"));
    } catch (e) {
      showToast(e.message);
    }
  };

  const list = promotions;   // search and filters are added with 4.2.3

  const listProps = { products, onEdit: openForm, onToggle: toggle };

  return (
    <div className="promo-page">
      <PromotionHeaderContainer onCreate={() => openForm(null)} />
      {loadError && <p className="error">{loadError}</p>}

      <div id="lists">
        <PromotionListContainer title="Product discounts" what="whatDiscounts" data={list.filter((p) => !p.code)} {...listProps} />
        <PromotionListContainer title="Voucher codes" what="whatVouchers" data={list.filter((p) => p.code)} {...listProps} />
      </div>

      {formOpen && (
        <PromotionFormContainer
          editing={editing}
          products={products}
          promotions={promotions}
          error={formError}
          onError={setFormError}
          onReview={setReview}
          onClose={closeForm}
        />
      )}
      {review && (
        <PromotionReviewModal
          data={review}
          products={products}
          promotions={promotions}
          editingId={editing ? editing.id : null}
          onBack={() => setReview(null)}
          onConfirm={save}
        />
      )}

      <PromotionToasts toasts={toasts} />
    </div>
  );
};

export default Promotions;
