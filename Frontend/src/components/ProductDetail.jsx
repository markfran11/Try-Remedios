import ProductImage from "./ProductImage";
import StatusBadge from "./StatusBadge";
import { fmtPrice } from "../constants/format";

const ProductDetail = ({ product, onEdit, onDelete, onClose }) => (
  <div className="product-detail">
    <ProductImage product={product} size="large" />
    <div>
      <dl className="meta">
        <dt>Category</dt>  <dd>{product.category}</dd>
        <dt>Price</dt>     <dd>{fmtPrice(product.price)}</dd>
        <dt>Stock</dt>     <dd>{product.stock}</dd>
        <dt>Status</dt>    <dd><StatusBadge stock={product.stock} reorderLevel={product.reorder_level} /></dd>
        {product.description && <><dt>Description</dt><dd>{product.description}</dd></>}
      </dl>
      <div className="form-footer">
        <button onClick={onEdit}>Edit</button>
        <button className="secondary" onClick={onClose}>Close</button>
        <button className="danger-solid push" onClick={() => onDelete(product)}>Delete</button>
      </div>
    </div>
  </div>
);

export default ProductDetail;
