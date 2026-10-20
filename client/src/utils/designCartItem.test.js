import { describe, expect, it } from 'vitest';
import { buildDesignCartItem, collectCaptions, describeDesignProduct } from './designCartItem';

const mug = {
    _id: 'mug1',
    name: 'ספל',
    price: 40,
    size: '11oz',
    priceTiers: [
        { minQuantity: 1, maxQuantity: 9, unitPrice: 40 },
        { minQuantity: 10, maxQuantity: null, unitPrice: 30 },
    ],
};

describe('describeDesignProduct', () => {
    it('names a product object and uses its id', () => {
        expect(describeDesignProduct(mug)).toEqual({ name: 'ספל בעיצוב אישי', price: 40, productId: 'mug1' });
    });

    it('uses the price for the quantity only when asked', () => {
        expect(describeDesignProduct(mug, { quantity: 12, tieredPrice: true }).price).toBe(30);
        expect(describeDesignProduct(mug, { quantity: 12 }).price).toBe(40);
    });

    it('reads a price written with a currency sign', () => {
        expect(describeDesignProduct({ name: 'תיק', price: '₪49.90' }).price).toBe(49.9);
    });

    it('falls back for old saved projects (a name only) and for no product', () => {
        expect(describeDesignProduct('חולצה')).toEqual({ name: 'חולצה בעיצוב אישי', price: 24.99, productId: 'custom_product' });
        expect(describeDesignProduct(null)).toEqual({ name: 'מוצר בעיצוב אישי', price: 24.99, productId: 'custom_product' });
        expect(describeDesignProduct({ price: null }).price).toBe(24.99);
    });
});

describe('buildDesignCartItem', () => {
    it('builds one cart line with the design', () => {
        const item = buildDesignCartItem({
            product: mug,
            quantity: 10,
            tieredPrice: true,
            image: 'https://x/thumb.png',
            customDesign: { projectId: 'p1' },
        });
        expect(item).toMatchObject({
            productId: 'mug1',
            name: 'ספל בעיצוב אישי',
            price: 30,
            quantity: 10,
            size: '11oz',
            image: 'https://x/thumb.png',
            customDesign: { projectId: 'p1' },
        });
        expect(item.id).toMatch(/^cart_\d+$/);
    });

    it('has no size for a product saved as a name', () => {
        expect(buildDesignCartItem({ product: 'חולצה', customDesign: {} }).size).toBeUndefined();
    });
});

describe('collectCaptions', () => {
    it('lists the texts with content, marking captions', () => {
        const captions = collectCaptions([
            { type: 'text', content: 'שלום', fontFamily: 'Rubik', fontSize: 20, color: '#000' },
            { type: 'text', content: '  ', fontFamily: 'Rubik' },
            { type: 'text', content: 'כיתוב', role: 'caption', fontFamily: 'Arial', fontSize: 14, color: '#fff' },
            { type: 'image', src: 'x' },
        ]);
        expect(captions).toEqual([
            { content: 'שלום', fontFamily: 'Rubik', fontSize: 20, color: '#000', isCaption: false },
            { content: 'כיתוב', fontFamily: 'Arial', fontSize: 14, color: '#fff', isCaption: true },
        ]);
        expect(collectCaptions(undefined)).toEqual([]);
    });
});
