import { useEffect, useMemo, useState } from 'react';
import { FaBoxOpen, FaEdit, FaPlus, FaSave, FaTimes } from 'react-icons/fa';
import { FiArrowLeft } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { addProduct, deleteProduct, getProducts, updateProduct } from '../api/products';
import SmartImageInput from '../components/SmartImageInput';
import { DISPLAY_TYPES, MAGNET_CATEGORY, getCategoryMeta, getDisplayTypeForCategory } from '../constants/productCategories';
import { getProductDirectLink } from '../utils/productDisplay';
import CaptionIdeasEditor from './products/CaptionIdeasEditor';
import CategoryField from './products/CategoryField';
import MemberDiscountField from './products/MemberDiscountField';
import PriceTiersEditor from './products/PriceTiersEditor';
import PrintAreaFields from './products/PrintAreaFields';
import ProductCard from './products/ProductCard';
import ProductShapeField from './products/ProductShapeField';
import {
    DEFAULT_CAPTION_CATEGORY,
    INITIAL_FORM_DATA,
    buildProductPayload,
    pricingWarnings,
    createEmptyCaption,
    createEmptyTier,
    displayTypeOf,
    productToForm,
} from './products/productForm';
import { useProductCategories } from './products/useProductCategories';

/** Products management: the product form (add / edit) next to the list of the shop's products */
export default function ProductsManagement() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState(INITIAL_FORM_DATA);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);
    const [productCaptions, setProductCaptions] = useState([]);
    const [newCaption, setNewCaption] = useState(createEmptyCaption);
    const [tieredPricingEnabled, setTieredPricingEnabled] = useState(false);
    const [priceTiers, setPriceTiers] = useState([]);

    const patchForm = (fields) => setFormData((prev) => ({ ...prev, ...fields }));

    /** A category of another kind keeps only what applies to it: captions for designs, no tiers for magnets */
    const applyCategory = (category, displayType, extra = {}) => {
        if (displayType !== DISPLAY_TYPES.DESIGN) {
            setProductCaptions([]);
            setNewCaption(createEmptyCaption());
        }
        if (displayType === DISPLAY_TYPES.MAGNET) {
            setTieredPricingEnabled(false);
            setPriceTiers([]);
        }
        setFormData({ ...formData, category, displayType, ...extra });
    };

    const categories = useProductCategories({
        products,
        onCategoryAdded: (name, displayType) => applyCategory(name, displayType),
        onCategoryRemoved: (value) => {
            if (formData.category === value) setFormData({ ...formData, category: '', displayType: '' });
        },
    });

    const displayType = displayTypeOf(formData);
    const isDesignCategory = displayType === DISPLAY_TYPES.DESIGN;
    const isMagnetCategory = displayType === DISPLAY_TYPES.MAGNET || formData.category === MAGNET_CATEGORY;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- category details change with the category list (listVersion)
    const selectedCategoryMeta = useMemo(() => getCategoryMeta(formData.category), [formData.category, categories.listVersion]);

    const loadProducts = async () => {
        try {
            setProducts(await getProducts());
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProducts();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'category') {
            const nextType = value ? getDisplayTypeForCategory(value) : '';
            applyCategory(value, nextType, { size: nextType === DISPLAY_TYPES.MAGNET ? formData.size : '' });
            return;
        }
        setFormData({ ...formData, [name]: value });
    };

    const resetForm = () => {
        setFormData(INITIAL_FORM_DATA);
        setProductCaptions([]);
        setNewCaption(createEmptyCaption());
        setTieredPricingEnabled(false);
        setPriceTiers([]);
        setIsEditing(false);
        setEditId(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const { payload, error } = buildProductPayload({
            formData,
            priceTiers,
            tieredPricingEnabled,
            captions: productCaptions,
            isDesignCategory,
            isMagnetCategory,
        });
        if (error) {
            alert(error);
            return;
        }
        try {
            if (isEditing) {
                await updateProduct(editId, payload);
                alert('מוצר עודכן בהצלחה!');
            } else {
                await addProduct(payload);
                alert('מוצר נוסף בהצלחה!');
            }
            resetForm();
            loadProducts();
        } catch (error) {
            console.error('Error saving product:', error);
            const status = error.response?.status;
            const serverMsg = error.response?.data?.msg || error.response?.data?.message;
            if (status === 401 || status === 403) {
                alert(serverMsg || 'אין הרשאה לשמור. יש להתחבר מחדש כמנהל.');
            } else {
                alert(serverMsg || 'שגיאה בשמירה');
            }
        }
    };

    const handleEdit = (product) => {
        const form = productToForm(product);
        setFormData(form.formData);
        setProductCaptions(form.captions);
        setTieredPricingEnabled(form.priceTiers.length > 0);
        setPriceTiers(form.priceTiers);
        setNewCaption(createEmptyCaption());
        setEditId(product._id);
        setIsEditing(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id) => {
        if (!confirm('למחוק את המוצר?')) return;
        try {
            await deleteProduct(id);
            if (isEditing && editId === id) resetForm();
            loadProducts();
        } catch {
            alert('שגיאה במחיקה');
        }
    };

    const handleCopyLink = async (productId) => {
        const link = getProductDirectLink(productId);
        try {
            await navigator.clipboard.writeText(link);
            alert('קישור ישיר הועתק!');
        } catch {
            prompt('העתק את הקישור:', link);
        }
    };

    const toggleTieredPricing = () => {
        setTieredPricingEnabled(!tieredPricingEnabled);
        setPriceTiers(tieredPricingEnabled ? [] : [createEmptyTier()]);
    };
    const changeTier = (tierId, field, value) => {
        setPriceTiers((prev) => prev.map((tier) => (tier.id === tierId ? { ...tier, [field]: value } : tier)));
    };
    const removeTier = (tierId) => {
        setPriceTiers((prev) => {
            const next = prev.filter((tier) => tier.id !== tierId);
            if (next.length === 0) setTieredPricingEnabled(false);
            return next;
        });
    };

    const addCaption = () => {
        const text = newCaption.text.trim();
        if (!text) return;
        setProductCaptions((prev) => [
            ...prev,
            { _id: `local-${Date.now()}`, text, category: newCaption.category || DEFAULT_CAPTION_CATEGORY },
        ]);
        setNewCaption(createEmptyCaption());
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

                        <CategoryField
                            value={formData.category}
                            onChange={handleChange}
                            categoryMeta={selectedCategoryMeta}
                            categories={categories}
                        />

                        <div>
                            <label className="block text-sm font-medium text-gray-700">תיאור</label>
                            <textarea name="description" value={formData.description} onChange={handleChange} className="w-full p-2 border rounded-lg" required />
                        </div>
                        <div className="flex gap-4">
                            <div className="w-1/2">
                                <label className="block text-sm font-medium text-gray-700">מחיר (₪)</label>
                                <input type="number" name="price" value={formData.price} onChange={handleChange} className="w-full p-2 border rounded-lg" required />
                                {tieredPricingEnabled && !isMagnetCategory && (
                                    <p className="text-xs text-gray-400 mt-1">מחיר בסיס — ישמש כברירת מחדל אם הכמות לא תואמת מדרגה</p>
                                )}
                            </div>
                            <div className="w-1/2">
                                <label className="block text-sm font-medium text-gray-700">מלאי</label>
                                <input type="number" name="stock" value={formData.stock} onChange={handleChange} className="w-full p-2 border rounded-lg" required />
                                <ProductShapeField shapeType={formData.shapeType} shapeMaskUrl={formData.shapeMaskUrl} onChange={patchForm} />
                                <MemberDiscountField type={formData.memberDiscountType} value={formData.memberDiscountValue} onChange={patchForm} />
                            </div>
                        </div>
                        {!isMagnetCategory && pricingWarnings({ formData, priceTiers, tieredPricingEnabled }).map((warning) => (
                            <p key={warning} className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">{warning}</p>
                        ))}

                        {isMagnetCategory && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700">גודל</label>
                                <input
                                    name="size"
                                    value={formData.size}
                                    onChange={handleChange}
                                    placeholder='לדוגמה: 15×10'
                                    className="w-full p-2 border rounded-lg"
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    כל גודל נשמר כמוצר נפרד. להוסיף גודל נוסף — צרו מוצר מגנט נוסף.
                                </p>
                            </div>
                        )}

                        {!isMagnetCategory && (
                            <PriceTiersEditor
                                enabled={tieredPricingEnabled}
                                tiers={priceTiers}
                                onToggle={toggleTieredPricing}
                                onChangeTier={changeTier}
                                onAddTier={() => setPriceTiers((prev) => [...prev, createEmptyTier()])}
                                onRemoveTier={removeTier}
                            />
                        )}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">URL תמונה</label>
                            <SmartImageInput
                                name="image"
                                value={formData.image}
                                onChange={(url) => patchForm({ image: url })}
                                placeholder="https://..."
                                className="w-full p-2 border rounded-lg"
                                required
                            />
                        </div>

                        {isDesignCategory && (
                            <CaptionIdeasEditor
                                captions={productCaptions}
                                newCaption={newCaption}
                                onNewCaptionChange={(fields) => setNewCaption((prev) => ({ ...prev, ...fields }))}
                                onAdd={addCaption}
                                onRemove={(captionId) => setProductCaptions((prev) => prev.filter((c) => c._id !== captionId))}
                            />
                        )}

                        {isDesignCategory && (
                            <PrintAreaFields
                                printWidth={formData.printWidth}
                                printHeight={formData.printHeight}
                                allowOrientationToggle={formData.allowOrientationToggle}
                                onFieldChange={handleChange}
                                onToggleOrientation={(checked) => patchForm({ allowOrientationToggle: checked })}
                            />
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
                        {loading ? <p>טוען...</p> : products.map((product) => (
                            <ProductCard
                                key={product._id}
                                product={product}
                                isBeingEdited={editId === product._id}
                                onCopyLink={handleCopyLink}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
