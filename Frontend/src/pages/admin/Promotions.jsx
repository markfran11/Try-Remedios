import "../../promotions.css";
import { useEffect, useState } from "react";
import { say } from "../../utils/promotionMessages";
import * as promotionApi from "../../api/promotionApi";
import PromotionHeaderContainer from "../../components/PromotionHeaderContainer";
import PromotionFormContainer from "../../components/PromotionFormContainer";
import PromotionReviewModal from "../../components/PromotionReviewModal";
import PromotionToasts from "../../components/PromotionToasts";

const Promotions = () => {
  const [products, setProducts] = useState([]);   // for the "Apply To" picker
  const [promotions] = useState([]);   // the list of promotions is added with 4.2.1

  // popups
  const [formOpen, setFormOpen] = useState(false);
  const [formError, setFormError] = useState("");
  const [review, setReview] = useState(null);     // the promotion waiting for "Confirm and save"
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    promotionApi
      .getProducts()
      .then(setProducts)
      .catch((e) => console.log(e.message));
  }, []);

  /* ---------- Small message that fades out by itself ---------- */
  const showToast = (text) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, text, out: false }]);
    setTimeout(() => setToasts((t) => t.map((x) => (x.id === id ? { ...x, out: true } : x))), 2700);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000);
  };

  /* ---------- Create / Edit ---------- */
  const openForm = () => {
    setFormError("");
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setFormError("");
    setReview(null);
  };

  const save = async (data) => {
    try {
      await promotionApi.createPromotion(data);
    } catch (e) {
      setReview(null);          // back to the form, showing what the backend said
      setFormError(e.message);
      return;
    }
    closeForm();
    showToast(say("saved"));
  };

  return (
    <div className="promo-page">
      <PromotionHeaderContainer onCreate={() => openForm()} />

      {formOpen && (
        <PromotionFormContainer
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
          editingId={null}
          onBack={() => setReview(null)}
          onConfirm={save}
        />
      )}

      <PromotionToasts toasts={toasts} />
    </div>
  );
};

export default Promotions;
