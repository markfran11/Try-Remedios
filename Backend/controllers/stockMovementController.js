import * as stockMovementService from '../services/stockMovementService.js';

export const fetchAllStockMovements = async (req, res) => {
    try {
        const movements = await stockMovementService.fetchAllStockMovements();
        res.status(200).json(movements);
    } catch (e) {
        console.log(e);
        res.status(e.statusCode || 500).json({
            error: `${e.message || 'Internal Server Error'}`
        });
    }
};

export const createStockMovement = async (req, res) => {
    const { productId, type, quantity, reason } = req.body;
    const data = { productId, type, quantity, reason };

    try {
        const movementId = await stockMovementService.createStockMovement(data);
        res.status(200).json({
            success: true,
            message: movementId
        });
    } catch (e) {
        console.log(e);
        res.status(e.statusCode || 500).json({
            error: `${e.message || 'Internal Server Error'}`
        });
    }
};
