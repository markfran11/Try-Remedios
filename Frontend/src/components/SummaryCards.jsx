const SummaryCards = ({ summary }) => {
    if (!summary) return null;

    return (
        <>
        <section id="summaryCards">
            <div className="summary-card">
                <strong>{summary.totalProducts}</strong>
                <span>Products</span>
            </div>
            <div className="summary-card">
                <strong>{summary.totalUnits}</strong>
                <span>Units on hand</span>
            </div>
            <div className="summary-card low">
                <strong>{summary.lowStock}</strong>
                <span>Low stock</span>
            </div>
            <div className="summary-card out">
                <strong>{summary.outOfStock}</strong>
                <span>Out of stock</span>
            </div>
        </section>
        </>
    )
}

export default SummaryCards;