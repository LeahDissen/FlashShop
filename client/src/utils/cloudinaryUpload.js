const CLOUDINARY_UPLOAD_URL =
    'https://api.cloudinary.com/v1_1/dwqywo11u/image/upload';
const UPLOAD_PRESET = 'ml_default';

/** Cloudinary unsigned uploads are typically capped at ~10MB */
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const MAX_DIMENSION = 2048;
const JPEG_QUALITY = 0.82;

const loadImageFromFile = (file) =>
    new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            URL.revokeObjectURL(url);
            resolve(img);
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('לא ניתן לקרוא את הקובץ'));
        };
        img.src = url;
    });

/**
 * Resize/compress images before upload so uploads are faster and stay under Cloudinary limits.
 */
export async function prepareImageForUpload(file) {
    if (!file?.type?.startsWith('image/')) {
        throw new Error('יש לבחור קובץ תמונה בלבד');
    }

    // Skip compression only for small files (faster upload path)
    if (file.size < 500_000) {
        return file;
    }

    const img = await loadImageFromFile(file);
    let { width, height } = img;
    const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height));
    width = Math.round(width * scale);
    height = Math.round(height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, width, height);

    const blob = await new Promise((resolve, reject) => {
        canvas.toBlob(
            (b) => (b ? resolve(b) : reject(new Error('דחיסת התמונה נכשלה'))),
            'image/jpeg',
            JPEG_QUALITY,
        );
    });

    if (blob.size > MAX_UPLOAD_BYTES) {
        throw new Error(
            'התמונה גדולה מדי גם אחרי דחיסה. נסו תמונה קטנה יותר.',
        );
    }

    const baseName = (file.name || 'image').replace(/\.[^.]+$/, '');
    return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg' });
}

function parseCloudinaryError(data) {
    const msg = data?.error?.message || '';
    if (/file size too large/i.test(msg)) {
        return 'הקובץ גדול מדי (מעל 10MB). נסו תמונה קטנה יותר.';
    }
    if (msg) return msg;
    return 'העלאת הקובץ נכשלה. נסו שוב.';
}

export async function uploadImageToCloudinary(file) {
    const prepared = await prepareImageForUpload(file);
    const formData = new FormData();
    formData.append('file', prepared);
    formData.append('upload_preset', UPLOAD_PRESET);

    const response = await fetch(CLOUDINARY_UPLOAD_URL, {
        method: 'POST',
        body: formData,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(parseCloudinaryError(data));
    }

    return data.secure_url;
}
