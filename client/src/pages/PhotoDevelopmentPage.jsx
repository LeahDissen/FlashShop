import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPage } from '../api/pages';
import { getPhotoPricing } from '../api/photo';
import AdminControls from '../components/AdminControls';
import Gallery from '../components/Gallery';
import Hero from '../components/Hero';
import { useAdminControl } from '../hooks/useAdminControl';
import { useCartStore } from '../store/cartStore';
import { uploadImageToCloudinary } from '../utils/cloudinaryUpload';
import { uploadFilesInParallel } from '../utils/uploadQueue';
import { blobToFile } from '../utils/cropImage';
import FailedUploadsNotice from '../components/photoDevelopment/FailedUploadsNotice';
import PhotoPageEditPanel from '../components/photoDevelopment/PhotoPageEditPanel';
import UploadProgressOverlay from '../components/photoDevelopment/UploadProgressOverlay';
import {
    buildPhotoCartItems,
    clampPhotoQuantity,
    isPhotoPrintCartItem,
    toGalleryImage,
} from '../components/photoDevelopment/photoCartItems';
import {
    DEFAULT_CROP,
    DEFAULT_PHOTO_PRINT_SIZE,
    formatPrintSizeCm,
    getPhotoSizeOptions,
} from '../utils/printSizes';
import PhotoPrintAdjustModal from '../components/PhotoPrintAdjustModal';
import {
    getAlbumDiscount,
    getNextPricingTierHint,
    getOrderPricing,
    getPhotoUnitPrice,
    normalizeSize,
} from '../utils/photoQuantityPricing';
import { clearPhotoDraft, endAlbumDetour, loadPhotoDraft, savePhotoDraft } from '../utils/photoOrderDraft';

/** Photo prints: upload photos, set each one's size, quantity and crop, then add them all to the cart */
const PhotoDevelopmentPage = ({ onNavigateToEditor }) => {
    // The selected photos are kept for the whole visit (e.g. when leaving to pick an album and coming back)
    const [images, setImages] = useState(loadPhotoDraft);
    /** The photo development price list from the server; null until loaded */
    const [pricing, setPricing] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState('');
    /** Multi-upload progress: { done, total, failed } */
    const [uploadProgress, setUploadProgress] = useState(null);
    /** Files that failed in the last upload – the customer can retry them without choosing again */
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

    useEffect(() => {
        savePhotoDraft(images);
    }, [images]);

    // Coming back to the page (even without buying an album) ends the "left to pick an album" detour
    useEffect(endAlbumDetour, []);

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

    const handleFilesSelected = async (files) => {
        const fileList = Array.from(files);
        if (fileList.length === 0) return;

        setIsUploading(true);
        setFailedUploads([]);
        setUploadProgress({ done: 0, total: fileList.length, failed: 0 });
        setUploadStatus('');

        try {
            // A few photos in parallel, each joins the gallery as soon as it is ready
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
        const qty = clampPhotoQuantity(quantity);
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
        // The price list loads in the background; if loading failed, retry before continuing
        const activePricing = pricing || await loadPricing();
        if (!activePricing) {
            alert('לא הצלחנו לטעון את מחירי ההדפסה. נא לבדוק את החיבור לאינטרנט ולנסות שוב.');
            return;
        }

        const photosInCart = useCartStore.getState().cartItems.filter(isPhotoPrintCartItem);
        const { cartItems, printsBySize } = buildPhotoCartItems(images, activePricing, photosInCart);

        addToCart(cartItems);
        repriceItems((item) => (isPhotoPrintCartItem(item)
            ? getPhotoUnitPrice(activePricing, item.size, printsBySize[normalizeSize(item.size)])
            : undefined));
        clearPhotoDraft();
        navigate('/cart');
    };
    return (
        <AdminControls
            editMode={editMode}
            previewContent={<PhotoPageEditPanel draft={draft} updateDraft={updateDraft} />}
            adminControls={adminControls}
        >
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
                <FailedUploadsNotice
                    failedUploads={failedUploads}
                    onClose={() => setFailedUploads([])}
                    onRetry={handleRetryFailed}
                />
            )}

            {isUploading && <UploadProgressOverlay progress={uploadProgress} status={uploadStatus} />}
        </AdminControls>
    );
};

export default PhotoDevelopmentPage;