import { describe, expect, it } from 'vitest';
import { checkPrintFit, printAreaCm } from './printFit';

const mug = { printWidth: 20, printHeight: 9 };

describe('checkPrintFit', () => {
    it('accepts an image in the print area proportions, within 3%', () => {
        expect(checkPrintFit(2000, 900, mug)).toEqual({ fits: true, widthCm: 20, heightCm: 9 });
        expect(checkPrintFit(2040, 900, mug).fits).toBe(true);
    });

    it('rejects other proportions and suggests the print size', () => {
        expect(checkPrintFit(1000, 1000, mug)).toEqual({ fits: false, widthCm: 20, heightCm: 9 });
        expect(checkPrintFit(900, 2000, mug)).toEqual({ fits: false, widthCm: 20, heightCm: 9 });
    });

    it('accepts the turned orientation only for a product that may be turned', () => {
        const canvas = { printWidth: 30, printHeight: 40, allowOrientationToggle: true };
        expect(checkPrintFit(4000, 3000, canvas)).toEqual({ fits: true, widthCm: 40, heightCm: 30 });
        expect(checkPrintFit(4000, 2000, canvas)).toEqual({ fits: false, widthCm: 40, heightCm: 30 });
        expect(checkPrintFit(4000, 3000, { printWidth: 30, printHeight: 40 }).fits).toBe(false);
    });

    it('does not block when the size is unknown, and uses the default area', () => {
        expect(checkPrintFit(0, 0, mug).fits).toBe(true);
        expect(printAreaCm({})).toEqual({ widthCm: 12, heightCm: 18 });
    });
});
