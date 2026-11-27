import * as promotionController from '../controllers/promotionController.js';
import express from "express";

const promotionRoute = express.Router();

promotionRoute.get('/', promotionController.fetchAllPromotions);
promotionRoute.get('/products', promotionController.fetchAllProducts);
promotionRoute.get('/voucher/:code', promotionController.checkVoucher);
promotionRoute.post('/', promotionController.createPromotion);
promotionRoute.post('/price', promotionController.getPromoPrice);
promotionRoute.post('/:id/use', promotionController.usePromotion);
promotionRoute.put('/:id', promotionController.editPromotion);
promotionRoute.patch('/:id/status', promotionController.changeStatus);
promotionRoute.delete('/:id', promotionController.deletePromotion);

export default promotionRoute;
