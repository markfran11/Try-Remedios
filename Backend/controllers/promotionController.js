import * as promotionService from "../services/promotionService.js";

// Sends the right error: ValidationError messages are shown to the user, anything else is hidden
const sendError = (res, e) => {
  console.log(e);
  res.status(e.statusCode || 500).json({
    error: e.statusCode ? e.message : "Internal Server Error",
  });
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
