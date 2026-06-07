import { uploadImageToCloudinary } from './cloudinaryUpload';

const CART_THUMB_MAX_WIDTH = 220;
const CART_THUMB_QUALITY = 0.75;
/** Keep cart images small enough for localStorage + API sync */
const MAX_INLINE_DATA_URL = 120_000;

const loadImage = (src) =>
    new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('לא ניתן לטעון תמונה לתצוגה בעגלה'));
        img.src = src;
    });

/** Small JPEG data URL for cart display */
export async function createCartThumbnail(imageSrc) {
    if (!imageSrc) return null;

    const img = await loadImage(imageSrc);
    const scale = Math.min(1, CART_THUMB_MAX_WIDTH / Math.max(img.width, 1));
    const width = Math.round(img.width * scale);
    const height = Math.round(img.height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.getContext('2d').drawImage(img, 0, 0, width, height);

    const dataUrl = await new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (!blob) {
                    reject(new Error('יצירת תמונה ממוזערת נכשלה'));
                    return;
                }
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            },
            'image/jpeg',
            CART_THUMB_QUALITY,
        );
    });

    return dataUrl;
}

/**
 * Returns a cart-safe image URL: Cloudinary link when possible,
 * otherwise a compressed inline thumbnail.
 */
export async function prepareCartDisplayImage(image) {
    if (!image || typeof image !== 'string') return null;
    if (image.startsWith('http')) return image;
    if (!image.startsWith('data:')) return image;

    if (image.length <= MAX_INLINE_DATA_URL) return image;

    try {
        const res = await fetch(image);
        const blob = await res.blob();
        const file = new File([blob], 'cart-thumb.jpg', {
            type: blob.type || 'image/jpeg',
        });
        return await uploadImageToCloudinary(file);
    } catch (error) {
        console.warn('Cart thumb Cloudinary upload failed, using compressed preview:', error);
        return createCartThumbnail(image);
    }
}
