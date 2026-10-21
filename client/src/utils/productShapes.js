/**
 * Shaped products (heart, circle, star, flower, or the admin's own PNG): the customer designs only inside
 * the shape, and the print file is transparent outside it.
 * Every shape keeps its proportions: it is fitted inside the product's print area and centred (Michal's
 * round 7: a PNG in other proportions than the print area was stretched out of shape).
 */

export const PRODUCT_SHAPES = [
    { value: 'circle', label: 'עיגול', path: 'M50 0 A50 50 0 1 1 49.99 0 Z' },
    { value: 'heart', label: 'לב', path: 'M50 92 C22 72 2 54 2 31 C2 14 15 3 29 3 C39 3 46 9 50 17 C54 9 61 3 71 3 C85 3 98 14 98 31 C98 54 78 72 50 92 Z' },
    { value: 'star', label: 'כוכב', path: 'M50 2 L62 36 L98 37 L69 59 L80 95 L50 74 L20 95 L31 59 L2 37 L38 36 Z' },
    {
        value: 'flower',
        label: 'פרח',
        path: 'M50 26 C50 10 62 2 72 8 C82 14 80 28 70 36 C86 30 98 38 96 50 C94 62 80 66 70 64 C80 72 82 86 72 92 C62 98 50 90 50 74 C50 90 38 98 28 92 C18 86 20 72 30 64 C20 66 6 62 4 50 C2 38 14 30 30 36 C20 28 18 14 28 8 C38 2 50 10 50 26 Z',
    },
];

const shapeOf = (value) => PRODUCT_SHAPES.find((shape) => shape.value === value);

/** The mask image for a product's shape: a built-in SVG or the uploaded PNG; null = a regular rectangle */
export function shapeMaskUrl(shape) {
    if (!shape?.type) return null;
    if (shape.type === 'custom') return shape.maskUrl || null;
    const builtIn = shapeOf(shape.type);
    if (!builtIn) return null;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><path d="${builtIn.path}" fill="black"/></svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/** CSS that shows only the inside of the shape (on the editor's canvas) */
export function shapeMaskStyle(shape) {
    const url = shapeMaskUrl(shape);
    if (!url) return {};
    const value = `url("${url}")`;
    return {
        maskImage: value,
        WebkitMaskImage: value,
        maskSize: 'contain',
        WebkitMaskSize: 'contain',
        maskPosition: 'center',
        WebkitMaskPosition: 'center',
        maskRepeat: 'no-repeat',
        WebkitMaskRepeat: 'no-repeat',
    };
}

/** The built-in shape's outline path, drawn over the canvas so the customer sees the edge */
export const shapeOutlinePath = (shape) => (shape?.type && shape.type !== 'custom' ? shapeOf(shape.type)?.path : null);

/** The largest box with the source's proportions that fits inside the target box, centred in it */
export function containRect(sourceWidth, sourceHeight, boxWidth, boxHeight) {
    if (!(sourceWidth > 0) || !(sourceHeight > 0)) return { x: 0, y: 0, width: boxWidth, height: boxHeight };
    const scale = Math.min(boxWidth / sourceWidth, boxHeight / sourceHeight);
    const width = sourceWidth * scale;
    const height = sourceHeight * scale;
    return { x: (boxWidth - width) / 2, y: (boxHeight - height) / 2, width, height };
}

const loadImage = (src) => new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
});

/**
 * Makes everything outside the shape transparent in the captured design (PNG data URL).
 * Without a shape the image is returned unchanged.
 */
export async function applyShapeMask(dataUrl, shape) {
    const maskUrl = shapeMaskUrl(shape);
    if (!maskUrl || !dataUrl) return dataUrl;
    const [design, mask] = await Promise.all([loadImage(dataUrl), loadImage(maskUrl)]);
    const canvas = document.createElement('canvas');
    canvas.width = design.naturalWidth;
    canvas.height = design.naturalHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(design, 0, 0);
    ctx.globalCompositeOperation = 'destination-in';
    // The same fit as on the canvas (CSS mask-size: contain): the shape keeps its proportions, centred
    const fit = containRect(mask.naturalWidth || mask.width, mask.naturalHeight || mask.height, canvas.width, canvas.height);
    ctx.drawImage(mask, fit.x, fit.y, fit.width, fit.height);
    return canvas.toDataURL('image/png');
}
