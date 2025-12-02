import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaBoxOpen, FaPlus, FaTrash, FaEdit } from "react-icons/fa";
import { FiArrowLeft } from "react-icons/fi";
import { getProducts, addProduct, deleteProduct } from "../api/products";

// These keys must match the AI service keys
const PRODUCT_CATEGORIES = [
    'T-shirt', 'Hoodie', 'Baseball Cap', 'Coffee Mug', 
    'Travel Tumbler', 'Tote Bag', 'Phone Case', 
    'Notebook', 'Jigsaw Puzzle', 'Heart Puzzle'
];

export default function ProductsManagement() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        price: "",
        category: "T-shirt",
        stock: 100,
        image: ""
    });

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
        try {
            await addProduct(formData);
            alert("מוצר נוסף בהצלחה!");
            setFormData({
                name: "", description: "", price: "", 
                category: "T-shirt", stock: 100, image: ""
            });
            loadProducts();
        } catch (error) {
            console.error("Error adding product:", error);
            alert("שגיאה בהוספת מוצר");
        }
    };

    const handleDelete = async (id) => {
        if(confirm("למחוק את המוצר?")) {
            try {
                await deleteProduct(id);
                loadProducts();
            } catch (err) {
                alert("שגיאה במחיקה");
            }
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6 font-sans">
            <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                        <FaBoxOpen className="text-[#f2665e]" />
                        ניהול מוצרים
                    </h1>
                    <p className="text-gray-500 mt-1">הוספת מוצרים לקטלוג ההדפסות</p>
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
                {/* Add Product Form */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <FaPlus className="text-green-500" /> הוספת מוצר חדש
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
                        <button type="submit" className="w-full bg-[#f2665e] text-white py-2 rounded-lg font-bold hover:bg-[#d95248] transition">הוסף מוצר</button>
                    </form>
                </div>

                {/* Products List */}
                <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {loading ? <p>טוען...</p> : products.map(product => (
                        <div key={product._id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-4">
                            <img src={product.image} alt={product.name} className="w-24 h-24 object-cover rounded-lg bg-gray-100" />
                            <div className="flex-1">
                                <h3 className="font-bold text-gray-800">{product.name}</h3>
                                <p className="text-xs text-gray-500 bg-gray-100 inline-block px-2 py-1 rounded mt-1">{product.category}</p>
                                <div className="mt-2 flex justify-between items-end">
                                    <span className="font-bold text-[#f2665e]">₪{product.price}</span>
                                    <button onClick={() => handleDelete(product._id)} className="text-red-400 hover:text-red-600 p-2">
                                        <FaTrash />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}