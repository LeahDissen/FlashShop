import { describe, expect, it } from 'vitest';
import { areaProduct, designAreaSuffix, mainProduct } from './designAreas';
import { resolveDraftProductKey } from './editorDraftStorage';
import { getCanvasStorageKey } from './canvasDimensions';

const shirt = { _id: 'p1', printWidth: 20, printHeight: 25, allowOrientationToggle: true, shape: { type: 'heart' }, designAreas: [{ name: 'גב', printWidth: 30, printHeight: 35 }] };

describe('design areas', () => {
    it('designs an area at its own size and goes back to the main print settings', () => {
        const back = areaProduct(shirt, shirt.designAreas[0]);
        expect(back).toMatchObject({ printWidth: 30, printHeight: 35, designArea: 'גב', shape: null, allowOrientationToggle: false });
        expect(mainProduct(back)).toEqual(shirt);
        expect(mainProduct(shirt)).toBe(shirt);
        // Switching between areas keeps the true main settings
        expect(mainProduct(areaProduct(back, { name: 'x', printWidth: 5, printHeight: 5 }))).toEqual(shirt);
    });

    it('gives each area its own draft and canvas key', () => {
        const back = areaProduct(shirt, shirt.designAreas[0]);
        expect(designAreaSuffix(shirt)).toBe('');
        expect(resolveDraftProductKey(back)).not.toBe(resolveDraftProductKey(shirt));
        const dims = { widthCm: 20, heightCm: 25 };
        expect(getCanvasStorageKey(back, dims)).not.toBe(getCanvasStorageKey(shirt, dims));
    });
});
