import "../../promotions.css";
import { useState } from "react";
import { say } from "../../utils/promotionMessages";
import * as promotionApi from "../../api/promotionApi";
import PromotionHeaderContainer from "../../components/PromotionHeaderContainer";
import PromotionFormContainer from "../../components/PromotionFormContainer";
import PromotionToasts from "../../components/PromotionToasts";

const Promotions = () => {

  // popups
  const [formOpen, setFormOpen] = useState(false);
  const [formError, setFormError] = useState("");
  const [toasts, setToasts] = useState([]);

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
  };

  const save = async (data) => {
    try {
      await promotionApi.createPromotion(data);
    } catch (e) {
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
          error={formError}
          onError={setFormError}
          onReview={save}
          onClose={closeForm}
        />
      )}

      <PromotionToasts toasts={toasts} />
    </div>
  );
};

export default Promotions;
