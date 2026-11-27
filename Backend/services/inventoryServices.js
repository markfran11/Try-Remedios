
import * as inventoryModel from '../models/inventoryModel.js';
import ValidationError from '../utils/ValidationError.js';

// Clean and validate incoming product fields
const cleanProduct = (product) => {
    const product_name = String(product.product_name ?? product.name ?? '').trim();
    const category = String(product.category ?? '').trim();
    const description = String(product.description ?? '').trim() || null;

    if (!product_name || !category) {
        throw new ValidationError('Product name and category are required!', 400);
    }

    if (product.price === undefined || product.price === null || product.price === '') {
        throw new ValidationError('Price is required!', 400);
    }

    const price = Number(product.price);
    const stock_quantity = Number(product.stock_quantity ?? product.stock ?? 0);
    const reorder_level = Number(product.reorder_level ?? 10);

    if (isNaN(price) || price < 0) {
        throw new ValidationError('Price must be 0 or more!', 400);
    }

    if (!Number.isInteger(stock_quantity) || stock_quantity < 0) {
        throw new ValidationError('Stock must be a whole number, 0 or more!', 400);
    }

    if (!Number.isInteger(reorder_level) || reorder_level < 0) {
        throw new ValidationError('Low-stock level must be a whole number, 0 or more!', 400);
    }

    const image = product.image !== undefined ? (product.image || null) : undefined;

    return {
        ...product,
        product_name,
        category,
        description,
        price,
        stock_quantity,
        reorder_level,
        image
    };
};

export const fetchAllProducts = async () => {
    return await inventoryModel.fetch();
};

export const createProduct = async (data) => {
    const product = cleanProduct(data);

    const dup = await inventoryModel.findProductByNameAndCategory(
        product.product_name,
        product.category
    );

    if (dup.length > 0) {
        throw new ValidationError('A product with this name and category already exists!', 400);
    }

    return await inventoryModel.insert(product);
};

export const updateProduct = async (data) => {
    const product = cleanProduct(data);
    const id = product.product_id ?? product.id;

    const existing = await inventoryModel.findProductById(id);

    if (existing.length === 0) {
        throw new ValidationError('Product does not exist!', 404);
    }

    const dup = await inventoryModel.findProductByNameAndCategory(
        product.product_name,
        product.category
    );

    if (dup.some((p) => p.product_id !== id)) {
        throw new ValidationError('Another product with this name and category already exists!', 400);
    }

    return await inventoryModel.update({ ...product, product_id: id });
};

export const deleteProduct = async (id) => {
    const existing = await inventoryModel.findProductById(id);

    if (existing.length === 0) {
        throw new ValidationError('Product does not exist!', 404);
    }

    return await inventoryModel.remove(id);
};

export const fetchSummary = async () => await inventoryModel.summary();
export const fetchLowStock = async () => await inventoryModel.fetchLowStock();
