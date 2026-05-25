/** המרת ס"מ לפיקסלים במסך העורך */
export const CM_TO_PX = 30;
export const MAX_CANVAS_PX = 520;
export const MIN_CANVAS_PX = 200;
export const DEFAULT_WIDTH_CM = 12;
export const DEFAULT_HEIGHT_CM = 18;

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
