import "../../promotions.css";
import { useEffect, useState } from "react";
import { say } from "../../utils/promotionMessages";
import * as promotionApi from "../../api/promotionApi";
import PromotionHeaderContainer from "../../components/PromotionHeaderContainer";
import PromotionFilterContainer from "../../components/PromotionFilterContainer";
import PromotionListContainer from "../../components/PromotionListContainer";
import PromotionFormContainer from "../../components/PromotionFormContainer";
import PromotionReviewModal from "../../components/PromotionReviewModal";
import PromotionConfirmModal from "../../components/PromotionConfirmModal";
import PromotionToasts from "../../components/PromotionToasts";

// gets the promotions (already searched and filtered by the backend) and the products for the "Apply To" picker
const fetchAll = async (filters) => {
  const [promotions, products] = await Promise.all([
    promotionApi.getPromotions(filters),
    promotionApi.getProducts(),
  ]);
  return { promotions, products };
};

const Promotions = () => {
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

  const filters = { search: search.trim(), status: filterStatus, type: filterType };

  // loads again whenever the search or a filter changes (short wait while typing)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAll({ search: search.trim(), status: filterStatus, type: filterType })
        .then((data) => {
          setPromotions(data.promotions);
          setProducts(data.products);
          setLoadError("");
        })
        .catch((e) => {
          console.log(e.message);
          setLoadError(say("loadFailed"));
        });
    }, 250);
    return () => clearTimeout(timer);
  }, [search, filterStatus, filterType]);

  const refresh = async () => {
    const data = await fetchAll(filters);
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
  const list = promotions;   // the backend already applied the search and filters
  const filtering = Boolean(filters.search || filterStatus || filterType);   // true while the owner is searching or filtering

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
