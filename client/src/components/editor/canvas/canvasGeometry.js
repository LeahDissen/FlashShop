/** Geometry for moving, rotating and resizing elements on the canvas (pure functions) */

export const MIN_ELEMENT_SIZE = 20;
/** A text box starts dragging only after the pointer moved this far, so a tap can open editing */
export const TEXT_DRAG_THRESHOLD_PX = 4;

export const rotatePoint = (point, angleDegrees) => {
    const angleRadians = (angleDegrees * Math.PI) / 180;
    const cos = Math.cos(angleRadians);
    const sin = Math.sin(angleRadians);
    return {
        x: point.x * cos - point.y * sin,
        y: point.x * sin + point.y * cos,
    };
};

const HANDLE_ANGLES = { tr: 45, br: 135, bl: 225, tl: 315 };
const CURSORS_BY_OCTANT = ['ew-resize', 'nesw-resize', 'ns-resize', 'nwse-resize'];

/** The resize cursor that matches a corner handle on an element rotated by `rotation` degrees */
export function getCursorForHandle(handle, rotation) {
    const totalAngle = ((((HANDLE_ANGLES[handle] || 0) + rotation) % 360) + 360) % 360;
    // Every 45° (starting at -22.5°) the cursor turns to the next direction, repeating every 180°
    const octant = Math.floor(((totalAngle + 22.5) % 360) / 45) % 4;
    return CURSORS_BY_OCTANT[octant] || 'default';
}

/** The pointer angle around a center point, in degrees */
export const angleAround = (centerX, centerY, clientX, clientY) =>
    Math.atan2(clientY - centerY, clientX - centerX) * (180 / Math.PI);

/**
 * Resizing from a corner handle keeps the aspect ratio and the opposite corner in place,
 * also on a rotated element.
 * @param {{ handle: string, initialWidth: number, initialHeight: number, initialTop: number, initialLeft: number,
 *           initialRotation: number, aspectRatio: number }} start the element when the resize began
 * @param {number} dx pointer movement in canvas pixels
 * @param {number} dy
 * @returns {{ width: number, height: number, top: number, left: number }}
 */
export function resizeFromHandle(start, dx, dy) {
    const { handle, initialWidth, initialHeight, initialTop, initialLeft, initialRotation, aspectRatio } = start;
    const rotatedDelta = rotatePoint({ x: dx, y: dy }, -initialRotation);

    const tempWidth = initialWidth + (handle.includes('r') ? rotatedDelta.x : -rotatedDelta.x);
    const tempHeight = initialHeight + (handle.includes('b') ? rotatedDelta.y : -rotatedDelta.y);

    // The side that moved more leads; the other follows the aspect ratio
    let width;
    let height;
    if (Math.abs(tempWidth - initialWidth) > Math.abs(tempHeight - initialHeight)) {
        width = tempWidth;
        height = tempWidth / aspectRatio;
    } else {
        height = tempHeight;
        width = tempHeight * aspectRatio;
    }
    if (width < MIN_ELEMENT_SIZE) {
        width = MIN_ELEMENT_SIZE;
        height = MIN_ELEMENT_SIZE / aspectRatio;
    }
    if (height < MIN_ELEMENT_SIZE) {
        height = MIN_ELEMENT_SIZE;
        width = MIN_ELEMENT_SIZE * aspectRatio;
    }

    // The center moves by half the growth, toward the dragged corner
    const shiftX = ((width - initialWidth) / 2) * (handle.includes('l') ? -1 : 1);
    const shiftY = ((height - initialHeight) / 2) * (handle.includes('t') ? -1 : 1);
    const rotatedShift = rotatePoint({ x: shiftX, y: shiftY }, initialRotation);
    const centerX = initialLeft + initialWidth / 2 + rotatedShift.x;
    const centerY = initialTop + initialHeight / 2 + rotatedShift.y;

    return { width, height, top: centerY - height / 2, left: centerX - width / 2 };
}
