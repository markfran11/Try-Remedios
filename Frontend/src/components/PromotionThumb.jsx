import { useState } from "react";

// Product photo, falling back to the first letter if it is missing or fails to load
const PromotionThumb = ({ product }) => {
  const [failed, setFailed] = useState(false);
  if (!product.image || failed) return <>{product.name[0]}</>;
  return <img src={product.image} alt="" onError={() => setFailed(true)} />;
};

export default PromotionThumb;
