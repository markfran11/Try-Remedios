const PromotionHeaderContainer = ({ onCreate }) => {
  return (
    <header className="top">
      <h1>Promotions Management</h1>
      <button className="btn primary" onClick={onCreate}>+ Create Promotion</button>
    </header>
  );
};

export default PromotionHeaderContainer;
