const MAX_SHOWN = 5;

// products: the list from GET /inventory/low-stock
const LowStockAlert = ({ products }) => {
    if (!products || products.length === 0) return null;

    const shown = products.slice(0, MAX_SHOWN);
    const hidden = products.length - shown.length;

    return (
        <>
        <section id="lowStockAlert" role="alert">
            <strong>
                {products.length} {products.length === 1 ? "product needs" : "products need"} restocking
            </strong>
            <ul>
                {shown.map((product) => (
                    <li key={product.id}>
                        {product.name}:{" "}
                        {product.stock === 0
                            ? "out of stock"
                            : `${product.stock} left (low at ${product.reorder_level})`}
                    </li>
                ))}
            </ul>
            {hidden > 0 && <small>and {hidden} more</small>}
        </section>
        </>
    )
}

export default LowStockAlert;