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

/**
 * מחשב גודל משטח העבודה בעורך לפי מידות ההדפסה שהמנהל הגדיר במוצר.
 * @param {object|null} product
 * @returns {{ width: number, height: number, widthCm: number, heightCm: number }}
 */
export function getCanvasDimensions(product) {
    const widthCm = Number(product?.printWidth) > 0
        ? Number(product.printWidth)
        : DEFAULT_WIDTH_CM;
    const heightCm = Number(product?.printHeight) > 0
        ? Number(product.printHeight)
        : DEFAULT_HEIGHT_CM;

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

    return { width, height, widthCm, heightCm };
}

export function formatPrintSizeLabel(widthCm, heightCm) {
    return `${widthCm} × ${heightCm} ס"מ`;
}

/** ממיר ס"מ לפיקסלים על משטח העורך (מתחשב בקנה מידה כשהמשטח מוקטן) */
export function cmToCanvasPx(cm, canvasWidthPx, widthCm) {
    if (!widthCm || widthCm <= 0) return Math.round(cm * CM_TO_PX);
    return Math.round((canvasWidthPx / widthCm) * cm);
}

/** מפתח לשמירת טיוטה – מפריד בין מוצרים ובין מידות שונות */
export function getCanvasStorageKey(product, dims) {
    const id = product?._id || product?.id || 'no-product';
    return `${id}_${dims.widthCm}x${dims.heightCm}`;
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

const DEFAULT_TEXT_CONTENT = 'טקסט ניתן לעריכה';

/** מנקה טיוטות שבורות ומחזיר תיבת טקסט אחת במרכז */
export function normalizeEditorElements(elements, dims) {
    if (!Array.isArray(elements) || elements.length === 0) {
        return [createDefaultTextElement(dims)];
    }

    const nonText = elements.filter((el) => el.type !== 'text');
    let textElements = elements.filter((el) => el.type === 'text');

    if (textElements.length === 0) {
        return [createDefaultTextElement(dims), ...nonText];
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

    return [normalizedText, ...nonText];
}

/** משנה מיקום וגודל אלמנטים כשמשטח ההדפסה משתנה */
export function scaleElementsToCanvas(elements, fromW, fromH, toW, toH) {
    if (!fromW || !fromH || (fromW === toW && fromH === toH)) {
        return elements;
    }
    const scaleX = toW / fromW;
    const scaleY = toH / fromH;

    return elements.map((el) => {
        const next = {
            ...el,
            left: Math.round((el.left ?? 0) * scaleX),
            top: Math.round((el.top ?? 0) * scaleY),
        };
        if (el.width != null) next.width = Math.round(el.width * scaleX);
        if (el.height != null) next.height = Math.round(el.height * scaleY);
        if (el.fontSize != null) {
            next.fontSize = Math.max(10, Math.round(el.fontSize * Math.min(scaleX, scaleY)));
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
