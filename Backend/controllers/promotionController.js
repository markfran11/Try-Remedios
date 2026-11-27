import * as promotionService from "../services/promotionService.js";

// Sends the right error: ValidationError messages are shown to the user, anything else is hidden
const sendError = (res, e) => {
  console.log(e);
  res.status(e.statusCode || 500).json({
    error: e.statusCode ? e.message : "Internal Server Error",
  });
};

export const fetchAllPromotions = async (req, res) => {
  try {
    const promotions = await promotionService.fetchAllPromotions();
    res.status(200).json(promotions);
  } catch (e) {
    sendError(res, e);
  }
};

// products for the "Apply To" picker
export const fetchAllProducts = async (req, res) => {
  try {
    const products = await promotionService.fetchAllProducts();
    res.status(200).json(products);
  } catch (e) {
    sendError(res, e);
  }
};

// Insert
export const createPromotion = async (req, res) => {
  try {
    const promotionId = await promotionService.createPromotion(req.body);
    res.status(200).json({
      success: true,
      message: promotionId,
    });
  } catch (e) {
    sendError(res, e);
  }
};

// Update
export const editPromotion = async (req, res) => {
  const { id } = req.params;
  const promotion = { ...req.body, id: parseInt(id) };

  try {
    const updatedPromotion = await promotionService.updatePromotion(promotion);
    res.status(200).json({
      success: true,
      message: updatedPromotion,
    });
  } catch (e) {
    sendError(res, e);
  }
};

// Enable / Disable
export const changeStatus = async (req, res) => {
  const { id } = req.params;
  const { disabled } = req.body;

  try {
    const result = await promotionService.setPromotionDisabled(
      parseInt(id),
      disabled,
    );
    res.status(200).json({
      success: true,
      message: result,
    });
  } catch (e) {
    sendError(res, e);
  }
};

// Delete
export const deletePromotion = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedPromotion = await promotionService.deletePromotion(
      parseInt(id),
    );
    res.status(200).json({
      success: true,
      message: deletedPromotion,
    });
  } catch (e) {
    sendError(res, e);
  }
};

// Price after promotion (for the Orders / Shop pages)
export const getPromoPrice = async (req, res) => {
  const { productId, qty, code } = req.body;

  try {
    const result = await promotionService.getPromoPrice(productId, qty, code);
    res.status(200).json(result);
  } catch (e) {
    sendError(res, e);
  }
};

// Count one use of a promotion (when an order is confirmed)
export const usePromotion = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await promotionService.usePromotion(parseInt(id));
    res.status(200).json({
      success: true,
      message: result,
    });
  } catch (e) {
    sendError(res, e);
  }
};

// Check a typed voucher code
export const checkVoucher = async (req, res) => {
  const { code } = req.params;

  try {
    const result = await promotionService.checkVoucher(code);
    res.status(200).json(result);
  } catch (e) {
    sendError(res, e);
  }
};
