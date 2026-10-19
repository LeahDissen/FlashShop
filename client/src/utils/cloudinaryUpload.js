import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from '../config/api';

const CLOUDINARY_UPLOAD_URL =
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
const UPLOAD_PRESET = CLOUDINARY_UPLOAD_PRESET;

/** Cloudinary unsigned uploads are capped at 10MB per image */
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
/** Only for files over the cap: re-encode at full size first, and shrink only if that is not enough */
const OVERSIZE_JPEG_QUALITIES = [0.95, 0.9, 0.85];
const OVERSIZE_SHRINK_STEP = 0.9;

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

const encodeJpeg = (img, width, height, quality) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.getContext('2d').drawImage(img, 0, 0, width, height);
    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (b) => (b ? resolve(b) : reject(new Error('דחיסת התמונה נכשלה'))),
            'image/jpeg',
            quality,
        );
    });
};

/**
 * Photos are printed, so the customer's original file is uploaded untouched.
 * Only a file over Cloudinary's 10MB cap is re-encoded, keeping as much of its size and quality as fits.
 */
export async function prepareImageForUpload(file) {
    if (!file?.type?.startsWith('image/')) {
        throw new Error('יש לבחור קובץ תמונה בלבד');
    }
    if (file.size <= MAX_UPLOAD_BYTES) {
        return file;
    }

    const img = await loadImageFromFile(file);
    let width = img.naturalWidth || img.width;
    let height = img.naturalHeight || img.height;
    let blob = null;

    for (let attempt = 0; attempt < 12; attempt += 1) {
        for (const quality of OVERSIZE_JPEG_QUALITIES) {
            blob = await encodeJpeg(img, width, height, quality);
            if (blob.size <= MAX_UPLOAD_BYTES) {
                const baseName = (file.name || 'image').replace(/\.[^.]+$/, '');
                return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg' });
            }
        }
        width = Math.round(width * OVERSIZE_SHRINK_STEP);
        height = Math.round(height * OVERSIZE_SHRINK_STEP);
    }

    throw new Error('התמונה גדולה מדי. נסו תמונה קטנה יותר.');
}

function parseCloudinaryError(data) {
    const msg = data?.error?.message || '';
    if (/file size too large/i.test(msg)) {
        return 'הקובץ גדול מדי (מעל 10MB). נסו תמונה קטנה יותר.';
    }
    if (msg) return msg;
    return 'העלאת הקובץ נכשלה. נסו שוב.';
}

/** An error marked with whether it is worth retrying (network/server) or not (corrupt file, too large, 4xx) */
const uploadError = (message, retryable) => Object.assign(new Error(message), { retryable });

/**
 * Uploads an image and also returns the dimensions Cloudinary reports –
 * saves downloading every image again just to measure it.
 */
export async function uploadImageDetailed(file) {
    let prepared;
    try {
        prepared = await prepareImageForUpload(file);
    } catch (error) {
        throw uploadError(error.message, false);
    }

    const formData = new FormData();
    formData.append('file', prepared);
    formData.append('upload_preset', UPLOAD_PRESET);

    let response;
    try {
        response = await fetch(CLOUDINARY_UPLOAD_URL, { method: 'POST', body: formData });
    } catch {
        throw uploadError('בעיית רשת בזמן ההעלאה. נסו שוב.', true);
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw uploadError(parseCloudinaryError(data), response.status >= 500 || response.status === 429);
    }

    return { url: data.secure_url, width: data.width, height: data.height };
}

export async function uploadImageToCloudinary(file) {
    const { url } = await uploadImageDetailed(file);
    return url;
}

/** Document (PDF) – Cloudinary accepts it with the same preset; returns a direct download link */
export async function uploadDocumentToCloudinary(file) {
    if (file?.type !== 'application/pdf') {
        throw new Error('יש לבחור קובץ PDF');
    }
    if (file.size > MAX_UPLOAD_BYTES) {
        throw new Error('הקובץ גדול מדי (מעל 10MB).');
    }
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);

    const response = await fetch(CLOUDINARY_UPLOAD_URL.replace('/image/upload', '/auto/upload'), {
        method: 'POST',
        body: formData,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(parseCloudinaryError(data));
    }
    return data.secure_url;
}

const FONT_EXTENSIONS = ['otf', 'ttf', 'woff', 'woff2'];
const MAX_FONT_BYTES = 5 * 1024 * 1024;

/** Uploads a font file (OTF/TTF/WOFF/WOFF2) as a raw file and returns its URL */
export async function uploadFontToCloudinary(file) {
    const extension = String(file?.name || '').split('.').pop().toLowerCase();
    if (!FONT_EXTENSIONS.includes(extension)) {
        throw new Error('אפשר להעלות רק קובצי גופן: OTF, TTF, WOFF או WOFF2');
    }
    if (file.size > MAX_FONT_BYTES) {
        throw new Error('קובץ הגופן גדול מדי (מעל 5MB)');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/raw/upload`, {
        method: 'POST',
        body: formData,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(parseCloudinaryError(data));
    }
    return data.secure_url;
}
