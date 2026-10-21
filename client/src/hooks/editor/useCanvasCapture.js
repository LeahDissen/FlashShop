import { useCallback } from 'react';
import { toPng } from 'html-to-image';
import { getPrintExportPixelRatio } from '../../utils/canvasDimensions';
import { applyShapeMask } from '../../utils/productShapes';

/** The canvas element rendered by components/editor/Canvas */
const CANVAS_NODE_ID = 'canvas-container';
const OVERLAY_CLASSES = ['canvas-grid-overlay', 'canvas-safe-zone-overlay'];
const PRINT_EXCLUDED_CLASSES = [...OVERLAY_CLASSES, 'canvas-shape-outline'];

const withoutClasses = (classes) => (node) => !classes.some((name) => node.classList?.contains(name));
const backgroundColorOf = (background) => (background?.type === 'color' ? background.value : undefined);
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Images of the design exactly as designed (no AI mockup): the print file, and a small preview for
 * saved projects. The selection frame, the grid and the guides are left out.
 */
export function useCanvasCapture({ canvasBackground, canvasDimensions, shape, zoom, setZoom, setSelectedElementId }) {
    /**
     * @param {number} [pixelRatioOverride] default: the print resolution of the product
     * @param {object} [background] the design's background when capturing a design other than the one in state (a copy)
     * @returns {Promise<string|null>} PNG data URL, transparent outside a shaped product's shape
     */
    const captureCanvasImage = useCallback(async (pixelRatioOverride, background = canvasBackground) => {
        const node = document.getElementById(CANVAS_NODE_ID);
        if (!node) return null;

        setSelectedElementId(null);
        const previousZoom = zoom;
        if (zoom !== 100) setZoom(100);
        await wait(300);

        try {
            const png = await toPng(node, {
                quality: 1,
                pixelRatio: pixelRatioOverride ?? getPrintExportPixelRatio(canvasDimensions),
                filter: withoutClasses(PRINT_EXCLUDED_CLASSES),
                backgroundColor: backgroundColorOf(background),
                style: { transform: 'scale(1)', outline: 'none', outlineOffset: 0 },
                cacheBust: true,
            });
            return await applyShapeMask(png, shape);
        } finally {
            if (previousZoom !== 100) setZoom(previousZoom);
        }
    }, [canvasBackground, zoom, setZoom, canvasDimensions, shape, setSelectedElementId]);

    /** A light preview for "my projects"; undefined when the canvas is not on the page */
    const captureProjectPreview = useCallback(async () => {
        const node = document.getElementById(CANVAS_NODE_ID);
        if (!node) return undefined;
        setSelectedElementId(null);
        await wait(100);
        return toPng(node, {
            quality: 0.5,
            pixelRatio: 0.5,
            filter: withoutClasses(OVERLAY_CLASSES),
            backgroundColor: backgroundColorOf(canvasBackground),
            cacheBust: true,
        });
    }, [canvasBackground, setSelectedElementId]);

    return { captureCanvasImage, captureProjectPreview };
}
