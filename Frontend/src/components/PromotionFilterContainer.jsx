// Search and filters (the value of each option is used by the code; the visible text is free to edit)
const PromotionFilterContainer = ({ search, onSearch, status, onStatus, type, onType }) => {
  return (
    <div className="filters">
      <input
        type="search"
        placeholder="Search name, code or ID..."
        aria-label="Search promotions"
        value={search}
        onChange={(e) => onSearch(e.target.value)}
      />
      <select aria-label="Filter by status" value={status} onChange={(e) => onStatus(e.target.value)}>
        <option value="">All Statuses</option>
        <option value="Active">Active</option>
        <option value="Scheduled">Scheduled</option>
        <option value="Expired">Expired</option>
        <option value="Disabled">Disabled</option>
      </select>
      <select aria-label="Filter by discount type" value={type} onChange={(e) => onType(e.target.value)}>
        <option value="">All Discount Types</option>
        <option value="percent">Percentage</option>
        <option value="fixed">Fixed amount</option>
      </select>
    </div>
  );
};

export default PromotionFilterContainer;
