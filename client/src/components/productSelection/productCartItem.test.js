import { describe, expect, it } from 'vitest';
import { buildProductCartItem, validateDesignerContact } from './productCartItem';

const tiers = [{ minQuantity: 1, maxQuantity: 9, unitPrice: 30 }, { minQuantity: 10, unitPrice: 25 }];
const tiered = { _id: 'p1', name: 'ספל', price: 30, image: 'https://x/m.jpg', priceTiers: tiers };
const plain = { _id: 'p2', name: 'מגנט', price: 12, image: 'https://x/g.jpg', priceTiers: tiers };

describe('buildProductCartItem', () => {
    it('builds the line from the product and lets overrides win', () => {
        const item = buildProductCartItem({ product: plain, quantity: 3, unitPrice: 12, isMagnet: true, overrides: { id: 'a', image: 'https://x/u.jpg' } });
        expect(item).toEqual({ productId: 'p2', name: 'מגנט', price: 12, image: 'https://x/u.jpg', quantity: 3, id: 'a' });
    });

    it('keeps the quantity tiers on a non-magnet line, with the designer fee', () => {
        const item = buildProductCartItem({ product: tiered, quantity: 2, unitPrice: 45, isMagnet: false, priceAddon: 15 });
        expect(item).toMatchObject({ price: 45, basePrice: 30, priceTiers: tiers, priceAddon: 15 });
    });

    it('adds no tier fields to a magnet or a product without tiers', () => {
        expect(buildProductCartItem({ product: plain, quantity: 1, unitPrice: 12, isMagnet: true })).not.toHaveProperty('priceTiers');
        const noTiers = { ...tiered, priceTiers: [] };
        expect(buildProductCartItem({ product: noTiers, quantity: 1, unitPrice: 30, isMagnet: false })).not.toHaveProperty('basePrice');
    });
});

describe('validateDesignerContact', () => {
    it('accepts an Israeli phone with dashes or spaces and a valid email', () => {
        expect(validateDesignerContact({ phone: '053-712 3161', email: 'a@b.co' })).toBeNull();
        expect(validateDesignerContact({ phone: '031234567', email: 'a@b.co' })).toBeNull();
    });

    it('rejects a short, long or non-numeric phone', () => {
        for (const phone of ['12345678', '05371231610', '05371231a', '', undefined]) {
            expect(validateDesignerContact({ phone, email: 'a@b.co' })).toBe('אנא הזן מספר טלפון תקין');
        }
    });

    it('rejects a bad email once the phone is valid', () => {
        expect(validateDesignerContact({ phone: '0537123161', email: 'a@b' })).toBe('אנא הזן כתובת אימייל תקינה');
        expect(validateDesignerContact({ phone: '0537123161', email: '' })).toBe('אנא הזן כתובת אימייל תקינה');
    });
});
