import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPage } from '../api/pages';
import { getPhotoPrices } from '../api/photo';
import AdminControls from '../components/AdminControls';
import Gallery from '../components/Gallery';
import Hero from '../components/Hero';
import { useAdminControl } from '../hooks/useAdminControl';
import { useCartStore } from '../store/cartStore';
import { uploadImageToCloudinary } from '../utils/cloudinaryUpload';
import { DEFAULT_CROP } from '../utils/printSizes';
import PhotoPrintAdjustModal from '../components/PhotoPrintAdjustModal';
import {
    getAlbumDiscount,
    getNextPricingTierHint,
    getOrderPricing,
    getUnitPriceByQuantity,
} from '../utils/photoQuantityPricing';

const PhotoDevelopmentPage = ({ onNavigateToEditor }) => {
    const [images, setImages] = useState([]);
    const [priceList, setPriceList] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState('');
    const [adjustImageId, setAdjustImageId] = useState(null);
    const addToCart = useCartStore((state) => state.addToCart);
    const navigate = useNavigate();

    const adminControls = useAdminControl({
        img: "",
        title: "",
        subtitle: "",
        btnText: "",
    }, "photos");
    const { draft, updateDraft, editMode } = adminControls;

    useEffect(() => {
        getPage("photos").then((data) => {
            adminControls.setPage(data);
            adminControls.setDraft(data);
        }).catch(error => console.error("Error fetching main photos page data:", error));
        const fetchPrices = async () => {
            try {
                const data = await getPhotoPrices();
                setPriceList(data);
            } catch (err) {
                console.error("Failed to load prices from DB:", err);
                setPriceList([]);
            }
        };
        fetchPrices();
    }, []);

    const orderPricing = useMemo(() => getOrderPricing(images), [images]);
    const nextTierHint = useMemo(
        () => getNextPricingTierHint(orderPricing.totalPrints),
        [orderPricing.totalPrints],
    );
    const albumDiscount = useMemo(
        () => getAlbumDiscount(orderPricing.totalPrints),
        [orderPricing.totalPrints],
    );

    const handleFilesSelected = async (files) => {
        const fileList = Array.from(files);
        if (fileList.length === 0) return;

        const defaultSize = priceList.length > 0 ? priceList[0].size : '10x15';
        const total = fileList.length;

        setIsUploading(true);
        setUploadStatus(
            total === 1
                ? 'מעלה תמונה, אנא המתינו...'
                : `מעלה ${total} תמונות, אנא המתינו...`,
        );

        const newImages = [];
        let failedCount = 0;

        try {
            for (let i = 0; i < fileList.length; i++) {
                const file = fileList[i];
                setUploadStatus(`מעלה תמונה ${i + 1} מתוך ${total}...`);

                try {
                    const secureUrl = await uploadImageToCloudinary(file);
                    newImages.push({
                        id: `${Date.now()}_${i}_${Math.random()}`,
                        src: secureUrl,
                        alt: file.name,
                        quantity: 1,
                        size: defaultSize,
                        crop: { ...DEFAULT_CROP },
                    });
                } catch (error) {
                    failedCount += 1;
                    console.error('Error uploading image:', error);
                }
            }

            if (newImages.length > 0) {
                setImages((prev) => [...prev, ...newImages]);
            }

            if (failedCount > 0) {
                const uploadedCount = newImages.length;
                alert(
                    uploadedCount > 0
                        ? `${uploadedCount} תמונות הועלו בהצלחה. ${failedCount} תמונות נכשלו.`
                        : 'העלאת התמונות נכשלה. נסו תמונות קטנות יותר.',
                );
            }
        } finally {
            setIsUploading(false);
            setUploadStatus('');
        }
    };

    const handleQuantityChange = (id, delta) => {
        setImages(prev => prev.map(img =>
            img.id === id ? { ...img, quantity: Math.max(1, img.quantity + delta) } : img
        ));
    };

    const handleRemove = (id) => {
        setImages(prev => prev.filter(img => img.id !== id));
    };

    const handleClearAllImages = () => {
        const isConfirmed = window.confirm("האם את בטוחה שברצונך למחוק את כל התמונות?");
        if (!isConfirmed) return;
        setImages([]);
    };

    const handleSizeChange = (id, newSize) => {
        setImages((prev) =>
            prev.map((img) =>
                img.id === id
                    ? { ...img, size: newSize, crop: { ...DEFAULT_CROP } }
                    : img,
            ),
        );
        setAdjustImageId(id);
    };

    const handleSaveCrop = (id, crop) => {
        setImages((prev) =>
            prev.map((img) => (img.id === id ? { ...img, crop } : img)),
        );
    };

    const adjustImage = adjustImageId
        ? images.find((img) => img.id === adjustImageId)
        : null;

    const handleSendOrder = () => {
        if (images.length === 0) return;

        const defaultSize = priceList.length > 0 ? priceList[0].size : '10x15';
        const unitPrice = getUnitPriceByQuantity(orderPricing.totalPrints);

        const cartItems = images.map((img) => {
            const size = img.size || defaultSize;
            const qty = Math.max(1, img.quantity);
            return {
                id: img.id,
                size,
                name: `פיתוח תמונה ${size} (${img.alt})`,
                price: unitPrice,
                quantity: qty,
                image: img.src,
                crop: img.crop,
            };
        });

        addToCart(cartItems);
        navigate('/cart');
    };

    const EditContent = (
        <div className="bg-white p-6 rounded-lg space-y-4 text-right" dir="rtl">
            <h3 className="font-bold text-lg border-b pb-2">עריכת עמוד פיתוח תמונות</h3>

            <div>
                <label className="block text-sm font-bold text-gray-700">תמונת רקע עליונה (URL):</label>
                <input
                    type="text"
                    value={draft.img}
                    onChange={(e) => updateDraft({ img: e.target.value })}
                    className="w-full border p-2 rounded ltr"
                />
            </div>

            <div>
                <label className="block text-sm font-bold text-gray-700">כותרת ראשית:</label>
                <input
                    type="text"
                    value={draft.title}
                    onChange={(e) => updateDraft({ title: e.target.value })}
                    className="w-full border p-2 rounded"
                />
            </div>

            <div>
                <label className="block text-sm font-bold text-gray-700">כותרת משנית:</label>
                <textarea
                    value={draft.subtitle}
                    onChange={(e) => updateDraft({ subtitle: e.target.value })}
                    className="w-full border p-2 rounded h-20"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-bold text-gray-700">טקסט כפתור ראשי:</label>
                    <input
                        type="text"
                        value={draft.btnText}
                        onChange={(e) => updateDraft({ btnText: e.target.value })}
                        className="w-full border p-2 rounded"
                    />
                </div>
            </div>
        </div>
    );

    const ViewContent = (
        <div className="min-h-screen bg-white">
            <Hero
                onStartEditor={onNavigateToEditor}
                onFilesSelected={handleFilesSelected}
                backgroundImage={draft.img}
                title={draft.title}
                subtitle={draft.subtitle}
                btnText={draft.btnText}
                isUploading={isUploading}
            />
            <Gallery
                images={images}
                onQuantityChange={handleQuantityChange}
                onRemove={handleRemove}
                onClearAll={handleClearAllImages}
                onSizeChange={handleSizeChange}
                onAdjustPrint={setAdjustImageId}
                onSendOrder={handleSendOrder}
                availableSizes={priceList}
                orderPricing={orderPricing}
                nextTierHint={nextTierHint}
                albumDiscount={albumDiscount}
            />
        </div>
    );

    return (
        <AdminControls
            editMode={editMode}
            previewContent={EditContent}
            adminControls={adminControls}
        >
            {ViewContent}

            {adjustImage && (
                <PhotoPrintAdjustModal
                    image={adjustImage}
                    availableSizes={priceList}
                    onSave={handleSaveCrop}
                    onClose={() => setAdjustImageId(null)}
                />
            )}

            {isUploading && (
                <div
                    className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                    dir="rtl"
                    role="alertdialog"
                    aria-live="polite"
                    aria-busy="true"
                    aria-label="מעלה תמונות"
                >
                    <div className="bg-white rounded-2xl shadow-2xl px-8 py-10 max-w-sm w-full text-center">
                        <svg
                            className="animate-spin h-14 w-14 text-[#f2665e] mb-5 mx-auto"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                        >
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                            />
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                        </svg>
                        <h2 className="text-xl font-bold text-gray-800 mb-2">מעלה תמונות</h2>
                        <p className="text-gray-600 text-sm">{uploadStatus}</p>
                        <p className="text-gray-400 text-xs mt-3">
                            התמונות נדחסות ומועלות — אל תסגרו את הדף
                        </p>
                    </div>
                </div>
            )}
        </AdminControls>
    );
};

export default PhotoDevelopmentPage;