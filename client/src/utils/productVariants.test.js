import { describe, expect, it } from 'vitest';
import { availableStock, cartVariant, isOptionSoldOut, isSoldOut, nameWithVariant, variantCombinations } from './productVariants';

const shirt = {
    trackStock: true,
    stock: 0,
    colors: [{ name: 'לבן' }, { name: 'שחור' }],
    sizes: ['M', 'L'],
    variantStock: [
        { color: 'לבן', size: 'M', stock: 2 },
        { color: 'לבן', size: 'L', stock: 0 },
        { color: 'שחור', size: 'M', stock: 0 },
        { color: 'שחור', size: 'L', stock: 0 },
    ],
};

describe('product variants', () => {
    it('lists every color × size combination', () => {
        expect(variantCombinations([{ name: 'a' }], ['1', '2'])).toEqual([{ color: 'a', size: '1' }, { color: 'a', size: '2' }]);
        expect(variantCombinations([], ['1'])).toEqual([{ color: '', size: '1' }]);
    });

    it('reads the stock of the chosen combination', () => {
        expect(availableStock(shirt, { color: 'לבן', size: 'M' })).toBe(2);
        expect(availableStock(shirt, { color: 'לבן' })).toBeNull();
        expect(availableStock({ ...shirt, trackStock: false }, {})).toBe(Infinity);
        expect(availableStock({ trackStock: true, stock: 3 }, undefined)).toBe(3);
    });

    it('greys out sold-out options and products', () => {
        expect(isOptionSoldOut(shirt, { color: 'שחור' })).toBe(true);
        expect(isOptionSoldOut(shirt, { color: 'לבן', size: 'L' })).toBe(true);
        expect(isOptionSoldOut(shirt, { size: 'M' })).toBe(false);
        expect(isSoldOut(shirt)).toBe(false);
        expect(isSoldOut({ trackStock: true, stock: 0 })).toBe(true);
        expect(isSoldOut({ stock: 0 })).toBe(false);
    });

    it('names the cart line like the server does', () => {
        expect(cartVariant(shirt, { color: 'לבן', size: 'M' })).toEqual({ color: 'לבן', size: 'M' });
        expect(cartVariant({ sizes: ['M'] }, { color: 'x', size: 'M' })).toEqual({ color: '', size: 'M' });
        expect(cartVariant({}, { color: 'x' })).toBeUndefined();
        expect(nameWithVariant('חולצה', { color: 'לבן', size: 'M' })).toBe('חולצה (לבן · M)');
        expect(nameWithVariant('חולצה (לבן · M)', { color: 'לבן', size: 'M' })).toBe('חולצה (לבן · M)');
    });
});

import { mergeGuestCart, toCheckoutItem } from './cartItem';

describe('variants on cart lines', () => {
    it('sends the chosen color/size to checkout', () => {
        const line = { id: 'l1', productId: 'p', name: 'חולצה (לבן · M)', price: 40, quantity: 1, variant: { color: 'לבן', size: 'M' } };
        expect(toCheckoutItem(line).variant).toEqual({ color: 'לבן', size: 'M' });
    });

    it('keeps different colors of the same product as separate rows when carts merge', () => {
        const white = { id: 'a', productId: 'p', price: 40, quantity: 1, variant: { color: 'לבן', size: 'M' } };
        const black = { id: 'b', productId: 'p', price: 40, quantity: 2, variant: { color: 'שחור', size: 'M' } };
        const merged = mergeGuestCart([white], [black]);
        expect(merged).toHaveLength(2);
    });
});
