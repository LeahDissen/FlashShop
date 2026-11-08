import { describe, expect, it } from 'vitest';
import { getPrintPixelSize, needsWhiteMargins } from './printSizes';
import { paddedPrintUrl } from './imageUrl';

describe('exact print size', () => {
    it('is the size in pixels at 300 DPI, in the chosen orientation', () => {
        expect(getPrintPixelSize('10x15', 'landscape')).toEqual({ width: 1772, height: 1181 });
        expect(getPrintPixelSize('10x15', 'portrait')).toEqual({ width: 1181, height: 1772 });
    });
});

describe('white margins', () => {
    it('are needed only when the photo proportions differ from the print', () => {
        expect(needsWhiteMargins(3000, 2000, '10x15', 'landscape')).toBe(false); // camera 3:2 fits 10×15
        expect(needsWhiteMargins(4000, 3000, '10x15', 'landscape')).toBe(true); // phone 4:3
        expect(needsWhiteMargins(1000, 1000, '10x15', 'landscape')).toBe(true); // square
        expect(needsWhiteMargins(0, 0, '10x15', 'landscape')).toBe(false); // size unknown yet
    });
});

describe('paddedPrintUrl', () => {
    it('always delivers a JPEG', () => {
        expect(paddedPrintUrl('https://res.cloudinary.com/demo/image/upload/v1/p.webp', { width: 10, height: 20 }))
            .toBe('https://res.cloudinary.com/demo/image/upload/c_pad,b_white,w_10,h_20,q_95/v1/p.jpg');
        expect(paddedPrintUrl('https://res.cloudinary.com/demo/image/upload/v1/p', { width: 10, height: 20 }))
            .toBe('https://res.cloudinary.com/demo/image/upload/c_pad,b_white,w_10,h_20,q_95/v1/p.jpg');
    });

    it('is applied once only', () => {
        const once = paddedPrintUrl('https://res.cloudinary.com/demo/image/upload/v1/p.jpg', { width: 10, height: 20 });
        expect(paddedPrintUrl(once, { width: 10, height: 20 })).toBe(once);
    });
});
