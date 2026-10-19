import { parseAspectRatio } from './canvasDimensions';

export const ORIENTATION = {
    LANDSCAPE: 'landscape',
    PORTRAIT: 'portrait',
    SQUARE: 'square',
};

/** A "nearly perfect" square counts as square and does not conflict with either orientation */
const SQUARE_TOLERANCE = 0.04;

export function getOrientation(width, height) {
    const w = Number(width);
    const h = Number(height);
    if (!(w > 0) || !(h > 0)) return null;

    const ratio = w / h;
    if (Math.abs(ratio - 1) <= SQUARE_TOLERANCE) return ORIENTATION.SQUARE;
    return ratio > 1 ? ORIENTATION.LANDSCAPE : ORIENTATION.PORTRAIT;
}

/** The frame's orientation – by the admin's choice, and if not set, by the aspect ratio */
export function getFrameOrientation(frame) {
    if (!frame) return null;
    if (frame.orientation === ORIENTATION.LANDSCAPE || frame.orientation === ORIENTATION.PORTRAIT) {
        return frame.orientation;
    }
    const parsed = parseAspectRatio(frame.aspectRatio);
    return parsed ? getOrientation(parsed.width, parsed.height) : null;
}

export function getCanvasOrientation(canvasDimensions) {
    return getOrientation(canvasDimensions?.widthCm, canvasDimensions?.heightCm);
}

/** The match target: the selected frame first, and if there is no frame – the print canvas */
export function getTargetOrientation(frame, canvasDimensions) {
    return getFrameOrientation(frame) || getCanvasOrientation(canvasDimensions);
}

export function orientationsConflict(a, b) {
    if (!a || !b) return false;
    if (a === ORIENTATION.SQUARE || b === ORIENTATION.SQUARE) return false;
    return a !== b;
}

export function orientationLabel(orientation, labels) {
    if (orientation === ORIENTATION.LANDSCAPE) return labels?.landscape || 'לרוחב';
    if (orientation === ORIENTATION.PORTRAIT) return labels?.portrait || 'לאורך';
    return labels?.any || 'מרובע';
}

/**
 * Rotates a photo element by 90° around its center.
 * The visual footprint swaps, so the photo is scaled down if it overflows the canvas.
 */
export function rotateImageElement90(el, canvasWidth, canvasHeight) {
    if (!el) return el;

    const originalWidth = Number(el.width) || 0;
    const originalHeight = Number(el.height) || 0;
    if (!originalWidth || !originalHeight) return el;

    const centerX = (Number(el.left) || 0) + originalWidth / 2;
    const centerY = (Number(el.top) || 0) + originalHeight / 2;

    let width = originalWidth;
    let height = originalHeight;

    const scale = Math.min(1, canvasWidth / originalHeight, canvasHeight / originalWidth);
    if (scale < 1) {
        width = Math.max(1, Math.round(width * scale));
        height = Math.max(1, Math.round(height * scale));
    }

    const halfVisualWidth = height / 2;
    const halfVisualHeight = width / 2;
    const clampedCenterX = Math.min(Math.max(centerX, halfVisualWidth), canvasWidth - halfVisualWidth);
    const clampedCenterY = Math.min(Math.max(centerY, halfVisualHeight), canvasHeight - halfVisualHeight);

    return {
        ...el,
        rotation: (((Number(el.rotation) || 0) + 90) % 360),
        width,
        height,
        left: Math.round(clampedCenterX - width / 2),
        top: Math.round(clampedCenterY - height / 2),
    };
}
