/** המרת ס"מ לפיקסלים במסך העורך */
export const CM_TO_PX = 30;
export const MAX_CANVAS_PX = 520;
export const MIN_CANVAS_PX = 200;
export const DEFAULT_WIDTH_CM = 12;
export const DEFAULT_HEIGHT_CM = 18;
export const PRINT_DPI = 300;
/** כמה ס"מ מקטינים ממידות משטח ההדפסה למסגרת הבטוחה (רוחב−1, אורך−1) */
export const SAFE_ZONE_TRIM_CM = 1;

const DEFAULT_TEXT_WIDTH = 280;
const DEFAULT_TEXT_HEIGHT = 64;
const DEFAULT_TEXT_FONT_SIZE = 32;

/** ממיר מחרוזת יחס גובה-רוחב (למשל "4:3") לאובייקט */
export function parseAspectRatio(ratio) {
    if (!ratio) return null;
    const parts = String(ratio).split(':').map(Number);
    if (parts.length === 2 && parts[0] > 0 && parts[1] > 0) {
        return { width: parts[0], height: parts[1] };
    }
    return null;
}

/**
 * מחשב גודל משטח העבודה בעורך לפי מידות ההדפסה שהמנהל הגדיר במוצר.
 * מידות המוצר נשארות קבועות – מסגרות גלובליות מותאמות לתוך המשטח (לא משנות אותו).
 * @param {object|null} product
 * @param {string|null} _frameAspectRatio - נשמר לתאימות לאחור; אינו משנה את מידות המשטח
 * @param {boolean} orientationFlipped - כאשר true, מחליף בין רוחב לאורך (אורך/רוחב)
 * @returns {{ width: number, height: number, widthCm: number, heightCm: number, productWidthCm: number, productHeightCm: number, orientationFlipped: boolean }}
 */
export function getCanvasDimensions(product, _frameAspectRatio = null, orientationFlipped = false) {
    const productWidthCm = Number(product?.printWidth) > 0
        ? Number(product.printWidth)
        : DEFAULT_WIDTH_CM;
    const productHeightCm = Number(product?.printHeight) > 0
        ? Number(product.printHeight)
        : DEFAULT_HEIGHT_CM;

    let widthCm = productWidthCm;
    let heightCm = productHeightCm;

    if (orientationFlipped) {
        widthCm = productHeightCm;
        heightCm = productWidthCm;
    }

    let width = Math.round(widthCm * CM_TO_PX);
    let height = Math.round(heightCm * CM_TO_PX);

    const maxSide = Math.max(width, height);
    if (maxSide > MAX_CANVAS_PX) {
        const scale = MAX_CANVAS_PX / maxSide;
        width = Math.round(width * scale);
        height = Math.round(height * scale);
    }

    width = Math.max(MIN_CANVAS_PX, width);
    height = Math.max(MIN_CANVAS_PX, height);

    return {
        width,
        height,
        widthCm,
        heightCm,
        productWidthCm,
        productHeightCm,
        orientationFlipped: Boolean(orientationFlipped),
    };
}

export function formatPrintSizeLabel(widthCm, heightCm) {
    return `${widthCm} × ${heightCm} ס"מ`;
}

/** ממיר ס"מ לפיקסלים על משטח העורך (מתחשב בקנה מידה כשהמשטח מוקטן) */
export function cmToCanvasPx(cm, canvasWidthPx, widthCm) {
    if (!widthCm || widthCm <= 0) return Math.round(cm * CM_TO_PX);
    return Math.round((canvasWidthPx / widthCm) * cm);
}

/** מפתח לשמירת טיוטה – מפריד בין מוצרים, מידות, כיוון ומסגרות שונות */
export function getCanvasStorageKey(product, dims, frameAspectRatio = null, orientationFlipped = false) {
    const id = product?._id || product?.id || 'no-product';
    const framePart = frameAspectRatio
        ? `_ar${String(frameAspectRatio).replace(':', 'x')}`
        : '';
    const orientPart = orientationFlipped ? '_flip' : '';
    return `${id}_${dims.widthCm}x${dims.heightCm}${framePart}${orientPart}`;
}

export function centerPosition(elementWidth, elementHeight, canvasWidth, canvasHeight) {
    return {
        left: Math.max(0, Math.round((canvasWidth - elementWidth) / 2)),
        top: Math.max(0, Math.round((canvasHeight - elementHeight) / 2)),
    };
}

/** ממרכז אלמנט בתוך אזור הבטוח (בתוך הקו המקווקו) */
export function centerInSafeZone(elementWidth, elementHeight, dims) {
    const safe = getSafeInnerSizePx(dims);
    const marginX = Math.round((dims.width - safe.width) / 2);
    const marginY = Math.round((dims.height - safe.height) / 2);
    return {
        left: marginX + Math.max(0, Math.round((safe.width - elementWidth) / 2)),
        top: marginY + Math.max(0, Math.round((safe.height - elementHeight) / 2)),
    };
}

function getSafeInnerSizePx(dims) {
    const safeWidthCm = Math.max(1, (dims.widthCm || 0) - SAFE_ZONE_TRIM_CM);
    const safeHeightCm = Math.max(1, (dims.heightCm || 0) - SAFE_ZONE_TRIM_CM);
    return {
        width: cmToCanvasPx(safeWidthCm, dims.width, dims.widthCm),
        height: cmToCanvasPx(safeHeightCm, dims.height, dims.heightCm),
    };
}

/** גודל תיבת טקסט ברירת מחדל – מתאים למשטחים קטנים כדי שלא יחרוג מאזור הבטוח */
export function getDefaultTextBoxMetrics(dims) {
    const safe = getSafeInnerSizePx(dims);
    const width = Math.max(60, Math.min(DEFAULT_TEXT_WIDTH, Math.floor(safe.width * 0.82)));
    const height = Math.max(28, Math.min(DEFAULT_TEXT_HEIGHT, Math.floor(safe.height * 0.18)));
    const fontSize = Math.max(
        10,
        Math.min(DEFAULT_TEXT_FONT_SIZE, Math.round(DEFAULT_TEXT_FONT_SIZE * (width / DEFAULT_TEXT_WIDTH))),
    );
    return { width, height, fontSize };
}

/** אלמנט טקסט ברירת מחדל במרכז המשטח */
export function createDefaultTextElement(dims) {
    const { width, height, fontSize } = getDefaultTextBoxMetrics(dims);
    const { left, top } = centerInSafeZone(width, height, dims);

    return {
        id: `text_${Date.now()}`,
        type: 'text',
        fontFamily: 'Arial',
        fontSize,
        color: '#333333',
        bold: false,
        italic: false,
        underline: false,
        textAlign: 'center',
        direction: 'rtl',
        content: 'טקסט ניתן לעריכה',
        width,
        height,
        top,
        left,
        backgroundColor: 'transparent',
        borderColor: '#000000',
        borderWidth: 0,
        textShadowEnabled: false,
        textShadowColor: '#000000',
        textShadowBlur: 2,
        textShadowOffsetX: 2,
        textShadowOffsetY: 2,
        opacity: 1,
        rotation: 0,
        locked: false,
    };
}

/**
 * כתובית לתמונה – תיבת טקסט ברוחב האזור הבטוח, ממוקמת בתחתית המשטח.
 * ברירות המחדל (גופן, גודל, צבע, טקסט) מגיעות מהגדרות שהמנהלת עורכת.
 */
export function createCaptionTextElement(dims, captionDefaults = {}) {
    const safe = getSafeInnerSizePx(dims);
    const marginX = Math.round((dims.width - safe.width) / 2);
    const marginY = Math.round((dims.height - safe.height) / 2);

    const width = safe.width;
    const fontSize = Math.max(
        10,
        Math.min(
            Number(captionDefaults.fontSize) || 24,
            Math.round((Number(captionDefaults.fontSize) || 24) * (width / DEFAULT_TEXT_WIDTH)) || 24,
        ),
    );
    const height = Math.max(24, Math.round(fontSize * 1.6));

    return {
        ...createDefaultTextElement(dims),
        id: `caption_${Date.now()}`,
        role: 'caption',
        content: captionDefaults.placeholder || 'כתובית לתמונה',
        fontFamily: captionDefaults.fontFamily || 'Rubik',
        color: captionDefaults.color || '#FFFFFF',
        fontSize,
        width,
        height,
        left: marginX,
        top: Math.max(marginY, dims.height - marginY - height),
        textAlign: 'center',
        textShadowEnabled: true,
        textShadowColor: '#000000',
        textShadowBlur: 4,
        textShadowOffsetX: 1,
        textShadowOffsetY: 1,
    };
}

const DEFAULT_TEXT_CONTENT = 'טקסט ניתן לעריכה';

/** מנקה טיוטות שבורות ומחזיר תיבת טקסט אחת במרכז */
export function normalizeEditorElements(elements, dims) {
    if (!Array.isArray(elements) || elements.length === 0) {
        return [createDefaultTextElement(dims)];
    }

    const nonText = elements.filter((el) => el.type !== 'text');
    // כתוביות הן חלק מהעיצוב הסופי ולכן לא מתאחדות לתיבת טקסט אחת
    const captions = elements.filter((el) => el.type === 'text' && el.role === 'caption');
    let textElements = elements.filter((el) => el.type === 'text' && el.role !== 'caption');

    if (textElements.length === 0) {
        return [createDefaultTextElement(dims), ...nonText, ...captions];
    }

    if (textElements.length > 1) {
        const customized = textElements.filter((el) => el.content && el.content !== DEFAULT_TEXT_CONTENT);
        textElements = customized.length > 0 ? [customized[0]] : [textElements[0]];
    }

    const primary = textElements[0];
    const defaults = getDefaultTextBoxMetrics(dims);
    const hasUsableContent = typeof primary.content === 'string' && primary.content.trim().length >= 2;
    const content = hasUsableContent ? primary.content : DEFAULT_TEXT_CONTENT;
    const isDefaultContent = content === DEFAULT_TEXT_CONTENT;
    const width = isDefaultContent
        ? defaults.width
        : (Number(primary.width) > 40 ? Number(primary.width) : defaults.width);
    const height = isDefaultContent
        ? defaults.height
        : (Number(primary.height) > 24 ? Number(primary.height) : defaults.height);
    const fontSize = isDefaultContent
        ? defaults.fontSize
        : (primary.fontSize ?? defaults.fontSize);
    const position = isDefaultContent
        ? centerInSafeZone(width, height, dims)
        : { left: primary.left ?? 0, top: primary.top ?? 0 };

    const normalizedText = {
        ...primary,
        type: 'text',
        content,
        width,
        height,
        fontSize,
        left: position.left,
        top: position.top,
        locked: false,
    };

    return [normalizedText, ...nonText, ...captions];
}

/** מתאים את מידות תיבת התמונה ליחס הגובה-רוחב המקורי (object-fit: contain) */
export function fitImageElementBounds(el) {
    if (el.type !== 'image' || !el.width || !el.height) return el;
    if (!el.naturalWidth || !el.naturalHeight) return el;

    const imageAspect = el.naturalWidth / el.naturalHeight;
    const boxAspect = el.width / el.height;

    if (Math.abs(boxAspect - imageAspect) < 0.01) return el;

    if (boxAspect > imageAspect) {
        const displayWidth = Math.round(el.height * imageAspect);
        const widthDelta = el.width - displayWidth;
        return {
            ...el,
            width: displayWidth,
            left: Math.round((el.left ?? 0) + widthDelta / 2),
        };
    }

    const displayHeight = Math.round(el.width / imageAspect);
    const heightDelta = el.height - displayHeight;
    return {
        ...el,
        height: displayHeight,
        top: Math.round((el.top ?? 0) + heightDelta / 2),
    };
}

/** משנה מיקום וגודל אלמנטים כשמשטח ההדפסה משתנה */
export function scaleElementsToCanvas(elements, fromW, fromH, toW, toH) {
    if (!fromW || !fromH || (fromW === toW && fromH === toH)) {
        return elements;
    }
    const scaleX = toW / fromW;
    const scaleY = toH / fromH;
    const uniformScale = Math.min(scaleX, scaleY);

    return elements.map((el) => {
        const next = {
            ...el,
            left: Math.round((el.left ?? 0) * scaleX),
            top: Math.round((el.top ?? 0) * scaleY),
        };
        if (el.width != null) {
            next.width = Math.round(
                el.width * (el.type === 'image' || el.type === 'shape' ? uniformScale : scaleX),
            );
        }
        if (el.height != null) {
            next.height = Math.round(
                el.height * (el.type === 'image' || el.type === 'shape' ? uniformScale : scaleY),
            );
        }
        if (el.fontSize != null) {
            next.fontSize = Math.max(10, Math.round(el.fontSize * uniformScale));
        }
        if (next.type === 'image') {
            return fitImageElementBounds(next);
        }
        return next;
    });
}

/**
 * יחס פיקסלים לייצוא הדפסה (~300 DPI לפי מידות ס"מ של המוצר).
 */
export function getPrintExportPixelRatio(dims) {
    const targetWidthPx = Math.round((dims.widthCm / 2.54) * PRINT_DPI);
    const ratio = targetWidthPx / dims.width;
    return Math.min(Math.max(ratio, 1), 6);
}
