import { useState } from "react";
import ProductImage from "./ProductImage";
import { CATEGORIES } from "../constants/categories";
import { resizeImage } from "../utils/resizeImage";

// Add / edit form shown inside a Modal.
// product: the product being edited, or nothing when adding
// onSave(payload): returns an error message, or nothing when it worked
const ProductForm = ({ product, onSave, onCancel, onDelete }) => {
    const editing = Boolean(product);
    const [form, setForm] = useState({
        name: product?.name ?? "",
        category: product?.category ?? CATEGORIES[0],
        description: product?.description ?? "",
        price: product?.price ?? "",
        stock: "",
        reorder_level: product?.reorder_level ?? "10",
    });
    // undefined = picture unchanged, "" = picture removed, text = a new picture
    const [image, setImage] = useState(undefined);
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    const categories = CATEGORIES.includes(form.category) ? CATEGORIES : [...CATEGORIES, form.category];
    const preview = image === undefined ? (product ? product.image : "") : image;

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    }

    const handleImage = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            setImage(await resizeImage(file));
            setError("");
        } catch (err) {
            setError(err.message);
        }
        e.target.value = "";
    }

    const handleSubmit = async (e) => {
        e.preventDefault();

        const payload = { ...form };
        if (editing) delete payload.stock;      // stock only changes through Stock Movement
        if (image !== undefined) payload.image = image;

        setSaving(true);
        const problem = await onSave(payload);
        setSaving(false);
        if (problem) setError(problem);
    }

    return (
        <>
        <form className="product-form" onSubmit={handleSubmit}>
            <div className="image-picker">
                <ProductImage product={{ image: preview, name: form.name }} size="large" />
                <input id="image" className="sr-only" type="file" accept="image/png,image/jpeg,image/webp" onChange={handleImage} />
                <label htmlFor="image" className="file-button">{preview ? "Change image" : "Choose image"}</label>
                {preview && <button type="button" className="secondary" onClick={() => setImage("")}>Remove image</button>}
            </div>

            <div className="product-form-fields">
                <div className="input-field">
                    <label htmlFor="name">Product Name</label>
                    <input id="name" name="name" value={form.name} onChange={handleChange} required />
                </div>
                <div className="input-field">
                    <label htmlFor="category">Category</label>
                    <select id="category" name="category" value={form.category} onChange={handleChange}>
                        {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <div className="input-field wide">
                    <label htmlFor="description">Description</label>
                    <textarea id="description" name="description" rows="2" maxLength="255" value={form.description} onChange={handleChange} placeholder="Short description (optional)"></textarea>
                </div>
                <div className="input-field">
                    <label htmlFor="price">Price (₱)</label>
                    <input id="price" name="price" type="number" min="0.01" step="0.01" value={form.price} onChange={handleChange} required />
                </div>
                {!editing && (
                    <div className="input-field">
                        <label htmlFor="stock">Starting Stock</label>
                        <input id="stock" name="stock" type="number" min="0" step="1" value={form.stock} onChange={handleChange} required />
                    </div>
                )}
                <div className="input-field">
                    <label htmlFor="reorder_level">Low-Stock Level</label>
                    <input id="reorder_level" name="reorder_level" type="number" min="0" step="1" value={form.reorder_level} onChange={handleChange} required />
                </div>
            </div>

            {error && <p className="notice error form-error" role="alert"><span>{error}</span></p>}

            <div className="form-footer">
                <button type="submit" disabled={saving}>{editing ? "Save Changes" : "Add Product"}</button>
                <button type="button" className="secondary" onClick={onCancel}>Cancel</button>
                {editing && <button type="button" className="danger-solid push" onClick={() => onDelete(product)}>Delete</button>}
            </div>
        </form>
        </>
    )
}

export default ProductForm;