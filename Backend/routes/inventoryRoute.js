import * as inventoryController from '../controllers/inventoryController.js';
import express from "express";

const inventoryRoute = express.Router();

// specific routes must come before the /:id wildcard
inventoryRoute.get('/summary', inventoryController.getSummary);
inventoryRoute.get('/low-stock', inventoryController.getLowStock);
inventoryRoute.get('/', inventoryController.fetchAllProducts);
inventoryRoute.post('/', inventoryController.createProduct);
inventoryRoute.put('/:id', inventoryController.editProduct);
inventoryRoute.delete('/:id', inventoryController.deleteProduct);

export default inventoryRoute;