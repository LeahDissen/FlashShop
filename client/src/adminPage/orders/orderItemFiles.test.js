import { describe, expect, it } from 'vitest';
import { collectItemDownloads, isPhotoPrintItem, itemKindLabel, splitItemDisplayName } from './orderItemFiles';

const ORDER_ID = '6ad7e991188f443058654547';

describe('order line labels', () => {
    it('names the kind of line', () => {
        expect(itemKindLabel({ itemType: 'photo-print' })).toBe('פיתוח תמונות');
        expect(itemKindLabel({ customDesign: {} })).toBe('עיצוב מהעורך');
        expect(itemKindLabel({ customization: { type: 'designer-service' } })).toBe('שירות עיצוב גרפי');
        expect(itemKindLabel({ customization: { type: 'other' } })).toBe('מוצר מותאם');
        expect(itemKindLabel({})).toBe('מוצר מהקטלוג');
    });

    it('splits the customer file name out of a photo line', () => {
        expect(splitItemDisplayName('פיתוח תמונה (IMG_1.jpg)')).toEqual({ title: 'פיתוח תמונה', fileName: 'IMG_1.jpg' });
        expect(splitItemDisplayName('ספל')).toEqual({ title: 'ספל', fileName: null });
    });

    it('recognizes photo prints by type or by name', () => {
        expect(isPhotoPrintItem({ itemType: 'photo-print' })).toBe(true);
        expect(isPhotoPrintItem({ name: 'פיתוח תמונה (a.jpg)' })).toBe(true);
        expect(isPhotoPrintItem({ name: 'ספל' })).toBe(false);
    });
});

describe('collectItemDownloads', () => {
    it('lists every copy of a per-copy design, once per file', () => {
        const files = collectItemDownloads({ customDesign: { copies: [{ image: 'https://x/1.png' }, { image: 'https://x/2.png' }, { image: 'https://x/1.png' }] } }, ORDER_ID, 0);
        expect(files.map((f) => f.label)).toEqual(['עותק 1', 'עותק 2']);
        expect(files[0].filename).toBe('order-58654547-item-1-copy-1.png');
    });

    it('lists the designer request photos', () => {
        const files = collectItemDownloads({ customization: { type: 'designer-service', referenceImages: ['https://x/a.jpg', 'https://x/b.jpg'] } }, ORDER_ID, 2);
        expect(files.map((f) => f.label)).toEqual(['הורדת תמונה מצורפת 1', 'הורדת תמונה מצורפת 2']);
        expect(files[1].filename).toBe('order-58654547-item-3-reference-2.jpg');
    });

    it('lists a design and its attachment', () => {
        const files = collectItemDownloads({ image: 'https://x/d.png', customization: { referenceImage: 'https://x/r.jpg' } }, ORDER_ID, 0);
        expect(files.map((f) => f.label)).toEqual(['הורדת תמונה', 'הורדת קובץ מצורף']);
    });
});
