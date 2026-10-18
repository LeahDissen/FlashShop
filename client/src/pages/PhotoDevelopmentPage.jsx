import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPage } from '../api/pages';
import { getPhotoPricing } from '../api/photo';
import AdminControls from '../components/AdminControls';
import Gallery from '../components/Gallery';
import Hero from '../components/Hero';
import SmartImageInput from '../components/SmartImageInput';
import { useAdminControl } from '../hooks/useAdminControl';
import { useCartStore } from '../store/cartStore';
import { uploadImageToCloudinary } from '../utils/cloudinaryUpload';
import { uploadFilesInParallel } from '../utils/uploadQueue';
import { blobToFile } from '../utils/cropImage';
import {
    DEFAULT_CROP,
    DEFAULT_PHOTO_PRINT_SIZE,
    getDefaultOrientation,
    formatPrintSizeCm,
    getPhotoSizeOptions,
} from '../utils/printSizes';
import PhotoPrintAdjustModal from '../components/PhotoPrintAdjustModal';
import {
    getAlbumDiscount,
    getNextPricingTierHint,
    getOrderPricing,
    getPhotoUnitPrice,
    getPrintsBySize,
    normalizeSize,
} from '../utils/photoQuantityPricing';

const isPhotoPrintCartItem = (item) => item?.itemType === 'photo-print';

const PhotoDevelopmentPage = ({ onNavigateToEditor }) => {
    const [images, setImages] = useState([]);
    /** מחירון פיתוח התמונות מהשרת; null עד שנטען */
    const [pricing, setPricing] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState('');
    /** התקדמות העלאה מרובה: { done, total, failed } */
    const [uploadProgress, setUploadProgress] = useState(null);
    /** קבצים שנכשלו בהעלאה האחרונה – הלקוח יכול לנסות אותם שוב בלי לבחור מחדש */
    const [failedUploads, setFailedUploads] = useState([]);
    const [adjustImageId, setAdjustImageId] = useState(null);
    const [isCropSaving, setIsCropSaving] = useState(false);
    const addToCart = useCartStore((state) => state.addToCart);
    const repriceItems = useCartStore((state) => state.repriceItems);
    const navigate = useNavigate();

    const adminControls = useAdminControl({
        img: "",
        title: "",
        subtitle: "",
        btnText: "",
    }, "photos");
    const { draft, updateDraft, editMode } = adminControls;

    const loadPricing = useCallback(() => getPhotoPricing()
        .then((data) => {
            setPricing(data);
            return data;
        })
        .catch((err) => {
            console.error("Failed to load photo pricing:", err);
            return null;
        }), []);

    useEffect(() => {
        getPage("photos").then((data) => {
            adminControls.setPage(data);
            adminControls.setDraft(data);
        }).catch(error => console.error("Error fetching main photos page data:", error));
        loadPricing();
    }, []);

    const sizeOptions = useMemo(() => getPhotoSizeOptions(), []);
    const orderPricing = useMemo(
        () => getOrderPricing(images, pricing, DEFAULT_PHOTO_PRINT_SIZE),
        [images, pricing],
    );
    const nextTierHint = useMemo(
        () => getNextPricingTierHint(orderPricing.sizes, pricing, formatPrintSizeCm),
        [orderPricing.sizes, pricing],
    );
    const albumDiscount = useMemo(
        () => getAlbumDiscount(orderPricing.totalPrints, pricing),
        [orderPricing.totalPrints, pricing],
    );

    const toGalleryImage = ({ file, index, url, width, height }) => ({
        id: `${Date.now()}_${index}_${Math.random()}`,
        src: url,
        originalSrc: url,
        alt: file.name,
        quantity: 1,
        size: DEFAULT_PHOTO_PRINT_SIZE,
        crop: { ...DEFAULT_CROP },
        orientation: getDefaultOrientation(width, height),
    });

    const handleFilesSelected = async (files) => {
        const fileList = Array.from(files);
        if (fileList.length === 0) return;

        setIsUploading(true);
        setFailedUploads([]);
        setUploadProgress({ done: 0, total: fileList.length, failed: 0 });
        setUploadStatus('');

        try {
            // כמה תמונות במקביל, כל אחת מצטרפת לגלריה ברגע שהיא מוכנה
            const { failed } = await uploadFilesInParallel(fileList, {
                onProgress: setUploadProgress,
                onUploaded: (result) => setImages((prev) => [...prev, toGalleryImage(result)]),
            });

            if (failed.length > 0) {
                failed.forEach(({ file, error }) => console.error('Error uploading image:', file.name, error));
                setFailedUploads(failed);
            }
        } finally {
            setIsUploading(false);
            setUploadProgress(null);
        }
    };

    const handleRetryFailed = () => handleFilesSelected(failedUploads.map(({ file }) => file));

    const handleSetQuantity = (id, quantity) => {
        const qty = Math.min(9999, Math.max(1, Math.floor(Number(quantity)) || 1));
        setImages((prev) => prev.map((img) => (img.id === id ? { ...img, quantity: qty } : img)));
    };

    const handleRemove = (id) => {
        setImages((prev) => prev.filter((img) => img.id !== id));
    };

    const handleClearAllImages = () => {
        const isConfirmed = window.confirm("האם אתם בטוחים שברצונכם למחוק את כל התמונות?");
        if (!isConfirmed) return;
        setImages([]);
    };

    const handleSizeChange = (id, newSize) => {
        setImages((prev) =>
            prev.map((img) =>
                img.id === id
                    ? { ...img, size: newSize, crop: { ...DEFAULT_CROP }, cropState: null }
                    : img,
            ),
        );
    };

    const handleSaveCrop = async (id, payload) => {
        const { crop, cropState, orientation, croppedBlob, fileName, size } = payload;
        setIsCropSaving(true);
        setIsUploading(true);
        setUploadStatus('שומר תמונה חתוכה...');

        try {
            const file = blobToFile(croppedBlob, fileName);
            const secureUrl = await uploadImageToCloudinary(file);

            setImages((prev) =>
                prev.map((img) =>
                    img.id === id
                        ? {
                            ...img,
                            src: secureUrl,
                            originalSrc: img.originalSrc || img.src,
                            crop,
                            cropState,
                            size: size || img.size,
                            orientation: orientation ?? img.orientation,
                            frameSelection: payload.frameSelection ?? null,
                            frameOverlaySrc: payload.frameOverlaySrc || '',
                            captions: Array.isArray(payload.captions) ? payload.captions : [],
                        }
                        : img,
                ),
            );
            setAdjustImageId(null);
        } catch (error) {
            console.error('Error saving cropped image:', error);
            alert('שגיאה בשמירת התמונה החתוכה. נסו שוב.');
            throw error;
        } finally {
            setIsCropSaving(false);
            setIsUploading(false);
            setUploadStatus('');
        }
    };

    const handleToggleOrientation = (id) => {
        setImages((prev) =>
            prev.map((img) => {
                if (img.id !== id) return img;
                const next = img.orientation === 'landscape' ? 'portrait' : 'landscape';
                return { ...img, orientation: next, crop: { ...DEFAULT_CROP } };
            }),
        );
    };

    const adjustImage = adjustImageId
        ? images.find((img) => img.id === adjustImageId)
        : null;

    const handleSendOrder = async () => {
        if (images.length === 0) return;
        // המחירון נטען ברקע; אם הטעינה נכשלה מנסים שוב לפני שממשיכים
        const activePricing = pricing || await loadPricing();
        if (!activePricing) {
            alert('לא הצלחנו לטעון את מחירי ההדפסה. נא לבדוק את החיבור לאינטרנט ולנסות שוב.');
            return;
        }

        // מדרגת המחיר נקבעת לפי כל התמונות מאותו גודל – גם אלה שכבר נמצאות בסל מפעם קודמת
        const photosInCart = useCartStore.getState().cartItems.filter(isPhotoPrintCartItem);
        const printsBySize = getPrintsBySize([...images, ...photosInCart], DEFAULT_PHOTO_PRINT_SIZE);
        const cartItems = images.map((img) => {
            const size = img.size || DEFAULT_PHOTO_PRINT_SIZE;
            const qty = Math.max(1, img.quantity);
            const unitPrice = getPhotoUnitPrice(activePricing, size, printsBySize[normalizeSize(size)]);
            return {
                id: img.id,
                itemType: 'photo-print',
                size,
                name: `פיתוח תמונה ${size} (${img.alt})`,
                price: unitPrice,
                quantity: qty,
                image: img.src,
                crop: img.crop,
                orientation: img.orientation ?? 'landscape',
                customDesign: {
                    printSizeCm: size,
                    frameSelection: img.frameSelection || undefined,
                    captions: Array.isArray(img.captions) && img.captions.length
                        ? img.captions.map((caption) => ({
                            content: caption.content,
                            fontFamily: caption.fontFamily,
                            fontSize: caption.fontSize,
                            color: caption.color,
                        }))
                        : undefined,
                },
            };
        });

        addToCart(cartItems);
        repriceItems((item) => (isPhotoPrintCartItem(item)
            ? getPhotoUnitPrice(activePricing, item.size, printsBySize[normalizeSize(item.size)])
            : undefined));
        navigate('/cart');
    };

    const EditContent = (
        <div className="bg-white p-6 rounded-lg space-y-4 text-right" dir="rtl">
            <h3 className="font-bold text-lg border-b pb-2">עריכת עמוד פיתוח תמונות</h3>

            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">תמונת רקע עליונה (URL):</label>
                <SmartImageInput
                    value={draft.img}
                    onChange={(url) => updateDraft({ img: url })}
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
                onSetQuantity={handleSetQuantity}
                onRemove={handleRemove}
                onClearAll={handleClearAllImages}
                onSizeChange={handleSizeChange}
                onAdjustPrint={setAdjustImageId}
                onToggleOrientation={handleToggleOrientation}
                onSendOrder={handleSendOrder}
                availableSizes={sizeOptions}
                pricing={pricing}
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
                    onSave={handleSaveCrop}
                    onClose={() => setAdjustImageId(null)}
                    isSaving={isCropSaving}
                    availableSizes={sizeOptions}
                />
            )}

            {!isUploading && failedUploads.length > 0 && (
                <div
                    className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:right-4 z-[150] max-w-md bg-white border border-red-200 rounded-2xl shadow-xl p-4 text-right"
                    dir="rtl"
                    role="alert"
                >
                    <p className="font-bold text-red-700 mb-1">{failedUploads.length} תמונות לא הועלו</p>
                    <ul className="text-xs text-gray-600 max-h-24 overflow-y-auto mb-3 space-y-0.5">
                        {failedUploads.map(({ file, error }) => (
                            <li key={`${file.name}-${file.size}`}>{file.name} — {error?.message || 'שגיאה'}</li>
                        ))}
                    </ul>
                    <div className="flex gap-2 justify-end">
                        <button
                            type="button"
                            onClick={() => setFailedUploads([])}
                            className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                        >
                            סגירה
                        </button>
                        <button
                            type="button"
                            onClick={handleRetryFailed}
                            className="px-3 py-1.5 text-sm rounded-lg bg-[#f2665e] text-white font-bold hover:bg-[#d95248]"
                        >
                            לנסות שוב
                        </button>
                    </div>
                </div>
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
                        {uploadProgress ? (
                            <>
                                <div
                                    className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden mb-2"
                                    role="progressbar"
                                    aria-valuemin={0}
                                    aria-valuemax={uploadProgress.total}
                                    aria-valuenow={uploadProgress.done}
                                >
                                    <div
                                        className="h-full bg-[#f2665e] transition-all duration-300"
                                        style={{ width: `${Math.round((uploadProgress.done / Math.max(1, uploadProgress.total)) * 100)}%` }}
                                    />
                                </div>
                                <p className="text-gray-600 text-sm">
                                    {uploadProgress.done} מתוך {uploadProgress.total} תמונות
                                    {uploadProgress.failed > 0 && (
                                        <span className="text-red-600"> · {uploadProgress.failed} נכשלו</span>
                                    )}
                                </p>
                            </>
                        ) : (
                            <p className="text-gray-600 text-sm">{uploadStatus}</p>
                        )}
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