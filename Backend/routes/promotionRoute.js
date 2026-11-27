import * as promotionController from '../controllers/promotionController.js';
import express from "express";

const promotionRoute = express.Router();

promotionRoute.post('/', promotionController.createPromotion);

export default promotionRoute;
