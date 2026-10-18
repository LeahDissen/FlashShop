/** Print sizes for photo development — cm for the customer, inches for internal calculation */

export const DEFAULT_PHOTO_PRINT_SIZE = '10x15';
export const DEFAULT_PHOTO_ORIENTATION = 'landscape';

/** Size catalog (source of truth) */
export const PHOTO_PRINT_SIZE_CATALOG = [
    {
        size: '10x15',
        widthCm: 10,
        heightCm: 15,
        widthIn: 4,
        heightIn: 6,
        name: 'גודל סטנדרט',
        isDefault: true,
        sortOrder: 1,
    },
    {
        size: '13x18',
        widthCm: 13,
        heightCm: 18,
        widthIn: 5,
        heightIn: 7,
        name: 'גודל בינוני',
        sortOrder: 2,
    },
    {
        size: '15x20',
        widthCm: 15,
        heightCm: 20,
        widthIn: 6,
        heightIn: 8,
        name: null,
        sortOrder: 3,
    },
    {
        size: '21x29.7',
        widthCm: 21,
        heightCm: 29.7,
        widthIn: null,
        heightIn: null,
        name: 'איי ארבע',
        sortOrder: 4,
    },
];

export function getPhotoSizeCatalogEntry(sizeStr) {
    if (!sizeStr) return PHOTO_PRINT_SIZE_CATALOG[0];
    const normalized = String(sizeStr).toLowerCase().replace(/×/g, 'x');
    return (
        PHOTO_PRINT_SIZE_CATALOG.find((e) => e.size === normalized) ??
        PHOTO_PRINT_SIZE_CATALOG[0]
    );
}

/** Short size in cm for display, e.g. "10×15" */
export function formatPrintSizeCm(sizeStr) {
    const entry = getPhotoSizeCatalogEntry(sizeStr);
    return `${entry.widthCm}×${entry.heightCm}`;
}

/** Label for the size selection menu — cm only (for the customer) */
export function formatPhotoSizeOptionLabel(entry) {
    const cm = `${entry.widthCm}×${entry.heightCm} ס"מ`;
    if (entry.name) {
        return `${entry.name} — ${cm}`;
    }
    return cm;
}

/** Size options to choose from (the prices themselves come from the price list, not from here) */
export function getPhotoSizeOptions() {
    return [...PHOTO_PRINT_SIZE_CATALOG]
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((entry) => ({
            size: entry.size,
            label: formatPhotoSizeOptionLabel(entry),
            widthCm: entry.widthCm,
            heightCm: entry.heightCm,
            widthIn: entry.widthIn,
            heightIn: entry.heightIn,
        }));
}

/** Parses a print size (e.g. "10x15") — without orientation */
export function parsePrintSize(sizeStr) {
    const entry = getPhotoSizeCatalogEntry(sizeStr);
    return {
        width: entry.widthCm,
        height: entry.heightCm,
        aspect: entry.widthCm / entry.heightCm,
        label: `${entry.widthCm}×${entry.heightCm} ס"מ`,
        widthIn: entry.widthIn,
        heightIn: entry.heightIn,
    };
}

/** Print orientation: portrait or landscape */
export function resolvePrintDimensions(sizeStr, orientation = 'portrait') {
    const base = parsePrintSize(sizeStr);
    const landscape = orientation === 'landscape';

    const shortSide = Math.min(base.width, base.height);
    const longSide = Math.max(base.width, base.height);

    if (landscape) {
        return {
            width: longSide,
            height: shortSide,
            aspect: longSide / shortSide,
            label: `${longSide}×${shortSide} ס"מ · רוחב`,
            orientation: 'landscape',
        };
    }

    return {
        width: shortSide,
        height: longSide,
        aspect: shortSide / longSide,
        label: `${shortSide}×${longSide} ס"מ · אורך`,
        orientation: 'portrait',
    };
}

export function getDefaultOrientation(imageWidth, imageHeight) {
    void imageWidth;
    void imageHeight;
    return DEFAULT_PHOTO_ORIENTATION;
}

export function getImageDimensions(src) {
    return new Promise((resolve) => {
        if (!src) {
            resolve({ w: 0, h: 0 });
            return;
        }
        const img = new Image();
        img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
        img.onerror = () => resolve({ w: 0, h: 0 });
        img.src = src;
    });
}

/** Compact label on the photo card — dimensions in cm only */
export function getCompactPrintSizeLabel(sizeStr, orientation = 'landscape') {
    const print = resolvePrintDimensions(sizeStr, orientation);
    return `${print.width}×${print.height} ס"מ`;
}

export function getPrintSizeLabel(sizeStr, _availableSizes = [], orientation = 'portrait') {
    return getCompactPrintSizeLabel(sizeStr, orientation);
}

/** Zoom crop: scale + pan inside a fixed frame */
export const DEFAULT_CROP = { scale: 1, offsetX: 0, offsetY: 0 };

export function normalizeZoomCrop(crop) {
    if (crop && typeof crop.scale === 'number') {
        return {
            scale: Math.max(1, crop.scale),
            offsetX: crop.offsetX ?? 0,
            offsetY: crop.offsetY ?? 0,
        };
    }
    return { ...DEFAULT_CROP };
}

/** CSS transform for a cover view with zoom and drag */
export function getCropTransformStyle(crop = DEFAULT_CROP, imageAspect, frameAspect) {
    const normalized = normalizeZoomCrop(crop);
    const scale = normalized.scale;
    const offsetX = normalized.offsetX;
    const offsetY = normalized.offsetY;

    const coverScale =
        imageAspect > frameAspect
            ? imageAspect / frameAspect
            : frameAspect / imageAspect;

    const totalScale = coverScale * scale;
    const maxPanX = scale > 1 ? ((totalScale - 1) / totalScale) * 50 : 0;
    const maxPanY = scale > 1 ? ((totalScale - 1) / totalScale) * 50 : 0;

    return {
        transform: `translate(${offsetX * maxPanX}%, ${offsetY * maxPanY}%) scale(${totalScale})`,
        transformOrigin: 'center center',
    };
}

/** Whether the photo's ratio differs from the print ratio (may get cropped) */
export function getCropWarning(imageWidth, imageHeight, printAspect) {
    if (!imageWidth || !imageHeight || !printAspect) return null;

    const imageAspect = imageWidth / imageHeight;
    const ratioDiff = Math.abs(imageAspect - printAspect) / printAspect;

    if (ratioDiff < 0.08) return null;

    const isSquareish = Math.abs(imageAspect - 1) < 0.12;
    const isPortrait = imageAspect < printAspect * 0.85;
    const isLandscape = imageAspect > printAspect * 1.15;

    if (isSquareish) {
        return 'תמונה ריבועית עלולה להיחתך בצדדים או למעלה/למטה — ניתן להתאים בזום.';
    }
    if (isPortrait && printAspect < 1) {
        return 'תמונה צרה עלולה להיחתך — ניתן להקטין או להזיז כדי לראות יותר מהתמונה.';
    }
    if (isLandscape && printAspect > 1) {
        return 'תמונה רחבה עלולה להיחתך — ניתן להתאים בזום.';
    }

    return 'יחס התמונה שונה מגודל ההדפסה — ניתן להקטין, להגדיל ולהזיז את התמונה בתוך המסגרת.';
}
