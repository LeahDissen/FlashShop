import { describe, expect, it } from 'vitest';
import { getSaleInfo, regularUnitPrice } from './salePrice';

const tiers = (first) => [{ minQuantity: 1, maxQuantity: 30, unitPrice: first }, { minQuantity: 31, unitPrice: 20 }];

describe('getSaleInfo', () => {
    it('gives the members price against the regular price', () => {
        expect(getSaleInfo({ price: 40, memberDiscount: { type: 'percent', value: 25 } }))
            .toEqual({ regularPrice: 40, memberPrice: 30, savedAmount: 10, percentOff: 25 });
        expect(getSaleInfo({ price: 40, memberDiscount: { type: 'price', value: 35 } })).toMatchObject({ memberPrice: 35, percentOff: 13 });
    });

    it('starts from the one-unit tier price, which is what everyone pays', () => {
        // The puzzle: price 34.99 but 1-30 units cost 25 for everyone, and the members price is 25 – no sale
        expect(getSaleInfo({ price: 34.99, priceTiers: tiers(25), memberDiscount: { type: 'price', value: 25 } })).toBeNull();
        expect(getSaleInfo({ price: 34.99, priceTiers: tiers(34.99), memberDiscount: { type: 'price', value: 25 } }))
            .toMatchObject({ regularPrice: 34.99, memberPrice: 25 });
        expect(getSaleInfo({ price: 30, priceTiers: tiers(28), memberDiscount: { type: 'percent', value: 50 } })).toMatchObject({ regularPrice: 28, memberPrice: 14 });
    });

    it('shows no sale without a discount that lowers the price', () => {
        expect(getSaleInfo({ price: 40 })).toBeNull();
        expect(getSaleInfo({ price: 40, memberDiscount: { type: 'price', value: 50 } })).toBeNull();
        expect(getSaleInfo({ price: 0, memberDiscount: { type: 'percent', value: 10 } })).toBeNull();
    });
});

describe('regularUnitPrice', () => {
    it('is the first tier for a tiered product, the price otherwise', () => {
        expect(regularUnitPrice({ price: 34.99, priceTiers: tiers(25) })).toBe(25);
        expect(regularUnitPrice({ price: 12 })).toBe(12);
    });
});
