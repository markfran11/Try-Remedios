// Shows the product image if present, otherwise a coloured initial placeholder.
const ProductImage = ({ product, size = "small" }) => {
  if (product?.image) {
    return (
      <img
        src={product.image}
        alt={product.name}
        className={`product-img ${size}`}
      />
    );
  }
  const initial = (product?.name ?? "?")[0].toUpperCase();
  return <span className={`product-img ${size}`}>{initial}</span>;
};

export default ProductImage;
