import * as stockMovementController from '../controllers/stockMovementController.js';
import express from "express";

const stockMovementRoute = express.Router();

stockMovementRoute.get('/',  stockMovementController.fetchAllStockMovements);
stockMovementRoute.post('/', stockMovementController.createStockMovement);

export default stockMovementRoute;
