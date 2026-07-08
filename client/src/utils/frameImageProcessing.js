const processedCache = new Map();

const BLACK_CUTOFF = 28;
const ALPHA_CUTOFF = 250;

const loadImage = (src) =>
    new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Failed to load frame image'));
        img.src = src;
    });

const imageHasMeaningfulAlpha = (imageData) => {
    const { data } = imageData;
    let transparentPixels = 0;
    const sampleStep = 4;
    const threshold = Math.floor(data.length / (sampleStep * 400));

    for (let i = 3; i < data.length; i += 4 * sampleStep) {
        if (data[i] < ALPHA_CUTOFF) {
            transparentPixels += 1;
            if (transparentPixels > threshold) return true;
        }
    }
    return false;
};

const convertBlackCutoutToAlpha = (imageData) => {
    const { data } = imageData;
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        if (r <= BLACK_CUTOFF && g <= BLACK_CUTOFF && b <= BLACK_CUTOFF) {
            data[i + 3] = 0;
        }
    }
    return imageData;
};

/**
 * מכין תמונת מסגרת לשכבת overlay: שומר PNG עם אלפא, או ממיר אזורי שחור (cutout) לשקיפות.
 */
export async function prepareFrameImageSrc(src) {
    if (!src) return src;
    if (processedCache.has(src)) return processedCache.get(src);

    try {
        const img = await loadImage(src);
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return src;

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        if (!imageHasMeaningfulAlpha(imageData)) {
            convertBlackCutoutToAlpha(imageData);
            ctx.putImageData(imageData, 0, 0);
        }

        const processed = canvas.toDataURL('image/png');
        processedCache.set(src, processed);
        return processed;
    } catch {
        return src;
    }
}
