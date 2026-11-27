import * as inventoryService from '../services/inventoryServices.js';

export const fetchAllProducts = async (req, res) => {
    try {
        const products = await inventoryService.fetchAllProducts();
        res.status(200).json(products);
    } catch (e) {
        console.log(e);
        res.status(e.statusCode || 500).json({
            error: `${e.message || 'Internal Server Error'}`
        });
    }
};

export const createProduct = async (req, res) => {
    const data = req.body;

    try {
        const productId = await inventoryService.createProduct(data);
        res.status(200).json({
            success: true,
            message: productId
        });
    } catch (e) {
        console.log(e);
        res.status(e.statusCode || 500).json({
            error: `${e.message || 'Internal Server Error'}`
        });
    }
};

export const editProduct = async (req, res) => {
    const data = { ...req.body, product_id: parseInt(req.params.id) };

    try {
        const result = await inventoryService.updateProduct(data);
        res.status(200).json({
            success: true,
            message: result
        });
    } catch (e) {
        console.log(e);
        res.status(e.statusCode || 500).json({
            error: `${e.message || 'Internal Server Error'}`
        });
    }
};

export const deleteProduct = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await inventoryService.deleteProduct(parseInt(id));
        res.status(200).json({
            success: true,
            message: result
        });
    } catch (e) {
        console.log(e);
        res.status(e.statusCode || 500).json({
            error: `${e.message || 'Internal Server Error'}`
        });
    }
};

export const getSummary = async (req, res) => {
    try {
        const data = await inventoryService.fetchSummary();
        res.status(200).json(data);
    } catch (e) {
        console.log(e);
        res.status(e.statusCode || 500).json({
            error: `${e.message || 'Internal Server Error'}`
        });
    }
};

export const getLowStock = async (req, res) => {
    try {
        const data = await inventoryService.fetchLowStock();
        res.status(200).json(data);
    } catch (e) {
        console.log(e);
        res.status(e.statusCode || 500).json({
            error: `${e.message || 'Internal Server Error'}`
        });
    }
};
