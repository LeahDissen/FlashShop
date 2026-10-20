/**
 * Turning a project saved in "my projects" back into a canvas: its orientation, its elements scaled
 * to the product's current canvas, and the draft key it is stored under.
 */
import {
    createDefaultTextElement,
    getCanvasDimensions,
    getCanvasStorageKey,
    scaleElementsToCanvas,
} from './canvasDimensions';
import { enforceLayerOrder, extractFrameAspectRatio, isGlobalFrame } from './editorLayering';

const DEFAULT_PRINT_WIDTH_CM = 12;
const DEFAULT_PRINT_HEIGHT_CM = 18;

/**
 * Whether the project was designed with the canvas turned: its saved size is the product's size swapped.
 * Older projects did not save the flag, so it is inferred from the size.
 */
function wasOrientationFlipped(project, product) {
    if (project.canvasSize?.orientationFlipped !== undefined && project.canvasSize?.orientationFlipped !== null) {
        return project.canvasSize.orientationFlipped;
    }
    const savedW = project.canvasSize?.widthCm;
    const savedH = project.canvasSize?.heightCm;
    const nativeW = Number(product?.printWidth) || DEFAULT_PRINT_WIDTH_CM;
    const nativeH = Number(product?.printHeight) || DEFAULT_PRINT_HEIGHT_CM;
    return Boolean(savedW && savedH && savedW === nativeH && savedH === nativeW && savedW !== nativeW);
}

/**
 * @param {object} project a saved project (db)
 * @param {object|null} currentProduct the product open in the editor, used when the project has none
 * @returns {{ product, elements, orientationFlipped: boolean, frameAspectRatio: number|null, canvasStorageKey: string, canvas: object }}
 */
export function prepareProjectForCanvas(project, currentProduct) {
    const product = project.selectedProduct || currentProduct;
    const orientationFlipped = wasOrientationFlipped(project, product);
    const canvas = getCanvasDimensions(product, null, orientationFlipped);

    let elements = enforceLayerOrder(project.elements?.length > 0
        ? project.elements
        : [createDefaultTextElement(canvas)]);
    const frameAspectRatio = extractFrameAspectRatio(elements);

    if (project.canvasSize?.width && project.canvasSize?.height) {
        elements = scaleElementsToCanvas(
            elements,
            project.canvasSize.width,
            project.canvasSize.height,
            canvas.width,
            canvas.height,
        );
    }
    // The frame always covers the whole canvas
    elements = elements.map((el) => (
        isGlobalFrame(el) ? { ...el, width: canvas.width, height: canvas.height, top: 0, left: 0 } : el
    ));

    const framedCanvas = getCanvasDimensions(product, frameAspectRatio, orientationFlipped);
    return {
        product,
        elements,
        orientationFlipped,
        frameAspectRatio,
        canvas,
        canvasStorageKey: getCanvasStorageKey(product, framedCanvas, frameAspectRatio, orientationFlipped),
    };
}
