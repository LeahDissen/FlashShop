import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, User, Mail, Phone, FileText, Upload, Image as ImageIcon, Loader2, Trash2 } from 'lucide-react';
import { getProductById } from '../api/products';
import { useCartStore } from '../store/cartStore';
import { useProductStore } from '../store/productStore';
import { getPage } from '../api/pages';
import { MAGNET_SIZES } from '../constants/productCategories';
import { uploadImageToCloudinary } from '../utils/cloudinaryUpload';
import { isMagnetProduct, isSimpleProduct } from '../utils/productDisplay';

const ProductSelectionPage = () => {
    const { productId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { addToCart } = useCartStore();
    const setSelectedProduct = useProductStore((state) => state.setSelectedProduct);

    const [product, setProduct] = useState(location.state?.product ?? null);
    const [loadingProduct, setLoadingProduct] = useState(!location.state?.product);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadedImage, setUploadedImage] = useState(null);
    const [magnetImage, setMagnetImage] = useState(null);
    const [selectedMagnetSize, setSelectedMagnetSize] = useState(MAGNET_SIZES[0]);

    const [showDesignerForm, setShowDesignerForm] = useState(false);
    const [isDesignerUploading, setIsDesignerUploading] = useState(false);
    const [designerDetails, setDesignerDetails] = useState({
        name: '',
        email: '',
        phone: '',
        description: '',
        referenceImage: null
    });

    const [heroBgImage, setHeroBgImage] = useState("");
    const fileInputRef = useRef(null);
    const magnetFileRef = useRef(null);
    const designerFileRef = useRef(null);

    useEffect(() => {
        if (product) {
            setSelectedProduct(product);
            return;
        }
        if (!productId) return;

        setLoadingProduct(true);
        getProductById(productId)
            .then((data) => {
                setProduct(data);
                setSelectedProduct(data);
            })
            .catch(() => navigate('/products'))
            .finally(() => setLoadingProduct(false));
    }, [product, productId, setSelectedProduct, navigate]);

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

    if (loadingProduct) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#faf8f6]" dir="rtl">
                <p className="text-gray-500">טוען מוצר...</p>
            </div>
        );
    }

    if (!product) {
        return null;
    }

    const simpleProduct = isSimpleProduct(product);
    const magnetProduct = isMagnetProduct(product);

    const addToCartAndNavigate = async (items, { successMessage } = {}) => {
        try {
            await addToCart(items);
            if (successMessage) {
                alert(successMessage);
            }
            navigate('/cart');
        } catch (error) {
            console.error('Failed to add to cart:', error);
            alert('לא ניתן להוסיף לסל כרגע. נסו שוב.');
        }
    };

    const handleSimpleAddToCart = async () => {
        await addToCartAndNavigate([{
            ...product,
            productId: product._id,
            id: `${product._id}-simple-${Date.now()}`,
            quantity: 1,
            price: product.price || 0,
        }]);
    };

    const handleMagnetFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        e.target.value = '';
        setIsUploading(true);
        try {
            const imageUrl = await uploadImageToCloudinary(file);
            setMagnetImage(imageUrl);
        } catch (error) {
            alert(error?.message || "הייתה שגיאה בהעלאת התמונה.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleRemoveMagnetImage = () => {
        setMagnetImage(null);
        if (magnetFileRef.current) magnetFileRef.current.value = '';
    };

    const handleUploadAddToCart = async () => {
        if (!uploadedImage) return;
        await addToCartAndNavigate([{
            ...product,
            productId: product._id,
            id: `${product._id}-upload-${Date.now()}`,
            image: uploadedImage,
            quantity: 1,
            price: product.price || 0,
            customization: { type: 'upload-only', originalImage: product.image },
        }]);
    };

    const handleMagnetAddToCart = async () => {
        if (!magnetImage) {
            alert("יש להעלות תמונה למגנט");
            return;
        }
        await addToCartAndNavigate([{
            ...product,
            productId: product._id,
            id: `${product._id}-magnet-${Date.now()}`,
            quantity: 1,
            price: selectedMagnetSize.price,
            image: magnetImage,
            size: selectedMagnetSize.label,
            customization: {
                type: 'magnet',
                printSize: selectedMagnetSize.label,
                width: selectedMagnetSize.width,
                height: selectedMagnetSize.height,
            },
        }]);
    };

    // מעבר לעמוד עריכה עצמית ومסירת המוצר המלא בסטייט
    const handleDesignClick = () => {
        setSelectedProduct(product);
        navigate(`/editor/${productId}`, { state: { product } });
    };

    // שליחת טופס גרפיקאית עם וולידציות מורחבות
    const handleDesignerSubmit = async (e) => {
        e.preventDefault();
        
        // וולידציית טלפון ישראלי בסיסית
        const cleanPhone = designerDetails.phone.replace(/[-\s]/g, '');
        if (cleanPhone.length < 9 || cleanPhone.length > 10 || isNaN(cleanPhone)) {
            alert("אנא הזן מספר טלפון תקין");
            return;
        }

        // וולידציית אימייל
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(designerDetails.email)) {
            alert("אנא הזן כתובת אימייל תקינה");
            return;
        }

        const cartItem = {
            ...product,
            productId: product._id,
            id: `${product._id}-designer-${Date.now()}`,
            quantity: 1,
            price: (product.price || 0) + 15, // תוספת תשלום של 15 ש"ח לגרפיקאית
            customization: { 
                type: 'designer-service', 
                ...designerDetails 
            }
        };

        await addToCartAndNavigate([cartItem], {
            successMessage: 'הבקשה לעיצוב נקלטה והמוצר נוסף לסל בהצלחה!',
        });
    };

    // טיפול בקובץ של מסלול העלאה ישירה
    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        e.target.value = '';
        setIsUploading(true);
        try {
            const imageUrl = await uploadImageToCloudinary(file);
            setUploadedImage(imageUrl);
            setShowDesignerForm(false); // סוגר את טופס הגרפיקאית למניעת בלבול
            setTimeout(() => {
                window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
            }, 100);
        } catch (error) {
            console.error("Error uploading image:", error);
            alert(error?.message || "הייתה שגיאה בהעלאת התמונה.");
        } finally {
            setIsUploading(false);
        }
    };

    // ביטול ומחיקת התמונה המוכנה שהועלתה במסלול הישיר
    const handleRemoveUploadedImage = () => {
        setUploadedImage(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // טיפול בקובץ המצורף עבור הגרפיקאית
    const handleDesignerFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        e.target.value = '';
        setIsDesignerUploading(true);
        try {
            const imageUrl = await uploadImageToCloudinary(file);
            setDesignerDetails((prev) => ({ ...prev, referenceImage: imageUrl }));
        } catch (error) {
            console.error("Designer reference upload failed:", error);
            alert(error?.message || "העלאת הקובץ נכשלה.");
        } finally {
            setIsDesignerUploading(false);
        }
    };

    // מחיקת התמונה שצורפה לגרפיקאית
    const handleRemoveDesignerImage = () => {
        setDesignerDetails({ ...designerDetails, referenceImage: null });
        if (designerFileRef.current) designerFileRef.current.value = '';
    };

    return (
        <div className="min-h-screen bg-[#faf8f6] pb-20" dir="rtl">
            {/* Hero Banner */}
            <div className="w-full relative">
                <div
                    className="relative h-[240px] sm:h-[320px] bg-cover bg-center flex items-center justify-center text-white"
                    style={{ backgroundImage: `url(${heroBgImage})`, backgroundColor: '#a39589' }}
                >
                    <div className="absolute inset-0 bg-black/20"></div>
                    <h1 className="relative z-10 text-[42px] sm:text-[50px] font-bold text-center text-white tracking-wide drop-shadow-sm" style={{ fontFamily: "'Noto Sans Hebrew', sans-serif" }}>
                        {product.name}
                    </h1>
                    <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0] rotate-180">
                        <svg className="relative block w-[calc(100%+1.3px)] h-[50px] md:h-[70px]" viewBox="0 0 1200 120" preserveAspectRatio="none">
                            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" fill="#faf8f6"></path>
                        </svg>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="relative py-12 px-4">
                <div className="max-w-4xl mx-auto relative">
                    <button
                        onClick={() => navigate(-1)}
                        className="absolute -top-8 right-0 flex items-center gap-2 text-gray-500 hover:text-[#f2665e] transition-colors font-medium text-sm sm:text-base cursor-pointer"
                    >
                        <ArrowLeft size={18} className="rotate-180" /> חזרה למוצרים
                    </button>

                    <div className="space-y-8 mt-4">
                        {/* כרטיס מוצר ראשי */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
                            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                                <div className="w-full md:w-64 flex justify-center">
                                    <img
                                        src={product.image}
                                        alt={product.name}
                                        className="w-full max-w-[260px] h-48 object-cover rounded-xl bg-gray-50 border border-gray-100 shadow-sm"
                                    />
                                </div>

                                <div className="flex-1 text-right w-full flex flex-col justify-between min-h-[12rem]">
                                    <div>
                                        <h2 className="text-3xl font-bold text-[#f2665e] mb-2">{product.name}</h2>
                                        <div className="mb-6">
                                            {magnetProduct ? (
                                                <>
                                                    <span className="text-2xl font-bold text-gray-900">{selectedMagnetSize.price} ₪</span>
                                                    <p className="text-sm text-gray-500 mt-1">מחיר לפי גודל מגנט: {selectedMagnetSize.label} ס&quot;מ</p>
                                                </>
                                            ) : (
                                                <span className="text-2xl font-bold text-gray-900">{product.price} ₪</span>
                                            )}
                                            {!simpleProduct && !magnetProduct && (product.printWidth || product.printHeight) && (
                                                <p className="text-sm text-[#f2665e] font-medium mt-2">
                                                    משטח הדפסה: {product.printWidth ?? 12} × {product.printHeight ?? 18} ס&quot;מ
                                                </p>
                                            )}
                                            {!simpleProduct && !magnetProduct && (
                                                <p className="text-sm text-gray-500 mt-1">עיצוב אישי ומקצועי על ידי הגרפיקאית שלנו בתוספת 15 ₪ בלבד</p>
                                            )}
                                        </div>
                                    </div>

                                    {simpleProduct && (
                                        <button
                                            onClick={handleSimpleAddToCart}
                                            className="w-full max-w-sm py-3 bg-[#f2665e] hover:bg-[#d95248] text-white rounded-full text-sm font-bold transition-all shadow-sm cursor-pointer"
                                        >
                                            הוסף לסל
                                        </button>
                                    )}

                                    {magnetProduct && (
                                        <div className="space-y-4 w-full">
                                            <div>
                                                <p className="text-sm font-bold text-gray-700 mb-2">בחרו גודל מגנט:</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {MAGNET_SIZES.map((size) => (
                                                        <button
                                                            key={size.label}
                                                            type="button"
                                                            onClick={() => setSelectedMagnetSize(size)}
                                                            className={`px-4 py-2 rounded-full text-sm font-bold border transition-all cursor-pointer ${
                                                                selectedMagnetSize.label === size.label
                                                                    ? 'bg-[#f2665e] text-white border-[#f2665e]'
                                                                    : 'bg-white text-[#f2665e] border-[#f2665e]/30 hover:bg-[#f2665e]/10'
                                                            }`}
                                                        >
                                                            {size.label} — {size.price} ₪
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="w-full max-w-sm space-y-4">
                                                <button
                                                    type="button"
                                                    onClick={() => magnetFileRef.current?.click()}
                                                    disabled={isUploading}
                                                    className="w-full py-2 bg-[#f2665e]/10 hover:bg-[#f2665e]/20 text-[#f2665e] rounded-full text-sm font-bold transition-all border border-[#f2665e]/10 cursor-pointer disabled:opacity-50"
                                                >
                                                    {isUploading ? 'מעלה תמונה...' : magnetImage ? 'החליפו תמונה' : 'העלו תמונה למגנט'}
                                                </button>
                                                <input type="file" ref={magnetFileRef} onChange={handleMagnetFileChange} className="hidden" accept="image/*" />
                                                {magnetImage && (
                                                    <div className="relative inline-block">
                                                        <img src={magnetImage} alt="תצוגת מגנט" className="max-w-[200px] rounded-lg border" />
                                                        <button
                                                            type="button"
                                                            onClick={handleRemoveMagnetImage}
                                                            className="absolute -top-2 -left-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-md transition-all cursor-pointer"
                                                            title="מחק תמונה"
                                                            aria-label="מחק תמונה"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                )}
                                                <button
                                                    onClick={handleMagnetAddToCart}
                                                    className="w-full py-3 bg-[#f2665e] hover:bg-[#d95248] text-white rounded-full text-sm font-bold transition-all shadow-sm cursor-pointer"
                                                >
                                                    הוסף לסל {selectedMagnetSize.price} ₪
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {!simpleProduct && !magnetProduct && (
                                    <>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full mt-4">
                                        
                                        {/* כפתור 1: עיצוב עצמי */}
                                        <button
                                            onClick={handleDesignClick}
                                            className="w-full py-2 bg-[#f2665e]/10 hover:bg-[#f2665e]/20 text-[#f2665e] rounded-full text-sm font-bold transition-all text-center border border-[#f2665e]/10 cursor-pointer"
                                        >
                                            עיצוב עצמי באתר
                                        </button>
                                        
                                        {/* כפתור 2: עיצוב גרפיקאית */}
                                        <button
                                            onClick={() => { setShowDesignerForm(!showDesignerForm); setUploadedImage(null); }}
                                            className={`w-full py-2 rounded-full text-sm font-bold transition-all text-center border cursor-pointer ${
                                                showDesignerForm 
                                                ? 'bg-[#f2665e] text-white border-[#f2665e]' 
                                                : 'bg-[#f2665e]/10 hover:bg-[#f2665e]/20 text-[#f2665e] border-[#f2665e]/10'
                                            }`}
                                        >
                                            עיצוב מותאם (גרפיקאית)
                                        </button>

                                        {/* כפתור 3: העלאת תמונה */}
                                        <button
                                            onClick={() => fileInputRef.current.click()}
                                            disabled={isUploading}
                                            className="w-full py-2 bg-[#f2665e] hover:bg-[#d95248] text-white rounded-full text-sm font-bold transition-all disabled:opacity-50 text-center shadow-sm cursor-pointer"
                                        >
                                            {isUploading ? (
                                                <span className="flex items-center justify-center gap-1.5">
                                                    <Loader2 size={16} className="animate-spin" /> מעלה...
                                                </span>
                                            ) : (uploadedImage ? 'החליפו תמונה מוכנה' : 'העלו תמונה מוכנה')}
                                        </button>
                                    </div>

                                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                                    </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* תצוגה מקדימה - מסלול העלאה ישירה (כולל כפתור מחיקה חדש להתחרטות) */}
                        {uploadedImage && !simpleProduct && !magnetProduct && (
                            <div className="animate-fade-in bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
                                <h3 className="text-lg font-bold text-gray-800 mb-4">הקובץ שהעלית להדפסה ישירה:</h3>
                                <div className="flex flex-col items-center gap-4">
                                    <div className="relative group">
                                        <img src={uploadedImage} alt="Uploaded preview" className="max-w-xs w-full h-48 object-contain rounded-lg bg-gray-50 border p-2" />
                                        {/* כפתור מחיקה קטן וצף על התמונה להתחרטות מהירה */}
                                        <button
                                            type="button"
                                            onClick={handleRemoveUploadedImage}
                                            className="absolute -top-2 -left-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-md transition-all cursor-pointer"
                                            title="מחק תמונה והתחרט"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleUploadAddToCart}
                                        className="w-full max-w-xs bg-[#f2665e] hover:bg-[#d95248] text-white font-bold py-2 px-6 rounded-full shadow-sm transition-all text-sm cursor-pointer"
                                    >
                                        הוסף לסל והמשך לקופה
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* טופס בקשת עיצוב מהגרפיקאית */}
                        {showDesignerForm && !simpleProduct && !magnetProduct && (
                            <div className="animate-fade-in bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 space-y-6">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-1">עיצוב מותאם אישית על ידי גרפיקאית</h3>
                                    <p className="text-sm text-gray-500">הסבירו לנו מה אתם רוצים שיופיע, צרפו קובץ במידת הצורך, ואנו נשלח לכם סקיצה לאישור במייל!</p>
                                </div>
                                
                                <form onSubmit={handleDesignerSubmit} className="space-y-5">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {/* שם מלא */}
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1.5">שם מלא:</label>
                                            <div className="relative">
                                                <input required type="text" value={designerDetails.name} onChange={(e) => setDesignerDetails({...designerDetails, name: e.target.value})} className="w-full border border-gray-200 rounded-xl p-3 pl-10 pr-4 focus:ring-2 focus:ring-[#f2665e]/20 focus:border-[#f2665e] outline-none transition-all text-sm" />
                                                <User className="absolute left-3 top-3.5 text-gray-400" size={18} />
                                            </div>
                                        </div>
                                        {/* מייל */}
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1.5">כתובת מייל:</label>
                                            <div className="relative">
                                                <input required type="email" value={designerDetails.email} onChange={(e) => setDesignerDetails({...designerDetails, email: e.target.value})} className="w-full border border-gray-200 rounded-xl p-3 pl-10 pr-4 text-left ltr focus:ring-2 focus:ring-[#f2665e]/20 focus:border-[#f2665e] outline-none transition-all text-sm" />
                                                <Mail className="absolute left-3 top-3.5 text-gray-400" size={18} />
                                            </div>
                                        </div>
                                        {/* טלפון */}
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1.5">טלפון ליצירת קשר:</label>
                                            <div className="relative">
                                                <input required type="tel" value={designerDetails.phone} onChange={(e) => setDesignerDetails({...designerDetails, phone: e.target.value})} className="w-full border border-gray-200 rounded-xl p-3 pl-10 pr-4 text-left ltr focus:ring-2 focus:ring-[#f2665e]/20 focus:border-[#f2665e] outline-none transition-all text-sm" />
                                                <Phone className="absolute left-3 top-3.5 text-gray-400" size={18} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* תיאור הבקשה */}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1.5">תיאור העיצוב המבוקש:</label>
                                        <div className="relative">
                                            <textarea required rows="4" value={designerDetails.description} onChange={(e) => setDesignerDetails({...designerDetails, description: e.target.value})} className="w-full border border-gray-200 rounded-xl p-3 pl-10 pr-4 focus:ring-2 focus:ring-[#f2665e]/20 focus:border-[#f2665e] outline-none transition-all text-sm resize-none" placeholder="לדוגמה: אני רוצה רקע ורוד, בצד אחד להוסיף את התמונה שצירפתי ובצד השני לכתוב באותיות יפות לבנות 'אמא היקרה שלנו'..." />
                                            <FileText className="absolute left-3 top-3.5 text-gray-400" size={18} />
                                        </div>
                                    </div>

                                    {/* הוספת קובץ/תמונה עבור הגרפיקאית */}
                                    <div className="bg-gray-50 rounded-xl p-4 border border-dashed border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                                        <div className="flex items-center gap-3 text-right">
                                            <div className="p-2.5 bg-white rounded-lg border shadow-sm text-gray-500">
                                                <ImageIcon size={20} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-800">רוצים לצרף תמונה או לוגו כבסיס?</p>
                                                <p className="text-xs text-gray-400">הגרפיקאית תשתמש בקובץ זה כדי לבנות את העיצוב שלכם (עד ~10MB, מומלץ תמונות מהטלפון)</p>
                                            </div>
                                        </div>
                                        
                                        <div>
                                            <button
                                                type="button"
                                                onClick={() => designerFileRef.current.click()}
                                                disabled={isDesignerUploading}
                                                className="px-4 py-2 bg-white border border-gray-200 hover:border-gray-300 text-gray-700 rounded-lg text-xs font-bold transition-all flex items-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
                                            >
                                                {isDesignerUploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                                                {designerDetails.referenceImage ? 'החלף קובץ מצורף' : 'בחרו קובץ'}
                                            </button>
                                            <input type="file" ref={designerFileRef} onChange={handleDesignerFileChange} className="hidden" accept="image/*" />
                                        </div>
                                    </div>

                                    {/* תצוגה מקדימה קטנה עם אייקון מחיקה */}
                                    {designerDetails.referenceImage && (
                                        <div className="flex items-center justify-between bg-green-50 text-green-800 p-3 rounded-xl border border-green-100 text-xs max-w-md">
                                            <div className="flex items-center gap-3">
                                                <img src={designerDetails.referenceImage} alt="Reference Preview" className="w-10 h-10 object-cover rounded border bg-white shadow-sm" />
                                                <span className="font-medium">הקובץ הועלה בהצלחה ומצורף לבקשה!</span>
                                            </div>
                                            <button 
                                                type="button"
                                                onClick={handleRemoveDesignerImage}
                                                className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                                                title="מחק תמונה"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    )}

                                    {/* כפתור אישור סופי של הטופס */}
                                    <div className="text-left pt-2">
                                        <button type="submit" className="bg-[#f2665e] hover:bg-[#d95248] text-white font-bold py-2 px-8 rounded-full shadow-sm transition-all text-sm cursor-pointer">
                                            אישור ותוספת לסל (+15 ₪)
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductSelectionPage;