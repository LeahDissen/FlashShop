import { describe, expect, it } from 'vitest';
import { parseTipStart, splitTips } from './tipsDocx';

const img = (name) => `<p><img src="data:image/png;base64,${name}"></p>`;
const src = (name) => `data:image/png;base64,${name}`;

describe('splitTips', () => {
    it('uses an image before any text as the main image only, and marks the others at their place', () => {
        const html = `<p>1. צילום באור טבעי</p>${img('cover')}<p>תמונה טובה:</p>${img('good')}<p>ותמונה לא טובה:</p>${img('bad')}<p>2. רקע</p><p>רקע נקי</p>`;
        const [first, second] = splitTips(html);
        expect(first).toEqual({
            number: 1,
            title: 'צילום באור טבעי',
            mainImage: src('cover'),
            images: [src('good'), src('bad')],
            content: 'תמונה טובה:\n[[תמונה 1]]\nותמונה לא טובה:\n[[תמונה 2]]',
        });
        expect(second).toMatchObject({ number: 2, title: 'רקע', content: 'רקע נקי', mainImage: '', images: [] });
    });

    it('keeps a first image that comes after text in its place too (it is also the main image)', () => {
        const [tip] = splitTips(`<p>1. צורות</p><p>כך זה נראה היום:</p>${img('bad')}<p>וכך זה צריך להיראות:</p>${img('good')}`);
        expect(tip.mainImage).toBe(src('bad'));
        expect(tip.images).toEqual([src('bad'), src('good')]);
        expect(tip.content).toBe('כך זה נראה היום:\n[[תמונה 1]]\nוכך זה צריך להיראות:\n[[תמונה 2]]');
    });

    it('reads a document of one tip without a number, titled by its first line or the file name', () => {
        const [tip] = splitTips(`<p>איך מצלמים מוצר</p><p>שורה ראשונה</p>${img('a')}`, 'טיפ.docx');
        expect(tip).toMatchObject({ number: 1, title: 'איך מצלמים מוצר', mainImage: src('a'), images: [src('a')], content: 'שורה ראשונה\n[[תמונה 1]]' });
        expect(splitTips(img('only'), 'הטיפ שלי.docx')[0]).toMatchObject({ title: 'הטיפ שלי', mainImage: src('only'), images: [] });
        expect(splitTips('', 'ריק.docx')).toEqual([]);
    });

    it('lists nested bullets once each', () => {
        const [tip] = splitTips('<p>1. פתרון</p><ul><li>ראשי<ul><li>משני א</li><li>משני ב</li></ul></li></ul>');
        expect(tip.content).toBe('• ראשי\n• משני א\n• משני ב');
    });
});

describe('parseTipStart', () => {
    it('recognises numbered tips but not sub-sections or years', () => {
        expect(parseTipStart('טיפ מס\' 3 תאורה')).toEqual({ number: 3, title: 'תאורה' });
        expect(parseTipStart('1.1 פרט')).toBeNull();
        expect(parseTipStart('2024 הייתה שנה')).toBeNull();
    });
});
