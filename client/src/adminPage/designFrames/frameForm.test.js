import { describe, expect, it } from 'vitest';
import { EMPTY_FRAME_FORM, buildFramePayload, frameToForm, orientationFromDimensions, ratioFromDimensions, zoneFieldValue } from './frameForm';

describe('frame image dimensions', () => {
    it('reduces the size to its ratio', () => {
        expect(ratioFromDimensions(1200, 900)).toBe('4:3');
        expect(ratioFromDimensions(1000, 1000)).toBe('1:1');
        expect(ratioFromDimensions(0, 900)).toBe('1:1');
    });

    it('reads the orientation', () => {
        expect(orientationFromDimensions(1200, 900)).toBe('landscape');
        expect(orientationFromDimensions(900, 1200)).toBe('portrait');
        expect(orientationFromDimensions(900, 900)).toBe('any');
        expect(orientationFromDimensions(0, 0)).toBe('any');
    });
});

describe('buildFramePayload', () => {
    const filled = { ...EMPTY_FRAME_FORM, title: ' פרחים ', imageUrl: ' https://x/f.png ', sortOrder: '3' };

    it('requires a name, an image and a ratio', () => {
        expect(buildFramePayload(EMPTY_FRAME_FORM).error).toBeTruthy();
    });

    it('trims, uses the image as the thumbnail and drops windows of a regular frame', () => {
        const { payload } = buildFramePayload({ ...filled, dropzones: [{ id: 'z', x: 1, y: 1, width: 10, height: 10 }] });
        expect(payload).toMatchObject({ title: 'פרחים', imageUrl: 'https://x/f.png', thumbnailUrl: 'https://x/f.png', layoutType: 'single_overlay', dropzones: [], sortOrder: 3 });
    });

    it('a collage needs at least one window', () => {
        expect(buildFramePayload({ ...filled, layoutType: 'multi_dropzone', dropzones: [] }).error).toBeTruthy();
        const { payload } = buildFramePayload({ ...filled, layoutType: 'multi_dropzone', dropzones: [{ id: 'z1', x: 5, y: 5, width: 40, height: 40 }] });
        expect(payload.dropzones).toHaveLength(1);
    });
});

describe('frameToForm', () => {
    it('loads a frame with the defaults for missing fields', () => {
        expect(frameToForm({ title: 't', imageUrl: 'u' })).toMatchObject({ category: 'כללי', aspectRatio: '1:1', isFixedOverlay: true, isActive: true, layoutType: 'single_overlay', thumbnailUrl: 'u' });
    });

    it('keeps window names as text and positions as numbers', () => {
        expect(zoneFieldValue('label', '12')).toBe('12');
        expect(zoneFieldValue('x', '12.5')).toBe(12.5);
    });
});
