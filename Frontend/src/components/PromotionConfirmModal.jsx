import PromotionModal from "./PromotionModal";

// Delete / disable / discard confirmation (danger = red button)
const PromotionConfirmModal = ({ title, text, okLabel, cancelLabel = "Cancel", danger, onOk, onCancel }) => {
  return (
    <PromotionModal small role="alertdialog" labelledBy="confirmTitle" describedBy="confirmText" onClose={onCancel}>
      <h2 id="confirmTitle">{title}</h2>
      <p className="confirm-text" id="confirmText">{text}</p>
      <div className="actions">
        <button type="button" className="btn" autoFocus onClick={onCancel}>{cancelLabel}</button>
        <button type="button" className={"btn " + (danger ? "solid-danger" : "primary")} onClick={onOk}>{okLabel}</button>
      </div>
    </PromotionModal>
  );
};

export default PromotionConfirmModal;
