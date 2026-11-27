import express from 'express';
import * as saleController from '../controllers/saleController.js';

const saleRoute = express.Router();

// Customer orders
saleRoute.get('/orders',            saleController.fetchAllOrders);
saleRoute.get('/orders/:id',        saleController.fetchOrder);
saleRoute.post('/orders',           saleController.createOrder);
saleRoute.put('/orders/:id/status', saleController.updateOrderStatus);

// Direct POS sales 
saleRoute.get('/sales',             saleController.fetchAllSales);
saleRoute.get('/sales/:id',         saleController.fetchSale);
saleRoute.post('/sales',            saleController.createSale);

export default saleRoute;
