import { describe, expect, it } from 'vitest';
import { INITIAL_FORM_DATA, buildProductPayload, productToForm } from './productForm';

const designForm = { ...INITIAL_FORM_DATA, name: ' ספל ', description: ' תיאור ', price: '40', category: 'ספלים', stock: '5', image: ' https://x/m.jpg ' };
const base = { priceTiers: [], tieredPricingEnabled: false, captions: [], isDesignCategory: true, isMagnetCategory: false };

describe('buildProductPayload', () => {
    it('requires a category', () => {
        expect(buildProductPayload({ ...base, formData: { ...designForm, category: '' } })).toEqual({ error: 'יש לבחור קטגוריה' });
    });

    it('trims texts, converts numbers and keeps the print area of a designed product', () => {
        const { payload } = buildProductPayload({ ...base, formData: { ...designForm, printWidth: '20', printHeight: '', allowOrientationToggle: true } });
        expect(payload).toMatchObject({ name: 'ספל', description: 'תיאור', price: 40, stock: 5, image: 'https://x/m.jpg', printWidth: 20, printHeight: 18, allowOrientationToggle: true });
        expect(payload.shape).toBeNull();
        expect(payload.memberDiscount).toBeNull();
    });

    it('sends the member discount and a custom shape', () => {
        const { payload } = buildProductPayload({ ...base, formData: { ...designForm, memberDiscountType: 'percent', memberDiscountValue: '15', shapeType: 'custom', shapeMaskUrl: 'https://x/s.png' } });
        expect(payload.memberDiscount).toEqual({ type: 'percent', value: 15 });
        expect(payload.shape).toEqual({ type: 'custom', maskUrl: 'https://x/s.png' });
    });

    it('keeps only caption ideas with text, for designed products', () => {
        const captions = [{ text: ' תמיד ביחד ', category: '' }, { text: '  ', category: 'אהבה' }];
        expect(buildProductPayload({ ...base, formData: designForm, captions }).payload.captionIdeas).toEqual([{ text: 'תמיד ביחד', category: 'כללי' }]);
        expect(buildProductPayload({ ...base, formData: designForm, captions, isDesignCategory: false }).payload.captionIdeas).toEqual([]);
    });

    it('validates price tiers', () => {
        const result = buildProductPayload({ ...base, formData: designForm, tieredPricingEnabled: true, priceTiers: [{ minQuantity: '', maxQuantity: '', unitPrice: '' }] });
        expect(result.error).toBeTruthy();
    });

    it('a magnet needs its size and takes its print size from it', () => {
        const magnet = { ...base, isDesignCategory: false, isMagnetCategory: true };
        expect(buildProductPayload({ ...magnet, formData: { ...designForm, size: ' ' } })).toEqual({ error: 'יש להזין גודל למגנט' });
        const { payload } = buildProductPayload({ ...magnet, formData: { ...designForm, size: '15×10' } });
        expect(payload.size).toBe('15×10');
        expect(payload.priceTiers).toEqual([]);
        expect(payload.printWidth).toBeGreaterThan(0);
    });
});

describe('productToForm', () => {
    it('loads a product with its tiers and caption ideas', () => {
        const form = productToForm({
            _id: 'p', name: 'ספל', description: 'd', price: 40, category: 'ספלים', displayType: 'design', stock: 3, image: 'i',
            priceTiers: [{ minQuantity: 10, maxQuantity: null, unitPrice: 30 }],
            captionIdeas: [{ _id: 'c', text: 't', category: 'כללי' }],
            memberDiscount: { type: 'price', value: 35 },
            shape: { type: 'heart' },
        });
        expect(form.formData).toMatchObject({ name: 'ספל', printWidth: 12, printHeight: 18, memberDiscountType: 'price', memberDiscountValue: 35, shapeType: 'heart', shapeMaskUrl: '' });
        expect(form.priceTiers).toEqual([{ id: 'tier-0-10', minQuantity: 10, maxQuantity: '', unitPrice: 30 }]);
        expect(form.captions).toHaveLength(1);
    });

    it('a magnet has no tiers and a simple product no caption ideas', () => {
        expect(productToForm({ category: 'x', displayType: 'magnet', priceTiers: [{ minQuantity: 1, unitPrice: 2 }] }).priceTiers).toEqual([]);
        expect(productToForm({ category: 'x', displayType: 'simple', captionIdeas: [{ text: 't' }] }).captions).toEqual([]);
    });
});
