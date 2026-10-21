import { describe, expect, it } from 'vitest';
import { getCursorForHandle, resizeFromHandle, rotatePoint } from './canvasGeometry';

/** The implementation the editor used before the split, kept as the reference */
function originalCursor(handle, rotation) {
    let angle = 0;
    switch (handle) {
        case 'tr': angle = 45; break;
        case 'br': angle = 135; break;
        case 'bl': angle = 225; break;
        case 'tl': angle = 315; break;
        default: break;
    }
    let totalAngle = (angle + rotation) % 360;
    if (totalAngle < 0) totalAngle += 360;
    if ((totalAngle >= 0 && totalAngle < 22.5) || (totalAngle >= 337.5 && totalAngle < 360)) return 'ew-resize';
    if (totalAngle >= 22.5 && totalAngle < 67.5) return 'nesw-resize';
    if (totalAngle >= 67.5 && totalAngle < 112.5) return 'ns-resize';
    if (totalAngle >= 112.5 && totalAngle < 157.5) return 'nwse-resize';
    if (totalAngle >= 157.5 && totalAngle < 202.5) return 'ew-resize';
    if (totalAngle >= 202.5 && totalAngle < 247.5) return 'nesw-resize';
    if (totalAngle >= 247.5 && totalAngle < 292.5) return 'ns-resize';
    if (totalAngle >= 292.5 && totalAngle < 337.5) return 'nwse-resize';
    return 'default';
}

describe('getCursorForHandle', () => {
    it('matches the previous implementation for every handle and angle', () => {
        for (const handle of ['tl', 'tr', 'bl', 'br']) {
            for (let rotation = -720; rotation <= 720; rotation += 2.5) {
                expect(getCursorForHandle(handle, rotation), `${handle} ${rotation}`).toBe(originalCursor(handle, rotation));
            }
        }
    });
});

describe('rotatePoint', () => {
    it('rotates by 90 degrees', () => {
        const p = rotatePoint({ x: 1, y: 0 }, 90);
        expect(p.x).toBeCloseTo(0);
        expect(p.y).toBeCloseTo(1);
    });
});

describe('resizeFromHandle', () => {
    const start = { handle: 'br', initialWidth: 100, initialHeight: 50, initialTop: 10, initialLeft: 20, initialRotation: 0, aspectRatio: 2 };

    it('grows from the bottom-right corner keeping the top-left corner and the ratio', () => {
        expect(resizeFromHandle(start, 50, 0)).toEqual({ width: 150, height: 75, top: 10, left: 20 });
    });

    it('grows from the top-left corner keeping the bottom-right corner', () => {
        const r = resizeFromHandle({ ...start, handle: 'tl' }, -50, 0);
        expect(r.width).toBe(150);
        expect(r.left + r.width).toBeCloseTo(120);
        expect(r.top + r.height).toBeCloseTo(60);
    });

    it('never shrinks below the minimum size', () => {
        const r = resizeFromHandle(start, -500, 0);
        expect(r.height).toBe(20);
        expect(r.width).toBe(40);
    });

    it('keeps the opposite corner of a rotated element in place', () => {
        const rotated = { ...start, initialRotation: 90 };
        const before = resizeFromHandle(rotated, 0, 0);
        const after = resizeFromHandle(rotated, 0, 40);
        expect(before).toEqual({ width: 100, height: 50, top: 10, left: 20 });
        expect(after.width / after.height).toBeCloseTo(2);
    });
});

/** The resize math the editor used before the split, kept as the reference */
function originalResize(info, dx, dy) {
    const { handle, initialWidth, initialHeight, initialTop, initialLeft, initialRotation, aspectRatio } = info;
    const rotatedDelta = rotatePoint({ x: dx, y: dy }, -initialRotation);
    let tempNewWidth = initialWidth;
    let tempNewHeight = initialHeight;
    if (handle.includes('r')) tempNewWidth += rotatedDelta.x; else tempNewWidth -= rotatedDelta.x;
    if (handle.includes('b')) tempNewHeight += rotatedDelta.y; else tempNewHeight -= rotatedDelta.y;
    let newWidth, newHeight;
    if (Math.abs(tempNewWidth - initialWidth) > Math.abs(tempNewHeight - initialHeight)) {
        newWidth = tempNewWidth; newHeight = tempNewWidth / aspectRatio;
    } else {
        newHeight = tempNewHeight; newWidth = tempNewHeight * aspectRatio;
    }
    const minSize = 20;
    if (newWidth < minSize) { newWidth = minSize; newHeight = minSize / aspectRatio; }
    if (newHeight < minSize) { newHeight = minSize; newWidth = minSize * aspectRatio; }
    let shiftX = (newWidth - initialWidth) / 2;
    let shiftY = (newHeight - initialHeight) / 2;
    if (handle.includes('l')) shiftX = -shiftX;
    if (handle.includes('t')) shiftY = -shiftY;
    const rotatedShift = rotatePoint({ x: shiftX, y: shiftY }, initialRotation);
    const newCenterX = initialLeft + initialWidth / 2 + rotatedShift.x;
    const newCenterY = initialTop + initialHeight / 2 + rotatedShift.y;
    return { width: newWidth, height: newHeight, top: newCenterY - newHeight / 2, left: newCenterX - newWidth / 2 };
}

describe('resizeFromHandle matches the previous implementation', () => {
    it('on 2,000 random resizes', () => {
        let seed = 7;
        const random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
        for (let i = 0; i < 2000; i += 1) {
            const info = {
                handle: ['tl', 'tr', 'bl', 'br'][Math.floor(random() * 4)],
                initialWidth: 10 + random() * 400,
                initialHeight: 10 + random() * 400,
                initialTop: random() * 300,
                initialLeft: random() * 300,
                initialRotation: random() * 720 - 360,
                aspectRatio: 0.2 + random() * 4,
            };
            const dx = random() * 600 - 300;
            const dy = random() * 600 - 300;
            const expected = originalResize(info, dx, dy);
            const actual = resizeFromHandle(info, dx, dy);
            for (const key of ['width', 'height', 'top', 'left']) expect(actual[key]).toBeCloseTo(expected[key], 9);
        }
    });
});
