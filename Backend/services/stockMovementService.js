import * as stockMovementModel from '../models/stockMovementModel.js';
import * as inventoryModel     from '../models/inventoryModel.js';
import ValidationError          from '../utils/ValidationError.js';

const VALID_TYPES = ['stock_in', 'adjustment_increase', 'adjustment_decrease'];

export const fetchAllStockMovements = async () => {
    return await stockMovementModel.fetch();
};

export const createStockMovement = async (data) => {
    const productId = Number(data.productId);
    const quantity  = Number(data.quantity);
    const type      = String(data.type   ?? '').trim();
    const reason    = String(data.reason ?? '').trim() || null;

    if (!productId) {
        throw new ValidationError('Product is required!', 400);
    }
    if (!data.quantity) {
        throw new ValidationError('Quantity is required!', 400);
    }
    if (!Number.isInteger(quantity) || quantity < 1) {
        throw new ValidationError('Quantity must be a whole number, 1 or more!', 400);
    }
    if (!VALID_TYPES.includes(type)) {
        throw new ValidationError('Invalid movement type!', 400);
    }
    // Adjustments always require a reason for audit purposes
    if (type.startsWith('adjustment') && !reason) {
        throw new ValidationError('Reason is required for adjustments!', 400);
    }

    const product = await inventoryModel.findProductById(productId);
    if (product.length === 0) {
        throw new ValidationError('Product does not exist!', 404);
    }

    return await stockMovementModel.insert(productId, quantity, type, reason);
};
