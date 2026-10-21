import { describe, expect, it } from 'vitest';
import { buildSummaryLines } from './checkoutSummary';

const photo = (quantity, price) => ({ itemType: 'photo-print', quantity, price });

describe('buildSummaryLines', () => {
    it('sums all photo prints into one line, before the other items', () => {
        const lines = buildSummaryLines([
            { id: 'mug', name: 'ספל', quantity: 2, price: 45 },
            photo(3, 2),
            photo(1, 2.5),
        ]);
        expect(lines).toEqual([
            { key: 'photos', label: 'תמונות · 2 תמונות, 4 הדפסות', total: 8.5 },
            { key: 'mug', label: 'ספל × 2', total: 90 },
        ]);
    });

    it('has no photo line without photos, and falls back to _id or name for the key', () => {
        const lines = buildSummaryLines([{ _id: 'x', name: 'א', quantity: 1, price: 5 }, { name: 'ב', quantity: 1, price: 6 }]);
        expect(lines.map((l) => l.key)).toEqual(['x', 'ב']);
    });
});
