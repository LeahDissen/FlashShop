import { describe, expect, it } from 'vitest';
import { buildPhotoCartItems, clampPhotoQuantity, toGalleryImage } from './photoCartItems';

const pricing = {
    sizes: [
        { size: '10x15', tiers: [{ minQuantity: 1, price: 2 }, { minQuantity: 10, price: 1.5 }] },
        { size: '13x18', tiers: [{ minQuantity: 1, price: 4 }] },
    ],
};
const image = (id, size, quantity, extra = {}) => ({ id, size, quantity, alt: `${id}.jpg`, src: `https://x/${id}`, crop: { x: 0 }, ...extra });

describe('buildPhotoCartItems', () => {
    it('prices each size by all its prints, including photos already in the cart', () => {
        const { cartItems, printsBySize } = buildPhotoCartItems(
            [image('a', '10x15', 4), image('b', '13x18', 1)],
            pricing,
            [{ itemType: 'photo-print', size: '10x15', quantity: 6 }],
        );
        expect(printsBySize).toEqual({ '10x15': 10, '13x18': 1 });
        expect(cartItems.map((item) => [item.id, item.price, item.quantity])).toEqual([['a', 1.5, 4], ['b', 4, 1]]);
    });

    it('builds the photo-print line with its design details', () => {
        const captions = [{ content: 'שלום', fontFamily: 'Heebo', fontSize: 20, color: '#000', x: 5 }];
        const [item] = buildPhotoCartItems([image('a', undefined, 0, { captions, frameSelection: { id: 'f1' } })], pricing, []).cartItems;
        expect(item).toEqual({
            id: 'a',
            itemType: 'photo-print',
            size: '10x15',
            name: 'פיתוח תמונה 10x15 (a.jpg)',
            price: 2,
            quantity: 1,
            image: 'https://x/a',
            crop: { x: 0 },
            orientation: 'landscape',
            customDesign: {
                printSizeCm: '10x15',
                frameSelection: { id: 'f1' },
                captions: [{ content: 'שלום', fontFamily: 'Heebo', fontSize: 20, color: '#000' }],
            },
        });
    });

    it('leaves out empty captions and frame', () => {
        const [item] = buildPhotoCartItems([image('a', '10x15', 1, { captions: [] })], pricing, []).cartItems;
        expect(item.customDesign).toEqual({ printSizeCm: '10x15', frameSelection: undefined, captions: undefined });
    });
});

describe('gallery helpers', () => {
    it('clamps a typed quantity to a whole number from 1 to 9999', () => {
        expect(clampPhotoQuantity('3.7')).toBe(3);
        expect(clampPhotoQuantity('')).toBe(1);
        expect(clampPhotoQuantity(-2)).toBe(1);
        expect(clampPhotoQuantity(20000)).toBe(9999);
    });

    it('adds an uploaded photo as one print in the default size', () => {
        const item = toGalleryImage({ file: { name: 'p.jpg' }, index: 0, url: 'https://x/p', width: 600, height: 900 });
        expect(item).toMatchObject({ src: 'https://x/p', originalSrc: 'https://x/p', alt: 'p.jpg', quantity: 1, size: '10x15', width: 600, height: 900 });
    });

    it('keeps the photo orientation: portrait stays portrait, landscape and square print landscape', () => {
        const orientationOf = (width, height) => toGalleryImage({ file: { name: 'p.jpg' }, index: 0, url: 'https://x/p', width, height }).orientation;
        expect(orientationOf(600, 900)).toBe('portrait');
        expect(orientationOf(900, 600)).toBe('landscape');
        expect(orientationOf(800, 800)).toBe('landscape');
    });
});

describe('print file', () => {
    const cloudinary = 'https://res.cloudinary.com/demo/image/upload/v1/photo.jpg';

    it('sends a Cloudinary photo as an exact-size file with white margins, in the print orientation', () => {
        const [landscape, portrait] = buildPhotoCartItems([
            image('a', '10x15', 1, { src: cloudinary, orientation: 'landscape' }),
            image('b', '13x18', 1, { src: cloudinary, orientation: 'portrait' }),
        ], pricing, []).cartItems;
        expect(landscape.image).toBe('https://res.cloudinary.com/demo/image/upload/c_pad,b_white,w_1772,h_1181,q_95/v1/photo.jpg');
        expect(portrait.image).toBe('https://res.cloudinary.com/demo/image/upload/c_pad,b_white,w_1535,h_2126,q_95/v1/photo.jpg');
    });

    it('leaves other image addresses as they are', () => {
        const [item] = buildPhotoCartItems([image('a', '10x15', 1, { src: 'data:image/jpeg;base64,xx' })], pricing, []).cartItems;
        expect(item.image).toBe('data:image/jpeg;base64,xx');
    });
});
