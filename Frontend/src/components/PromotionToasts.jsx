// Small messages such as "Promotion saved"
const PromotionToasts = ({ toasts }) => {
  return (
    <div className="toasts" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={t.out ? "toast out" : "toast"}>{t.text}</div>
      ))}
    </div>
  );
};

export default PromotionToasts;
