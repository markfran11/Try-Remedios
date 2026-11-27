import * as saleService from '../services/saleServices.js';

export const fetchAllOrders = async (req, res) => {
    try {
        const orders = await saleService.fetchAllOrders();
        res.status(200).json(orders);
    } catch (e) {
        console.log(e);
        res.status(e.statusCode || 500).json({
            error: `${e.message || 'Internal Server Error'}`
        });
    }
};

export const fetchOrder = async (req, res) => {
    const { id } = req.params;
    try {
        const order = await saleService.fetchOrderById(parseInt(id));
        res.status(200).json(order);
    } catch (e) {
        console.log(e);
        res.status(e.statusCode || 500).json({
            error: `${e.message || 'Internal Server Error'}`
        });
    }
};

export const createOrder = async (req, res) => {
    const data = req.body;
    try {
        const result = await saleService.createOrder(data);
        res.status(200).json({ success: true, message: result });
    } catch (e) {
        console.log(e);
        res.status(e.statusCode || 500).json({
            error: `${e.message || 'Internal Server Error'}`
        });
    }
};

export const updateOrderStatus = async (req, res) => {
    const { id }     = req.params;
    const { status } = req.body;
    try {
        const newStatus = await saleService.updateOrderStatus(parseInt(id), status);
        res.status(200).json({ success: true, message: newStatus });
    } catch (e) {
        console.log(e);
        res.status(e.statusCode || 500).json({
            error: `${e.message || 'Internal Server Error'}`
        });
    }
};


export const fetchAllSales = async (req, res) => {
    try {
        const sales = await saleService.fetchAllSales();
        res.status(200).json(sales);
    } catch (e) {
        console.log(e);
        res.status(e.statusCode || 500).json({
            error: `${e.message || 'Internal Server Error'}`
        });
    }
};

export const fetchSale = async (req, res) => {
    const { id } = req.params;
    try {
        const sale = await saleService.fetchSaleById(parseInt(id));
        res.status(200).json(sale);
    } catch (e) {
        console.log(e);
        res.status(e.statusCode || 500).json({
            error: `${e.message || 'Internal Server Error'}`
        });
    }
};


export const createSale = async (req, res) => {
    const data = req.body;
    try {
        const result = await saleService.createSale(data);
        res.status(200).json({ success: true, message: result });
    } catch (e) {
        console.log(e);
        res.status(e.statusCode || 500).json({
            error: `${e.message || 'Internal Server Error'}`
        });
    }
};
