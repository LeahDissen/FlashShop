import { useState, useEffect } from "react";
import { FaBoxOpen, FaEdit, FaPlus, FaSave, FaTimes, FaTrash } from "react-icons/fa";
import { FiArrowLeft } from "react-icons/fi";
import { Link } from "react-router-dom";
import { addProduct, deleteProduct, getProducts, updateProduct } from "../api/products";

const PRODUCT_CATEGORIES = [
    'T-shirt', 'Hoodie', 'Baseball Cap', 'Coffee Mug', 
    'Travel Tumbler', 'Tote Bag', 'Phone Case', 
    'Notebook', 'Jigsaw Puzzle', 'Heart Puzzle'
];

const INITIAL_FORM_DATA = {
    name: "",
    description: "",
    price: "",
    category: "T-shirt",
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

    useEffect(() => {
        loadProducts();
    }, []);

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
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const payload = {
            ...formData,
            price: Number(formData.price),
            stock: Number(formData.stock),
            printWidth: Number(formData.printWidth) || 12,
            printHeight: Number(formData.printHeight) || 18,
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
        setFormData({
            name: product.name,
            description: product.description,
            price: product.price,
            category: product.category,
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
        if(confirm("למחוק את המוצר?")) {
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                {/* Product Form */}
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
                            <label className="block text-sm font-medium text-gray-700">סוג מוצר (עבור ה-AI)</label>
                            <select name="category" value={formData.category} onChange={handleChange} className="w-full p-2 border rounded-lg" dir="ltr">
                                {PRODUCT_CATEGORIES.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">תיאור</label>
                            <textarea name="description" value={formData.description} onChange={handleChange} className="w-full p-2 border rounded-lg" required />
                        </div>
                        <div className="flex gap-4">
                            <div className="w-1/2">
                                <label className="block text-sm font-medium text-gray-700">מחיר (₪)</label>
                                <input type="number" name="price" value={formData.price} onChange={handleChange} className="w-full p-2 border rounded-lg" required />
                            </div>
                            <div className="w-1/2">
                                <label className="block text-sm font-medium text-gray-700">מלאי</label>
                                <input type="number" name="stock" value={formData.stock} onChange={handleChange} className="w-full p-2 border rounded-lg" required />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">URL תמונה</label>
                            <input type="text" name="image" value={formData.image} onChange={handleChange} placeholder="https://..." className="w-full p-2 border rounded-lg" required />
                        </div>

                        <div className="rounded-lg border border-dashed border-[#f2665e]/40 bg-[#fff5f4] p-3 space-y-2">
                            <p className="text-sm font-bold text-gray-800">גודל משטח ההדפסה (ס"מ)</p>
                            <p className="text-xs text-gray-500">הלקוח יראה בעורך משטח עבודה בפרופורציה הזו — לדוגמה חולצה לרכב 12×12</p>
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

                {/* Products List */}
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
                                            {(product.printWidth || product.printHeight) && (
                                                <p className="text-xs text-[#f2665e] mt-1">
                                                    הדפסה: {product.printWidth ?? 12}×{product.printHeight ?? 18} ס"מ
                                                </p>
                                            )}
                                        </div>
                                        <div className="mt-2 flex justify-between items-end">
                                            <span className="font-bold text-[#f2665e]">₪{product.price}</span>
                                            <div className="flex gap-2">
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