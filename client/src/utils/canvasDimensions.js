/** המרת ס"מ לפיקסלים במסך העורך */
export const CM_TO_PX = 30;
export const MAX_CANVAS_PX = 520;
export const MIN_CANVAS_PX = 200;
export const DEFAULT_WIDTH_CM = 12;
export const DEFAULT_HEIGHT_CM = 18;
export const PRINT_DPI = 300;

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

/** אלמנט טקסט ברירת מחדל במרכז המשטח */
export function createDefaultTextElement(dims) {
    const approxWidth = 200;
    const approxHeight = 40;
    const { left, top } = centerPosition(approxWidth, approxHeight, dims.width, dims.height);

    return {
        id: `text_${Date.now()}`,
        type: 'text',
        fontFamily: 'Arial',
        fontSize: 32,
        color: '#333333',
        bold: false,
        italic: false,
        underline: false,
        textAlign: 'center',
        direction: 'rtl',
        content: 'טקסט ניתן לעריכה',
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
