import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { getPage } from '../api/pages';

const ProductSelectionPage = () => {
    const { productId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { addToCart } = useCartStore();
    const [isUploading, setIsUploading] = useState(false);
    const [heroBgImage, setHeroBgImage] = useState("");
    const [uploadedImage, setUploadedImage] = useState(null);
    const fileInputRef = useRef(null);
    const product = location.state?.product;

    useEffect(() => {
        const fetchPageDesign = async () => {
            try {
                const data = await getPage("products");
                if (data && data.img) {
                    setHeroBgImage(data.img);
                }
            } catch (error) {
                console.error("Error fetching products page design:", error);
            }
        };
        fetchPageDesign();
    }, []);

    if (!product) {
        navigate('/');
        return null;
    }

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

    const handleAddToCart = async () => {
        if (!uploadedImage) return;

        const cartItem = {
            ...product,
            cartItemId: `${product._id}-${Date.now()}`,
            image: uploadedImage,
            quantity: 1,
            price: product.price || 0,
            customization: { type: 'upload-only', originalImage: product.image }
        };

        try {
            await addToCart([cartItem]);
            navigate('/cart');
        } catch (error) {
            console.error("Failed to add to cart:", error);
            alert("הייתה בעיה בהוספת המוצר לסל, אנא נסה שוב.");
        }
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        e.target.value = '';
        setIsUploading(true);
        try {
            const imageUrl = await uploadImage(file);
            if (!imageUrl) {
                alert("העלאת התמונה נכשלה, אנא נסה שוב.");
                return;
            }
            setUploadedImage(imageUrl);
            setTimeout(() => {
                window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
            }, 100);

        } catch (error) {
            console.error("Error processing upload:", error);
            alert("הייתה שגיאה בהעלאת התמונה.");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white pb-20">
            <div className="w-full relative">
                <div
                    className="relative h-[240px] sm:h-[320px] bg-cover bg-center flex items-center justify-center text-white"
                    style={{ backgroundImage: `url(${heroBgImage})` }}
                >
                    <div className="absolute inset-0 bg-black/40"></div>
                    <h1 className="relative z-10 text-5xl sm:text-6xl font-bold text-center drop-shadow-lg tracking-wide">
                        {product.name}
                    </h1>

                    <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0] rotate-180">
                        <svg
                            className="relative block w-[calc(100%+1.3px)] h-[50px] md:h-[70px]"
                            data-name="Layer 1"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 1200 120"
                            preserveAspectRatio="none"
                        >
                            <path
                                d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
                                fill="#ffffff"
                            ></path>
                        </svg>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="relative py-12 px-4">
                <div className="max-w-4xl mx-auto relative">
                    <button
                        onClick={() => navigate(-1)}
                        className="absolute -top-8 left-0 flex items-center gap-2 text-gray-500 hover:text-[#f2665e] transition-colors font-medium text-sm sm:text-base"
                    >
                        חזרה למוצרים <ArrowLeft size={18} />
                    </button>

                    <div className="space-y-8 mt-4">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                            <div className="flex items-center justify-between">
                                <div className="w-64">
                                    <img
                                        src={product.image}
                                        alt={product.name}
                                        className="w-full h-48 object-cover rounded-lg bg-gray-100"
                                    />
                                </div>

                                <div className="flex-1 text-right pr-8 flex flex-col justify-center h-48">
                                    <h2 className="text-3xl font-bold text-[#f2665e] mb-2">
                                        {product.name}
                                    </h2>

                                    <div className="mb-6">
                                        <span className="text-xl font-bold text-black ml-2">
                                            {product.price} ₪
                                        </span>
                                        <br />
                                        <span className="text-sm text-black">
                                            עיצוב מותאם אישית בתוספת 15 ש"ח
                                        </span>
                                    </div>

                                    <div className="flex gap-3 justify-end mt-auto">
                                        <button
                                            onClick={handleDesignClick}
                                            className="px-6 py-2 bg-[#f2665e]/10 hover:bg-[#f2665e]/20 text-[#f2665e] rounded-full text-sm font-bold transition-colors"
                                        >
                                            עיצוב מותאם
                                        </button>
                                        <button
                                            onClick={handleUploadClick}
                                            disabled={isUploading}
                                            className="px-6 py-2 bg-[#f2665e] hover:bg-[#d95248] text-white rounded-full text-sm font-bold transition-colors disabled:opacity-50"
                                        >
                                            {isUploading ? 'מעלה...' : (uploadedImage ? 'החלף תמונה' : 'העלו תמונה')}
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

                        {uploadedImage && (
                            <div className="animate-fade-in mt-8 bg-gray-50 rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
                                <h3 className="text-xl font-bold text-gray-800 mb-6">התמונה שבחרת:</h3>
                                <div className="flex flex-col items-center gap-6">
                                    <img
                                        src={uploadedImage}
                                        alt="Uploaded preview"
                                        className="max-w-md w-full h-64 object-contain rounded-lg bg-white shadow-md border border-gray-200"
                                    />
                                    <button
                                        onClick={handleAddToCart}
                                        className="w-full max-w-md bg-[#f2665e] hover:bg-[#d95248] text-white font-bold py-3 px-8 rounded-full shadow-lg transform hover:scale-105 transition-all text-lg"
                                    >
                                        הוסף לסל
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductSelectionPage;