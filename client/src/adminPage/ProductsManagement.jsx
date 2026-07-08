import { useState, useEffect, useMemo } from "react";
import { FaBoxOpen, FaEdit, FaPlus, FaSave, FaTimes, FaTrash, FaLink } from "react-icons/fa";
import { FiArrowLeft } from "react-icons/fi";
import { Link } from "react-router-dom";
import { addProduct, deleteProduct, getProducts, updateProduct } from "../api/products";
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
import { CAPTION_CATEGORIES } from "../constants/captionCategories";
import { validatePriceTiers, serializePriceTiers } from "../utils/productQuantityPricing";

const createEmptyTier = () => ({
    id: `tier-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    minQuantity: "",
    maxQuantity: "",
    unitPrice: "",
});

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
    allowOrientationToggle: false,
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
    const [productCaptions, setProductCaptions] = useState([]);
    const [newCaption, setNewCaption] = useState({ text: "", category: "כללי" });
    const [tieredPricingEnabled, setTieredPricingEnabled] = useState(false);
    const [priceTiers, setPriceTiers] = useState([]);

    const allCategories = useMemo(() => getAllCategories(), [categoryListVersion]);
    const customCategories = useMemo(() => getCustomCategories(), [categoryListVersion]);
    const hiddenCategories = useMemo(() => getHiddenCategories(), [categoryListVersion]);

    const selectedCategoryMeta = useMemo(
        () => getCategoryMeta(formData.category),
        [formData.category, categoryListVersion],
    );
    const isDesignCategory = useMemo(() => {
        const displayType = formData.displayType
            || (formData.category ? getDisplayTypeForCategory(formData.category) : "");
        return displayType === DISPLAY_TYPES.DESIGN;
    }, [formData.category, formData.displayType, categoryListVersion]);

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
            if (newCategoryDisplayType !== DISPLAY_TYPES.DESIGN) {
                setProductCaptions([]);
                setNewCaption({ text: "", category: "כללי" });
            }
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
            const displayType = value ? getDisplayTypeForCategory(value) : "";
            if (displayType !== DISPLAY_TYPES.DESIGN) {
                setProductCaptions([]);
                setNewCaption({ text: "", category: "כללי" });
            }
            setFormData({
                ...formData,
                category: value,
                displayType,
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

        let serializedTiers = [];
        if (tieredPricingEnabled) {
            const validation = validatePriceTiers(priceTiers);
            if (!validation.valid) {
                alert(validation.message);
                return;
            }
            serializedTiers = serializePriceTiers(priceTiers);
        }

        const displayType = getDisplayTypeForCategory(formData.category);
        const payload = {
            name: formData.name.trim(),
            description: formData.description.trim(),
            price: Number(formData.price),
            category: formData.category,
            displayType,
            stock: Number(formData.stock),
            image: formData.image.trim(),
            priceTiers: serializedTiers,
            captionIdeas: isDesignCategory
                ? productCaptions
                    .map(({ text, category }) => ({
                        text: text.trim(),
                        category: category || "כללי",
                    }))
                    .filter((caption) => caption.text.length > 0)
                : [],
        };

        if (isDesignCategory) {
            payload.printWidth = Number(formData.printWidth) || 12;
            payload.printHeight = Number(formData.printHeight) || 18;
            payload.allowOrientationToggle = Boolean(formData.allowOrientationToggle);
        }

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
            const status = error.response?.status;
            const serverMsg = error.response?.data?.msg || error.response?.data?.message;
            if (status === 401 || status === 403) {
                alert(serverMsg || "אין הרשאה לשמור. יש להתחבר מחדש כמנהל.");
            } else {
                alert(serverMsg || "שגיאה בשמירה");
            }
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
            allowOrientationToggle: Boolean(product.allowOrientationToggle),
        });
        setProductCaptions(
            displayType === DISPLAY_TYPES.DESIGN ? (product.captionIdeas ?? []) : [],
        );
        const tiers = product.priceTiers ?? [];
        setTieredPricingEnabled(tiers.length > 0);
        setPriceTiers(
            tiers.length > 0
                ? tiers.map((t, i) => ({
                    id: `tier-${i}-${t.minQuantity}`,
                    minQuantity: t.minQuantity ?? "",
                    maxQuantity: t.maxQuantity == null ? "" : t.maxQuantity,
                    unitPrice: t.unitPrice ?? "",
                }))
                : [],
        );
        setNewCaption({ text: "", category: "כללי" });
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
        setProductCaptions([]);
        setNewCaption({ text: "", category: "כללי" });
        setTieredPricingEnabled(false);
        setPriceTiers([]);
        setIsEditing(false);
        setEditId(null);
    };

    const handleToggleTieredPricing = () => {
        if (tieredPricingEnabled) {
            setTieredPricingEnabled(false);
            setPriceTiers([]);
            return;
        }
        setTieredPricingEnabled(true);
        setPriceTiers([createEmptyTier()]);
    };

    const handleTierChange = (tierId, field, value) => {
        setPriceTiers((prev) =>
            prev.map((tier) => (tier.id === tierId ? { ...tier, [field]: value } : tier)),
        );
    };

    const handleAddTier = () => {
        setPriceTiers((prev) => [...prev, createEmptyTier()]);
    };

    const handleRemoveTier = (tierId) => {
        setPriceTiers((prev) => {
            const next = prev.filter((tier) => tier.id !== tierId);
            if (next.length === 0) {
                setTieredPricingEnabled(false);
            }
            return next;
        });
    };

    const handleAddCaption = () => {
        const text = newCaption.text.trim();
        if (!text) return;
        setProductCaptions((prev) => [
            ...prev,
            { _id: `local-${Date.now()}`, text, category: newCaption.category || "כללי" },
        ]);
        setNewCaption({ text: "", category: "כללי" });
    };

    const handleRemoveCaption = (captionId) => {
        setProductCaptions((prev) => prev.filter((c) => c._id !== captionId));
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
                                {tieredPricingEnabled && (
                                    <p className="text-xs text-gray-400 mt-1">מחיר בסיס — ישמש כברירת מחדל אם הכמות לא תואמת מדרגה</p>
                                )}
                            </div>
                            <div className="w-1/2">
                                <label className="block text-sm font-medium text-gray-700">מלאי</label>
                                <input type="number" name="stock" value={formData.stock} onChange={handleChange} className="w-full p-2 border rounded-lg" required />
                            </div>
                        </div>

                        <div className="rounded-lg border border-dashed border-[#f2665e]/40 bg-[#fff5f4] p-3 space-y-3">
                            <div className="flex items-center justify-between gap-2">
                                <div>
                                    <p className="text-sm font-bold text-gray-800">מדרגות מחיר לפי כמות</p>
                                    <p className="text-xs text-gray-500 mt-0.5">הנחות כמות — אופציונלי</p>
                                </div>
                                {!tieredPricingEnabled && (
                                    <button
                                        type="button"
                                        onClick={handleToggleTieredPricing}
                                        className="text-sm font-bold text-[#f2665e] hover:text-[#d95248] flex items-center gap-1.5 shrink-0"
                                    >
                                        <FaPlus className="text-xs" />
                                        הוסף מדרגות מחיר
                                    </button>
                                )}
                            </div>

                            {tieredPricingEnabled && (
                                <div className="space-y-2">
                                    <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 text-xs font-medium text-gray-600 px-1">
                                        <span>מינימום</span>
                                        <span>מקסימום</span>
                                        <span>מחיר ליחידה (₪)</span>
                                        <span className="w-8" />
                                    </div>
                                    <p className="text-[11px] text-gray-500 px-1">
                                        במדרגה האחרונה ניתן להשאיר מקסימום ריק — יוצג ללקוח כ&quot;50+&quot; / &quot;50 ומעלה&quot;
                                    </p>
                                    {priceTiers.map((tier, index) => {
                                        const isLastTier = index === priceTiers.length - 1;
                                        return (
                                        <div
                                            key={tier.id}
                                            className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-center"
                                        >
                                            <input
                                                type="number"
                                                min="1"
                                                value={tier.minQuantity}
                                                onChange={(e) => handleTierChange(tier.id, "minQuantity", e.target.value)}
                                                placeholder="מ-"
                                                className="w-full p-2 border rounded-lg text-sm bg-white"
                                                required
                                            />
                                            <input
                                                type="number"
                                                min="1"
                                                value={tier.maxQuantity}
                                                onChange={(e) => handleTierChange(tier.id, "maxQuantity", e.target.value)}
                                                placeholder={isLastTier ? "ומעלה" : "עד"}
                                                title={isLastTier ? "השאירו ריק למדרגה פתוחה (למשל 50 ומעלה)" : undefined}
                                                className="w-full p-2 border rounded-lg text-sm bg-white"
                                                required={!isLastTier}
                                            />
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={tier.unitPrice}
                                                onChange={(e) => handleTierChange(tier.id, "unitPrice", e.target.value)}
                                                placeholder="₪"
                                                className="w-full p-2 border rounded-lg text-sm bg-white"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveTier(tier.id)}
                                                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                                title="מחק מדרגה"
                                            >
                                                <FaTrash className="text-xs" />
                                            </button>
                                        </div>
                                        );
                                    })}
                                    <div className="flex gap-2 pt-1">
                                        <button
                                            type="button"
                                            onClick={handleAddTier}
                                            className="text-sm font-bold text-[#f2665e] hover:text-[#d95248] flex items-center gap-1.5"
                                        >
                                            <FaPlus className="text-xs" />
                                            הוסף מדרגה
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleToggleTieredPricing}
                                            className="text-sm font-bold text-gray-500 hover:text-gray-700"
                                        >
                                            בטל מדרגות
                                        </button>
                                    </div>
                                </div>
                            )}
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
                        <div className="rounded-lg border border-dashed border-[#f2665e]/40 bg-[#fff5f4] p-3 space-y-3">
                            <div>
                                <p className="text-sm font-bold text-gray-800">משפטים מתאימים לכיתוב</p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    לקוחות יראו את המשפטים בעמוד &quot;רעיונות לכיתובים&quot; למוצר זה
                                </p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-medium text-gray-600 mb-1">טקסט לכיתוב</label>
                                    <input
                                        type="text"
                                        value={newCaption.text}
                                        onChange={(e) => setNewCaption((prev) => ({ ...prev, text: e.target.value }))}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                handleAddCaption();
                                            }
                                        }}
                                        placeholder='למשל: "תמיד ביחד"'
                                        className="w-full p-2 border rounded-lg text-sm bg-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">קטגוריה</label>
                                    <select
                                        value={newCaption.category}
                                        onChange={(e) => setNewCaption((prev) => ({ ...prev, category: e.target.value }))}
                                        className="w-full p-2 border rounded-lg text-sm bg-white"
                                    >
                                        {CAPTION_CATEGORIES.map((cat) => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={handleAddCaption}
                                disabled={!newCaption.text.trim()}
                                className="w-full py-1.5 rounded-lg text-sm font-bold text-[#f2665e] border border-[#f2665e]/30 hover:bg-[#f2665e]/10 transition disabled:opacity-40"
                            >
                                <FaPlus className="inline text-xs ml-1" />
                                הוסף משפט
                            </button>
                            {productCaptions.length > 0 && (
                                <ul className="space-y-2 max-h-40 overflow-y-auto">
                                    {productCaptions.map((caption) => (
                                        <li
                                            key={caption._id}
                                            className="flex items-start justify-between gap-2 p-2 rounded-lg bg-white border border-gray-100 text-sm"
                                        >
                                            <div className="min-w-0 text-right">
                                                <span className="text-xs font-bold text-[#f2665e] bg-[#f2665e]/10 px-2 py-0.5 rounded-full">
                                                    {caption.category || "כללי"}
                                                </span>
                                                <p className="mt-1 text-gray-800 truncate">&quot;{caption.text}&quot;</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveCaption(caption._id)}
                                                className="shrink-0 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                                title="מחק משפט"
                                            >
                                                <FaTrash className="text-xs" />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        )}

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
                                <label className="flex items-center gap-2 cursor-pointer pt-1">
                                    <input
                                        type="checkbox"
                                        name="allowOrientationToggle"
                                        checked={Boolean(formData.allowOrientationToggle)}
                                        onChange={(e) => setFormData((prev) => ({
                                            ...prev,
                                            allowOrientationToggle: e.target.checked,
                                        }))}
                                        className="rounded border-gray-300 text-[#f2665e] focus:ring-[#f2665e]"
                                    />
                                    <span className="text-xs text-gray-700">
                                        לאפשר ללקוח להפוך את כיוון המשטח (אורך/רוחב)
                                    </span>
                                </label>
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
                                            <div>
                                                <span className="font-bold text-[#f2665e]">₪{product.price}</span>
                                                {product.priceTiers?.length > 0 && (
                                                    <p className="text-[10px] text-gray-400 mt-0.5">
                                                        + {product.priceTiers.length} מדרגות מחיר
                                                    </p>
                                                )}
                                            </div>
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
