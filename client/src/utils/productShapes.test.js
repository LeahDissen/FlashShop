import { describe, expect, it } from 'vitest';
import { containRect, shapeMaskStyle, shapeMaskUrl } from './productShapes';

describe('containRect', () => {
    it('fits a square shape into a wide print area, centred, without stretching', () => {
        expect(containRect(500, 500, 2000, 900)).toEqual({ x: 550, y: 0, width: 900, height: 900 });
    });

    it('fits a tall shape into a square area', () => {
        expect(containRect(232, 270, 1000, 1000)).toEqual({ x: (1000 - 232 * (1000 / 270)) / 2, y: 0, width: 232 * (1000 / 270), height: 1000 });
    });

    it('fills the box when the source has no size', () => {
        expect(containRect(0, 0, 300, 200)).toEqual({ x: 0, y: 0, width: 300, height: 200 });
    });
});

describe('shape mask', () => {
    it('keeps the shape proportions on the canvas', () => {
        const style = shapeMaskStyle({ type: 'heart' });
        expect(style.maskSize).toBe('contain');
        expect(style.maskPosition).toBe('center');
        expect(decodeURIComponent(shapeMaskUrl({ type: 'heart' }))).not.toContain('preserveAspectRatio="none"');
    });

    it('uses the uploaded PNG for a custom shape and nothing for a rectangle', () => {
        expect(shapeMaskUrl({ type: 'custom', maskUrl: 'https://x/m.png' })).toBe('https://x/m.png');
        expect(shapeMaskUrl({ type: '' })).toBeNull();
        expect(shapeMaskStyle(null)).toEqual({});
    });
});
