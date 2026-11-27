import * as saleModel      from '../models/saleModel.js';
import * as inventoryModel from '../models/inventoryModel.js';
import ValidationError      from '../utils/ValidationError.js';

const ORDER_TRANSITIONS = {
    Pending:   ['Confirmed', 'Completed', 'Cancelled'],
    Confirmed: ['Completed', 'Cancelled'],
    Completed: ['Cancelled'],
    Cancelled: [],
};

const buildItems = async (rawItems) => {
    if (!Array.isArray(rawItems) || rawItems.length === 0) {
        throw new ValidationError('Add at least one product!', 400);
    }

    const quantities = new Map();
    for (const item of rawItems) {
        const pid = Number(item.productId);
        const qty = Number(item.quantity);
        if (!pid)                               throw new ValidationError('Select a product for every row!', 400);
        if (!Number.isInteger(qty) || qty < 1) throw new ValidationError('Quantity must be 1 or more!', 400);
        quantities.set(pid, (quantities.get(pid) || 0) + qty);
    }

    const items = [];
    let totalCents = 0;
    for (const pid of [...quantities.keys()].sort((a, b) => a - b)) {
        const product = await inventoryModel.findProductById(pid);
        if (product.length === 0) throw new ValidationError('Product does not exist!', 404);

        const qty = quantities.get(pid);

        // Prevent transactions from exceeding available stock
        if (product[0].stock_quantity < qty) {
            throw new ValidationError(
                `Insufficient stock for "${product[0].product_name}". Available: ${product[0].stock_quantity}, requested: ${qty}.`,
                400
            );
        }

        const unitPrice = Number(product[0].price);
        items.push({ productId: pid, quantity: qty, unitPrice, discountAmount: 0 });
        totalCents += Math.round(unitPrice * 100) * qty;
    }

    return { items, totalAmount: totalCents / 100 };
};

//Customer Orders 

export const fetchAllOrders = async () => saleModel.fetchOrders();

export const fetchOrderById = async (id) => {
    const order = await saleModel.findOrderById(id);
    if (order.length === 0) throw new ValidationError('Order does not exist!', 404);
    const items = await saleModel.fetchOrderItems(id);
    return { ...order[0], items };
};

export const createOrder = async (data) => {
    if (!data.accountId) throw new ValidationError('Account ID is required!', 400);

    const paymentMethod = ['cash', 'gcash'].includes(data.paymentMethod) ? data.paymentMethod : 'cash';
    const orderStatus   = data.orderStatus || 'Pending';

    const { items, totalAmount } = await buildItems(data.items);

    const orderId = await saleModel.insertOrder(
        { accountId: data.accountId, orderStatus, paymentMethod, totalAmount },
        items
    );
    return { orderId, orderStatus };
};

export const updateOrderStatus = async (id, newStatus) => {
    const found = await saleModel.findOrderById(id);
    if (found.length === 0) throw new ValidationError('Order does not exist!', 404);

    const current = found[0].order_status;

    if (!(ORDER_TRANSITIONS[current] ?? []).includes(newStatus)) {
        throw new ValidationError(
            `An order that is ${current} cannot be changed to ${newStatus}!`, 400
        );
    }

    await saleModel.updateOrderStatus(id, current, newStatus);
    return newStatus;
};

// Direct Sales (POS)

export const fetchAllSales = async () => saleModel.fetchSales();

export const fetchSaleById = async (id) => {
    const sale = await saleModel.findSaleById(id);
    if (sale.length === 0) throw new ValidationError('Sale does not exist!', 404);
    const items = await saleModel.fetchSaleItems(id);
    return { ...sale[0], items };
};

export const createSale = async (data) => {
    const customerName = String(data.customerName ?? '').trim() || 'Walk-in Customer';
    if (!data.ownerId)  throw new ValidationError('Owner ID is required!', 400);

    const paymentMethod = ['cash', 'gcash'].includes(data.paymentMethod) ? data.paymentMethod : 'cash';

    // buildItems checks stock — throws before we write anything if stock is insufficient
    const { items, totalAmount } = await buildItems(data.items);

    const saleId = await saleModel.insertSale(
        { customerName, ownerId: data.ownerId, saleType: 'direct', totalAmount, paymentMethod },
        items
    );
    return { saleId };
};
