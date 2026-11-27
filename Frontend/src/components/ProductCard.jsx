// Reusable product card for the customer shop/home pages.
import { fmtPrice } from "../constants/format";

const ProductCard = ({ product, onOrder }) => {
  const inStock = product.stock_quantity > 0;

  return (
    <div className={`product-card${!inStock ? " out-of-stock" : ""}`}>
      <div className="product-card-img">
        {product.image
          ? <img src={product.image} alt={product.product_name} />
          : <span className="product-card-initial">
              {(product.product_name ?? "?")[0].toUpperCase()}
            </span>
        }
      </div>
      <div className="product-card-body">
        <strong className="product-card-title">{product.product_name}</strong>
        <small className="muted">{product.category}</small>
        {product.description && (
          <p className="product-card-desc">{product.description}</p>
        )}
        <span className="product-card-price">{fmtPrice(product.price)}</span>
        <span className={`badge ${inStock ? "in" : "out"}`}>
          {inStock ? `${product.stock_quantity} in stock` : "Out of Stock"}
        </span>
      </div>
      {onOrder && (
        <button
          className="product-card-btn"
          onClick={() => onOrder(product)}
          disabled={!inStock}
        >
          {inStock ? "Order" : "Unavailable"}
        </button>
      )}
    </div>
  );
};

export default ProductCard;
