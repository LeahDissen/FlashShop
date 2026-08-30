const processedCache = new Map();
const punchedCache = new Map();

const BLACK_CUTOFF = 28;
const ALPHA_CUTOFF = 250;
const WHITE_HOLE_THRESHOLD = 200;
const WHITE_CHROMA_MAX = 45;

const loadImage = (src) =>
    new Promise((resolve, reject) => {
        const finish = (img) => resolve(img);
        const fail = () => reject(new Error('Failed to load frame image'));

        if (typeof src === 'string' && (src.startsWith('data:') || src.startsWith('blob:'))) {
            const img = new Image();
            img.onload = () => finish(img);
            img.onerror = fail;
            img.src = src;
            return;
        }

        fetch(src, { mode: 'cors' })
            .then((res) => {
                if (!res.ok) throw new Error('fetch failed');
                return res.blob();
            })
            .then((blob) => {
                const objectUrl = URL.createObjectURL(blob);
                const img = new Image();
                img.onload = () => {
                    URL.revokeObjectURL(objectUrl);
                    finish(img);
                };
                img.onerror = () => {
                    URL.revokeObjectURL(objectUrl);
                    fail();
                };
                img.src = objectUrl;
            })
            .catch(() => {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = () => finish(img);
                img.onerror = fail;
                img.src = src;
            });
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
 * הופך אזורים לבנים בתוך חלונות הקולאז׳ לשקופים,
 * כדי שתמונות מתחת למסגרת יופיעו דרך הריבועים הריקים,
 * בלי למחוק עיטורים צבעוניים שחופפים לחלון.
 */
export async function punchDropzoneHoles(src, dropzones, options = {}) {
    if (!src || !Array.isArray(dropzones) || dropzones.length === 0) return src;

    const whiteThreshold = options.whiteThreshold ?? WHITE_HOLE_THRESHOLD;
    const chromaMax = options.chromaMax ?? WHITE_CHROMA_MAX;
    const cacheKey = `v2::${src}::${JSON.stringify(dropzones.map((z) => [z.x, z.y, z.width, z.height]))}`;
    if (punchedCache.has(cacheKey)) return punchedCache.get(cacheKey);

    try {
        const img = await loadImage(src);
        const width = img.naturalWidth || img.width;
        const height = img.naturalHeight || img.height;
        if (!width || !height) return src;

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return src;

        ctx.drawImage(img, 0, 0, width, height);
        const imageData = ctx.getImageData(0, 0, width, height);
        const { data } = imageData;

        dropzones.forEach((zone) => {
            const x0 = Math.max(0, Math.floor((Number(zone.x) / 100) * width));
            const y0 = Math.max(0, Math.floor((Number(zone.y) / 100) * height));
            const x1 = Math.min(width, Math.ceil(((Number(zone.x) + Number(zone.width)) / 100) * width));
            const y1 = Math.min(height, Math.ceil(((Number(zone.y) + Number(zone.height)) / 100) * height));

            for (let y = y0; y < y1; y += 1) {
                for (let x = x0; x < x1; x += 1) {
                    const i = (y * width + x) * 4;
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];
                    const maxc = Math.max(r, g, b);
                    const minc = Math.min(r, g, b);
                    // לבן / אוף-וויט בלבד – צהוב/אדום של העיטורים נשארים מעל התמונה
                    if (minc >= whiteThreshold && (maxc - minc) <= chromaMax) {
                        data[i + 3] = 0;
                    }
                }
            }
        });

        ctx.putImageData(imageData, 0, 0);
        const punched = canvas.toDataURL('image/png');
        punchedCache.set(cacheKey, punched);
        return punched;
    } catch (err) {
        console.warn('punchDropzoneHoles failed', err);
        return src;
    }
}

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
