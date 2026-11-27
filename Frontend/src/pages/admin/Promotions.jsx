import "../../promotions.css";
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { say } from "../../utils/promotionMessages";
import { formatId } from "../../utils/promotionRules";
import * as promotionApi from "../../api/promotionApi";
import PromotionHeaderContainer from "../../components/PromotionHeaderContainer";
import PromotionFilterContainer from "../../components/PromotionFilterContainer";
import PromotionListContainer from "../../components/PromotionListContainer";
import PromotionFormContainer from "../../components/PromotionFormContainer";
import PromotionReviewModal from "../../components/PromotionReviewModal";
import PromotionConfirmModal from "../../components/PromotionConfirmModal";
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
  const { auth } = useAuth();
  const ownerId = auth?.user?.id ?? 1;   // same as the leader's Inventory page
  const [promotions, setPromotions] = useState([]);
  const [products, setProducts] = useState([]);
  const [loadError, setLoadError] = useState("");

  // search and filters
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterType, setFilterType] = useState("");

  // popups
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);   // null = creating a new promotion
  const [formError, setFormError] = useState("");
  const [review, setReview] = useState(null);     // the promotion waiting for "Confirm and save"
  const [confirm, setConfirm] = useState(null);   // { title, text, okLabel, danger, onOk }
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
      else await promotionApi.createPromotion({ ...data, ownerId });
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

  /* ---------- Delete ---------- */
  const askDelete = (p) => {
    // a used promotion that is still live (Active or Scheduled) must be disabled first
    if (p.used > 0 && p.status !== "Disabled" && p.status !== "Expired") {
      setConfirm({
        title: say("usedTitle"),
        text: say("usedText", { name: p.name, n: p.used }),
        okLabel: say("usedOk"),
        danger: false,
        onOk: () => { setConfirm(null); toggle(p); },
      });
      return;
    }
    setConfirm({
      title: say("delTitle"),
      text: say(p.used > 0 ? "delUsedText" : "delText", { name: p.name, n: p.used }),
      okLabel: say("delOk"),
      danger: true,
      onOk: async () => {
        setConfirm(null);
        try {
          await promotionApi.deletePromotion(p.id);
          await refresh();
          showToast(say("deleted"));
        } catch (e) {
          showToast(e.message);
        }
      },
    });
  };

  /* ---------- Search and filters ---------- */
  const q = search.trim().toLowerCase();
  const list = promotions.filter(
    (p) =>
      (!q || (formatId(p.id) + " " + p.name + " " + (p.code || "")).toLowerCase().includes(q)) &&
      (!filterStatus || p.status === filterStatus) &&
      (!filterType || p.type === filterType),
  );
  const filtering = Boolean(q || filterStatus || filterType);   // true while the owner is searching or filtering

  const listProps = { products, filtering, onEdit: openForm, onToggle: toggle, onDelete: askDelete };

  return (
    <div className="promo-page">
      <PromotionHeaderContainer onCreate={() => openForm(null)} />
      <PromotionFilterContainer
        search={search} onSearch={setSearch}
        status={filterStatus} onStatus={setFilterStatus}
        type={filterType} onType={setFilterType}
      />
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
      {confirm && <PromotionConfirmModal {...confirm} onCancel={() => setConfirm(null)} />}

      <PromotionToasts toasts={toasts} />
    </div>
  );
};

export default Promotions;
