import { describe, expect, it } from 'vitest';
import { buildOrderFileList } from './orderDownloads';

describe('buildOrderFileList', () => {
    it('puts photo prints in one folder per print size', () => {
        const order = { items: [
            { name: 'פיתוח תמונה 13x18 (a.jpg)', size: '13x18', quantity: 1, image: 'https://x/a.jpg' },
            { name: 'פיתוח תמונה 10x15 (b.jpg)', size: '10x15', quantity: 2, image: 'https://x/b.jpg' },
        ] };
        const names = buildOrderFileList(order).map((e) => e.name);
        expect(names).toEqual(['13x18/01_13x18_x1_a.jpg', '10x15/02_10x15_x2_b.jpg']);
    });

    it('gives each design area its own file named after the area', () => {
        const order = { items: [{ name: 'חולצה', quantity: 1, image: 'https://x/front.png',
            customDesign: { areas: [{ name: 'צד אחורי', image: 'https://x/back.png' }] } }] };
        const names = buildOrderFileList(order).map((e) => e.name);
        expect(names).toEqual(['01_x1_עיצוב ראשי_חולצה.png', '01_x1_צד אחורי_חולצה.png']);
    });
});
