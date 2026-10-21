import { describe, expect, it } from 'vitest';
import { DEFAULT_TESTIMONIALS } from '../../constants/testimonials';
import { HOME_TILE_COUNT, homeEditTiles, parseJsonField, testimonialsOf, tileLink, truncateText } from './homeContent';

describe('parseJsonField', () => {
    it('keeps an array, parses a JSON array and wraps a bare list', () => {
        expect(parseJsonField([1], [])).toEqual([1]);
        expect(parseJsonField('[{"a":1}]', [])).toEqual([{ a: 1 }]);
        expect(parseJsonField('1, 2', [])).toEqual([1, 2]);
    });

    it('falls back on empty, broken or non-array values', () => {
        expect(parseJsonField('', ['x'])).toEqual(['x']);
        expect(parseJsonField(undefined, ['x'])).toEqual(['x']);
        expect(parseJsonField('{"a":1}', ['x'])).toEqual(['x']);
        expect(parseJsonField('[broken', ['x'])).toEqual(['x']);
        expect(parseJsonField('"text"', ['x'])).toEqual(['text']);
    });
});

describe('tileLink', () => {
    it('uses the explicit link, else the products of the category name', () => {
        expect(tileLink({ link: ' /photo ', name: 'ספלים' })).toBe('/photo');
        expect(tileLink({ name: 'ספלים ומתנות' })).toBe(`/products?category=${encodeURIComponent('ספלים ומתנות')}`);
        expect(tileLink({})).toBe('/products');
        expect(tileLink(null)).toBe('/products');
    });
});

describe('homeEditTiles', () => {
    it('always gives HOME_TILE_COUNT slots, empty ones as null', () => {
        const tiles = homeEditTiles([{ image: 'a' }]);
        expect(tiles).toHaveLength(HOME_TILE_COUNT);
        expect(tiles[0]).toEqual({ image: 'a' });
        expect(tiles.slice(1).every((t) => t === null)).toBe(true);
        expect(homeEditTiles(undefined)).toHaveLength(HOME_TILE_COUNT);
        expect(homeEditTiles(Array(12).fill({}))).toHaveLength(HOME_TILE_COUNT);
    });
});

describe('truncateText and testimonialsOf', () => {
    it('cuts long text only', () => {
        expect(truncateText('abcdef', 3)).toBe('abc...');
        expect(truncateText('abc', 3)).toBe('abc');
        expect(truncateText(null, 3)).toBe('');
    });

    it('uses the defaults until the admin set a list', () => {
        expect(testimonialsOf({})).toBe(DEFAULT_TESTIMONIALS);
        expect(testimonialsOf({ testimonials: [] })).toEqual([]);
    });
});
