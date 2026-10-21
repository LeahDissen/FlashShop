/** Whether a ready design uploaded for printing as is matches the product's print area */
import { DEFAULT_HEIGHT_CM, DEFAULT_WIDTH_CM } from '../../utils/canvasDimensions';

/** Proportions within 3% of the print area print without visible cropping or empty edges */
export const PRINT_FIT_TOLERANCE = 0.03;

/** The product's print area in cm, as the editor uses it */
export function printAreaCm(product) {
    return {
        widthCm: Number(product?.printWidth) > 0 ? Number(product.printWidth) : DEFAULT_WIDTH_CM,
        heightCm: Number(product?.printHeight) > 0 ? Number(product.printHeight) : DEFAULT_HEIGHT_CM,
    };
}

/**
 * Compares the image's proportions with the print area. A product that may be turned in the editor
 * (allowOrientationToggle) accepts the image in either orientation.
 * @returns {{ fits: boolean, widthCm: number, heightCm: number }} the print size to suggest (in the image's orientation when the product may be turned)
 */
export function checkPrintFit(imageWidth, imageHeight, product) {
    const { widthCm, heightCm } = printAreaCm(product);
    if (!(imageWidth > 0) || !(imageHeight > 0)) return { fits: true, widthCm, heightCm };
    const imageRatio = imageWidth / imageHeight;
    const matches = (w, h) => Math.abs(imageRatio / (w / h) - 1) <= PRINT_FIT_TOLERANCE;
    if (matches(widthCm, heightCm)) return { fits: true, widthCm, heightCm };
    if (product?.allowOrientationToggle) {
        if (matches(heightCm, widthCm)) return { fits: true, widthCm: heightCm, heightCm: widthCm };
        // Suggest the turned size when the image's orientation is the turned one
        const imageLandscape = imageWidth >= imageHeight;
        const areaLandscape = widthCm >= heightCm;
        if (imageLandscape !== areaLandscape) return { fits: false, widthCm: heightCm, heightCm: widthCm };
    }
    return { fits: false, widthCm, heightCm };
}

/** Reads an image's pixel size from its URL */
export const loadImageSize = (url) => new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve(null);
    img.src = url;
});
