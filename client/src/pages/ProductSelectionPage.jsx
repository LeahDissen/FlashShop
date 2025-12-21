import { useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Upload, Palette, Loader2, ArrowRight } from 'lucide-react';
import { useCartStore } from '../store/cartStore';

const ProductSelectionPage = () => {
    const { productId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { addToCart } = useCartStore();
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null);

    // קבלת המוצר מה-state
    const product = location.state?.product;

    if (!product) {
        navigate('/');
        return null;
    }

    // --- פונקציית העלאה (נלקחה מ-PhotoDevelopmentPage) ---
    const uploadImage = async (file) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", "ml_default");

        try {
            const response = await fetch(
                "https://api.cloudinary.com/v1_1/dwqywo11u/image/upload",
                { method: "POST", body: formData }
            );

            if (!response.ok) {
                const errorData = await response.json();
                console.error("Cloudinary Error:", errorData);
                return null;
            }

            const data = await response.json();
            return data.secure_url;
        } catch (error) {
            console.error("Error uploading image:", error);
            return null;
        }
    };

    const handleDesignClick = () => {
        navigate(`/editor/${productId}`);
    };

    const handleUploadClick = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const imageUrl = await uploadImage(file);

            if (!imageUrl) {
                alert("העלאת התמונה נכשלה, אנא נסה שוב.");
                return;
            }

            const cartItem = {
                ...product,
                image: imageUrl,
                customization: { type: 'upload-only', originalImage: product.image }
            };

            addToCart(cartItem);
            navigate('/cart');

        } catch (error) {
            console.error("Error processing upload:", error);
            alert("הייתה שגיאה בהעלאת התמונה.");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 px-4">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* כרטיס עליון - פאזל מודפס */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    <div className="flex items-center justify-between">
                        {/* תמונת מוצר - שמאל */}
                        <div className="w-64">
                            <img
                                src={product.image || "https://images.unsplash.com/photo-1587731556938-38755b4803a6?w=300"}
                                alt={product.name}
                                className="w-full h-48 object-cover rounded-lg bg-gray-100"
                            />
                        </div>

                        {/* טקסט וכפתורים - ימין */}
                        <div className="flex-1 text-right pr-8">
                            {/* לוגו */}
                            <div className="flex justify-end mb-4">
                                <div className="w-12 h-12 bg-pink-50 rounded-full flex items-center justify-center">
                                    <span className="text-pink-400 text-lg font-serif">T</span>
                                </div>
                            </div>

                            <h2 className="text-2xl font-bold text-gray-900 mb-2">פאזל מודפס</h2>
                            <p className="text-gray-500 text-sm mb-6">תמונות שלך על מוצרים שונים</p>

                            {/* כפתורים */}
                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={handleDesignClick}
                                    className="px-6 py-2 bg-pink-50 hover:bg-pink-100 text-gray-700 rounded-full text-sm font-medium transition-colors"
                                >
                                    עיצוב מותאם
                                </button>
                                <button
                                    onClick={handleUploadClick}
                                    disabled={isUploading}
                                    className="px-6 py-2 bg-pink-400 hover:bg-pink-500 text-white rounded-full text-sm font-medium transition-colors disabled:opacity-50"
                                >
                                    {isUploading ? 'מעלה...' : 'העלו תמונה'}
                                </button>
                            </div>

                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="hidden"
                                accept="image/*"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductSelectionPage;