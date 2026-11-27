import { useState } from "react";

// fields: [{ name, label, type, min, step, placeholder, required, options }]
// type "select" uses options: [{ value, label }]
const FormContainer = ({ title, fields, initialValues, submitLabel = "Save", onSave, onCancel }) => {
    const [form, setForm] = useState(initialValues);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        const saved = await onSave(form);
        if (saved) {
            setForm(initialValues);
        }
    }

    return (
        <>
        <section id="formContainer">
        <form onSubmit={handleSubmit}>
            {title && <h2>{title}</h2>}
            {fields.map((field) => (
                <div className="input-field" key={field.name}>
                    <label htmlFor={field.name}>{field.label}</label>
                    {field.type === "select" ? (
                        <select name={field.name} id={field.name} value={form[field.name]} onChange={handleChange} required>
                            <option value="">Select...</option>
                            {field.options.map((option) => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                        </select>
                    ) : (
                        <input
                            type={field.type || "text"}
                            name={field.name}
                            id={field.name}
                            min={field.min}
                            step={field.step}
                            placeholder={field.placeholder}
                            value={form[field.name]}
                            onChange={handleChange}
                            required={field.required !== false}
                        ></input>
                    )}
                </div>
            ))}
            <div>
                <button type="submit">{submitLabel}</button>
                {onCancel && <button type="button" onClick={onCancel}>Cancel</button>}
            </div>
        </form>
    </section>
        </>
    )
}

export default FormContainer;