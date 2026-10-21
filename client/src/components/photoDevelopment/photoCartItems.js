/** The photos chosen on the photo development page, as gallery items and as cart lines */
import { DEFAULT_CROP, DEFAULT_PHOTO_PRINT_SIZE, getDefaultOrientation } from '../../utils/printSizes';
import { getPhotoUnitPrice, getPrintsBySize, normalizeSize } from '../../utils/photoQuantityPricing';

export const isPhotoPrintCartItem = (item) => item?.itemType === 'photo-print';

/** A just-uploaded photo in the gallery: one print in the default size, oriented like the photo */
export const toGalleryImage = ({ file, index, url, width, height }) => ({
    id: `${Date.now()}_${index}_${Math.random()}`,
    src: url,
    originalSrc: url,
    alt: file.name,
    quantity: 1,
    size: DEFAULT_PHOTO_PRINT_SIZE,
    crop: { ...DEFAULT_CROP },
    orientation: getDefaultOrientation(width, height),
});

/** A typed number of prints: a whole number from 1 to 9999 */
export const clampPhotoQuantity = (quantity) => Math.min(9999, Math.max(1, Math.floor(Number(quantity)) || 1));

/**
 * The cart lines for the gallery's photos. The price tier is set by all the photos of the same size –
 * including those already in the cart from an earlier round – so `printsBySize` is returned too, to
 * reprice those.
 */
export function buildPhotoCartItems(images, pricing, photosInCart) {
    const printsBySize = getPrintsBySize([...images, ...photosInCart], DEFAULT_PHOTO_PRINT_SIZE);
    const cartItems = images.map((img) => {
        const size = img.size || DEFAULT_PHOTO_PRINT_SIZE;
        const qty = Math.max(1, img.quantity);
        const unitPrice = getPhotoUnitPrice(pricing, size, printsBySize[normalizeSize(size)]);
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
    return { cartItems, printsBySize };
}
