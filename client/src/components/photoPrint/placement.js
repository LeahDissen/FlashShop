/**
 * Where the photo sits inside the print frame, as fractions of the frame: { x, y, w, h }
 * (0..1, may go beyond to crop). The frame keeps the print size's proportions.
 */

export const DEFAULT_BACKGROUND = '#FFFFFF';
export const MIN_IMAGE_SIZE = 0.12;
export const HANDLE_ORDS = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];

export const isPlacement = (value) => (
    value
    && Number(value.w) > 0
    && Number(value.h) > 0
);

/** The whole photo inside the frame, centered (letterboxed) */
export const containPlacement = (imageAspect, frameAspect) => {
    if (!imageAspect || !frameAspect) return { x: 0, y: 0, w: 1, h: 1 };
    if (imageAspect > frameAspect) {
        const h = frameAspect / imageAspect;
        return { x: 0, y: (1 - h) / 2, w: 1, h };
    }
    const w = imageAspect / frameAspect;
    return { x: (1 - w) / 2, y: 0, w, h: 1 };
};

/** Zooms the photo around its center, never below the minimum size */
export const scalePlacement = (box, factor, minSize = MIN_IMAGE_SIZE) => {
    const cx = box.x + box.w / 2;
    const cy = box.y + box.h / 2;
    const nextFactor = box.w * factor < minSize ? minSize / box.w : factor;
    const w = box.w * nextFactor;
    const h = box.h * nextFactor;
    return { x: cx - w / 2, y: cy - h / 2, w, h };
};

/** Resizing from a handle (corner or side) keeps the photo's proportions and the opposite side in place */
export const resizePlacement = (start, ord, dx, dy, imageAspect, frameW, frameH) => {
    const ratio = imageAspect;
    let { x, y, w, h } = start;
    const px = { x: x * frameW, y: y * frameH, w: w * frameW, h: h * frameH };
    const minW = MIN_IMAGE_SIZE * Math.min(frameW, frameH);

    const applySize = (nextW, anchorX, anchorY) => {
        const width = Math.max(minW, nextW);
        const height = width / ratio;
        const next = { w: width, h: height, x: px.x, y: px.y };
        if (anchorX === 'right') next.x = px.x + px.w - width;
        if (anchorX === 'center') next.x = px.x + px.w / 2 - width / 2;
        if (anchorY === 'bottom') next.y = px.y + px.h - height;
        if (anchorY === 'center') next.y = px.y + px.h / 2 - height / 2;
        return next;
    };

    let nextPx = px;
    if (ord === 'se') nextPx = applySize(px.w + dx, 'left', 'top');
    else if (ord === 'nw') nextPx = applySize(px.w - dx, 'right', 'bottom');
    else if (ord === 'ne') nextPx = applySize(px.w + dx, 'left', 'bottom');
    else if (ord === 'sw') nextPx = applySize(px.w - dx, 'right', 'top');
    else if (ord === 'e') nextPx = applySize(px.w + dx, 'left', 'center');
    else if (ord === 'w') nextPx = applySize(px.w - dx, 'right', 'center');
    else if (ord === 's') nextPx = applySize((px.h + dy) * ratio, 'center', 'top');
    else if (ord === 'n') nextPx = applySize((px.h - dy) * ratio, 'center', 'bottom');

    return {
        x: nextPx.x / frameW,
        y: nextPx.y / frameH,
        w: nextPx.w / frameW,
        h: nextPx.h / frameH,
    };
};
