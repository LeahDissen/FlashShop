import { useState, useEffect, useMemo } from "react";
import { FaBoxOpen, FaEdit, FaPlus, FaSave, FaTimes, FaTrash, FaLink } from "react-icons/fa";
import { FiArrowLeft } from "react-icons/fi";
import { Link } from "react-router-dom";
import { addProduct, deleteProduct, getProducts, updateProduct } from "../api/products";
import BulkProductUpload from "./BulkProductUpload";
import SmartImageInput from "../components/SmartImageInput";
import { fetchCustomCategoriesPage, saveCategorySettings } from "../api/productCategoriesApi";
import {
    DISPLAY_TYPES,
    DISPLAY_TYPE_LABELS,
    applyCategoryPageData,
    buildCustomCategory,
    findCategoryByName,
    getAllCategories,
    getCategoryMeta,
    getCustomCategories,
    getDisplayTypeForCategory,
    getHiddenCategories,
    isCustomCategory,
    parseCustomCategoriesFromPage,
    parseHiddenCategoriesFromPage,
    sanitizeCustomCategories,
} from "../constants/productCategories";
import { getProductDirectLink } from "../utils/productDisplay";

const INITIAL_FORM_DATA = {
    name: "",
    description: "",
    price: "",
    category: "",
    displayType: "",
    stock: 100,
    image: "",
    printWidth: 12,
    printHeight: 18,
};

export default function ProductsManagement() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState(INITIAL_FORM_DATA);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);
    const [categoryListVersion, setCategoryListVersion] = useState(0);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [newCategoryDisplayType, setNewCategoryDisplayType] = useState(DISPLAY_TYPES.DESIGN);
    const [savingCategory, setSavingCategory] = useState(false);
    const [showAddCategory, setShowAddCategory] = useState(false);

    const allCategories = useMemo(() => getAllCategories(), [categoryListVersion]);
    const customCategories = useMemo(() => getCustomCategories(), [categoryListVersion]);
    const hiddenCategories = useMemo(() => getHiddenCategories(), [categoryListVersion]);

    const selectedCategoryMeta = useMemo(
        () => getCategoryMeta(formData.category),
        [formData.category, categoryListVersion],
    );
    const isDesignCategory = !formData.category || formData.displayType === DISPLAY_TYPES.DESIGN;

    useEffect(() => {
        loadProducts();
        loadCustomCategories();
    }, []);

    const persistCategorySettings = async (nextCustom, nextHidden) => {
        await saveCategorySettings({
            customCategories: nextCustom,
            hiddenCategories: nextHidden,
        });
        applyCategoryPageData({
            customCategories: JSON.stringify(nextCustom),
            hiddenCategories: JSON.stringify(nextHidden),
        });
        setCategoryListVersion((v) => v + 1);
    };

    const loadCustomCategories = async () => {
        try {
            const page = await fetchCustomCategoriesPage();
            const rawCustom = parseCustomCategoriesFromPage(page);
            const sanitized = sanitizeCustomCategories(rawCustom);
            applyCategoryPageData(page);
            if (sanitized.length !== rawCustom.length) {
                await persistCategorySettings(
                    sanitized,
                    parseHiddenCategoriesFromPage(page),
                );
            }
            setCategoryListVersion((v) => v + 1);
        } catch (err) {
            console.error(err);
        }
    };

    const handleAddCategory = async () => {
        const name = newCategoryName.trim();
        if (!name) {
            alert("יש להזין שם לקטגוריה");
            return;
        }
        const existing = findCategoryByName(name);
        if (existing) {
            alert(`הקטגוריה "${existing.label}" כבר קיימת ברשימה`);
            return;
        }

        const nextCustom = [...customCategories, buildCustomCategory(name, newCategoryDisplayType)];
        const nextHidden = hiddenCategories.filter((v) => v !== name);
        setSavingCategory(true);
        try {
            await persistCategorySettings(nextCustom, nextHidden);
            setFormData({
                ...formData,
                category: name,
                displayType: newCategoryDisplayType,
            });
            setNewCategoryName("");
            setNewCategoryDisplayType(DISPLAY_TYPES.DESIGN);
            setShowAddCategory(false);
        } catch (err) {
            console.error(err);
            alert("שגיאה בשמירת הקטגוריה");
        } finally {
            setSavingCategory(false);
        }
    };

    const handleDeleteCategory = async (categoryValue) => {
        if (!categoryValue) return;

        const inUse = products.some((p) => p.category === categoryValue);
        const msg = inUse
            ? `להסיר את הקטגוריה "${categoryValue}" מהרשימה? מוצרים קיימים יישארו משויכים אליה.`
            : `להסיר את הקטגוריה "${categoryValue}" מהרשימה?`;
        if (!confirm(msg)) return;

        const nextCustom = isCustomCategory(categoryValue)
            ? customCategories.filter((c) => c.value !== categoryValue)
            : customCategories;
        const nextHidden = isCustomCategory(categoryValue)
            ? hiddenCategories
            : [...hiddenCategories, categoryValue];

        setSavingCategory(true);
        try {
            await persistCategorySettings(nextCustom, nextHidden);
            if (formData.category === categoryValue) {
                setFormData({ ...formData, category: "", displayType: "" });
            }
        } catch (err) {
            console.error(err);
            alert("שגיאה במחיקת הקטגוריה");
        } finally {
            setSavingCategory(false);
        }
    };

    const loadProducts = async () => {
        try {
            const data = await getProducts();
            setProducts(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === "category") {
            setFormData({
                ...formData,
                category: value,
                displayType: value ? getDisplayTypeForCategory(value) : "",
            });
            return;
        }
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.category) {
            alert("יש לבחור קטגוריה");
            return;
        }

        const displayType = getDisplayTypeForCategory(formData.category);
        const payload = {
            ...formData,
            displayType,
            price: Number(formData.price),
            stock: Number(formData.stock),
            printWidth: isDesignCategory ? Number(formData.printWidth) || 12 : undefined,
            printHeight: isDesignCategory ? Number(formData.printHeight) || 18 : undefined,
        };

        try {
            if (isEditing) {
                await updateProduct(editId, payload);
                alert("מוצר עודכן בהצלחה!");
            } else {
                await addProduct(payload);
                alert("מוצר נוסף בהצלחה!");
            }
            resetForm();
            loadProducts();
        } catch (error) {
            console.error("Error saving product:", error);
            alert("שגיאה בשמירה");
        }
    };

    const handleEdit = (product) => {
        const displayType = product.displayType || getDisplayTypeForCategory(product.category);
        setFormData({
            name: product.name,
            description: product.description,
            price: product.price,
            category: product.category || "",
            displayType,
            stock: product.stock,
            image: product.image,
            printWidth: product.printWidth ?? 12,
            printHeight: product.printHeight ?? 18,
        });
        setEditId(product._id);
        setIsEditing(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id) => {
        if (confirm("למחוק את המוצר?")) {
            try {
                await deleteProduct(id);
                if (isEditing && editId === id) {
                    resetForm();
                }
                loadProducts();
            } catch (err) {
                alert("שגיאה במחיקה");
            }
        }
    };

    const handleCopyLink = async (productId) => {
        const link = getProductDirectLink(productId);
        try {
            await navigator.clipboard.writeText(link);
            alert("קישור ישיר הועתק!");
        } catch {
            prompt("העתק את הקישור:", link);
        }
    };

    const resetForm = () => {
        setFormData(INITIAL_FORM_DATA);
        setIsEditing(false);
        setEditId(null);
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6 font-sans">
            <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                        <FaBoxOpen className="text-[#f2665e]" />
                        ניהול מוצרים
                    </h1>
                    <p className="text-gray-500 mt-1">הוספה, עריכה ומחיקה של מוצרים בחנות</p>
                </div>
                <Link
                    to="/admindashboard"
                    className="text-[#f2665e] font-bold p-2 hover:bg-[#f2665e]/10 rounded-lg flex items-center gap-2"
                >
                    <span>חזרה ללוח הבקרה</span>
                    <FiArrowLeft className="text-xl" />
                </Link>
            </div>

            <div className="max-w-7xl mx-auto mb-8">
                <BulkProductUpload onComplete={loadProducts} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit sticky top-6">
                    <h2 className={`text-xl font-bold mb-4 flex items-center gap-2 ${isEditing ? 'text-blue-600' : 'text-green-600'}`}>
                        {isEditing ? <FaEdit /> : <FaPlus />}
                        {isEditing ? 'עריכת מוצר' : 'הוספת מוצר חדש'}
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">שם המוצר (להצגה)</label>
                            <input name="name" value={formData.name} onChange={handleChange} placeholder="לדוגמה: ספל בעיצוב אישי" className="w-full p-2 border rounded-lg" required />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">קטגוריה *</label>
                            <div className="flex gap-2 mt-1">
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    className="flex-1 min-w-0 p-2 border rounded-lg bg-white"
                                    required
                                >
                                    <option value="">— בחר קטגוריה —</option>
                                    {allCategories.map((cat) => (
                                        <option key={cat.value} value={cat.value}>
                                            {cat.label}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    onClick={() => handleDeleteCategory(formData.category)}
                                    disabled={!formData.category || savingCategory}
                                    className="shrink-0 p-2 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                                    title="הסר קטגוריה מהרשימה"
                                >
                                    <FaTrash />
                                </button>
                            </div>
                            {selectedCategoryMeta && (
                                <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{selectedCategoryMeta.hint}</p>
                            )}

                            {showAddCategory ? (
                                <div className="mt-3 p-3 rounded-lg border border-dashed border-[#f2665e]/50 bg-[#fff9f8] space-y-2">
                                    <p className="text-sm font-bold text-gray-800">קטגוריה חדשה</p>
                                    <input
                                        type="text"
                                        value={newCategoryName}
                                        onChange={(e) => setNewCategoryName(e.target.value)}
                                        placeholder="שם הקטגוריה"
                                        className="w-full p-2 border rounded-lg text-sm bg-white"
                                    />
                                    <select
                                        value={newCategoryDisplayType}
                                        onChange={(e) => setNewCategoryDisplayType(e.target.value)}
                                        className="w-full p-2 border rounded-lg bg-white text-sm"
                                    >
                                        {Object.entries(DISPLAY_TYPE_LABELS).map(([type, label]) => (
                                            <option key={type} value={type}>{label}</option>
                                        ))}
                                    </select>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={handleAddCategory}
                                            disabled={savingCategory}
                                            className="flex-1 py-1.5 rounded-lg text-sm font-bold text-white bg-[#f2665e] hover:bg-[#d95248] disabled:opacity-50"
                                        >
                                            שמור קטגוריה
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowAddCategory(false);
                                                setNewCategoryName("");
                                                setNewCategoryDisplayType(DISPLAY_TYPES.DESIGN);
                                            }}
                                            className="px-3 py-1.5 rounded-lg text-sm font-bold bg-gray-200 text-gray-700 hover:bg-gray-300"
                                        >
                                            ביטול
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setShowAddCategory(true)}
                                    className="mt-2 text-sm font-bold text-[#f2665e] hover:text-[#d95248] flex items-center gap-1.5"
                                >
                                    <FaPlus className="text-xs" />
                                    הוסף קטגוריה חדשה
                                </button>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">תיאור</label>
                            <textarea name="description" value={formData.description} onChange={handleChange} className="w-full p-2 border rounded-lg" required />
                        </div>
                        <div className="flex gap-4">
                            <div className="w-1/2">
                                <label className="block text-sm font-medium text-gray-700">מחיר (₪)</label>
                                <input type="number" name="price" value={formData.price} onChange={handleChange} className="w-full p-2 border rounded-lg" required />
                                {formData.displayType === DISPLAY_TYPES.MAGNET && (
                                    <p className="text-xs text-gray-400 mt-1">למגנטים: מחיר בסיסי — הלקוח יבחר גודל עם מחיר משלו</p>
                                )}
                            </div>
                            <div className="w-1/2">
                                <label className="block text-sm font-medium text-gray-700">מלאי</label>
                                <input type="number" name="stock" value={formData.stock} onChange={handleChange} className="w-full p-2 border rounded-lg" required />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">URL תמונה</label>
                            <SmartImageInput
                                name="image"
                                value={formData.image}
                                onChange={(url) => setFormData((prev) => ({ ...prev, image: url }))}
                                placeholder="https://..."
                                className="w-full p-2 border rounded-lg"
                                required
                            />
                        </div>

                        {isDesignCategory && (
                            <div className="rounded-lg border border-dashed border-[#f2665e]/40 bg-[#fff5f4] p-3 space-y-2">
                                <p className="text-sm font-bold text-gray-800">גודל משטח ההדפסה (ס"מ)</p>
                                <p className="text-xs text-gray-500">הלקוח יראה בעורך משטח עבודה בפרופורציה הזו</p>
                                <div className="flex gap-4">
                                    <div className="w-1/2">
                                        <label className="block text-xs font-medium text-gray-600">רוחב</label>
                                        <input
                                            type="number"
                                            name="printWidth"
                                            min="1"
                                            max="100"
                                            step="0.5"
                                            value={formData.printWidth}
                                            onChange={handleChange}
                                            className="w-full p-2 border rounded-lg"
                                            required
                                        />
                                    </div>
                                    <div className="w-1/2">
                                        <label className="block text-xs font-medium text-gray-600">גובה</label>
                                        <input
                                            type="number"
                                            name="printHeight"
                                            min="1"
                                            max="100"
                                            step="0.5"
                                            value={formData.printHeight}
                                            onChange={handleChange}
                                            className="w-full p-2 border rounded-lg"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-2 pt-2">
                            <button
                                type="submit"
                                className={`flex-1 text-white py-2 rounded-lg font-bold transition flex items-center justify-center gap-2 ${isEditing ? 'bg-blue-600 hover:bg-blue-700' : 'bg-[#f2665e] hover:bg-[#d95248]'}`}
                            >
                                {isEditing ? <><FaSave /> שמור שינויים</> : <><FaPlus /> הוסף מוצר</>}
                            </button>

                            {isEditing && (
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-bold hover:bg-gray-300 transition flex items-center gap-2"
                                >
                                    <FaTimes /> ביטול
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                <div className="lg:col-span-2 space-y-4">
                    <h3 className="text-xl font-bold text-gray-700 mb-4">רשימת מוצרים ({products.length})</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {loading ? <p>טוען...</p> : products.map(product => (
                            <div
                                key={product._id}
                                className={`bg-white p-4 rounded-xl shadow-sm border transition-all ${editId === product._id ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-100'}`}
                            >
                                <div className="flex gap-4">
                                    <img src={product.image} alt={product.name} className="w-24 h-24 object-cover rounded-lg bg-gray-100" />
                                    <div className="flex-1 flex flex-col justify-between">
                                        <div>
                                            <h3 className="font-bold text-gray-800">{product.name}</h3>
                                            <p className="text-xs text-gray-500 bg-gray-100 inline-block px-2 py-1 rounded mt-1">{product.category}</p>
                                            {(product.printWidth || product.printHeight) && product.displayType !== DISPLAY_TYPES.SIMPLE && (
                                                <p className="text-xs text-[#f2665e] mt-1">
                                                    הדפסה: {product.printWidth ?? 12}×{product.printHeight ?? 18} ס"מ
                                                </p>
                                            )}
                                        </div>
                                        <div className="mt-2 flex justify-between items-end">
                                            <span className="font-bold text-[#f2665e]">₪{product.price}</span>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleCopyLink(product._id)}
                                                    className="text-gray-500 hover:text-gray-700 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                                                    title="העתק קישור ישיר"
                                                >
                                                    <FaLink />
                                                </button>
                                                <button
                                                    onClick={() => handleEdit(product)}
                                                    className="text-blue-500 hover:text-blue-700 p-2 bg-blue-50 rounded-lg hover:bg-blue-100 transition"
                                                    title="ערוך"
                                                >
                                                    <FaEdit />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(product._id)}
                                                    className="text-red-400 hover:text-red-600 p-2 bg-red-50 rounded-lg hover:bg-red-100 transition"
                                                    title="מחק"
                                                >
                                                    <FaTrash />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
