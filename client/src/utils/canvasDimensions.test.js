import { describe, expect, it } from 'vitest';
import { getCanvasDimensions, normalizeEditorElements } from './canvasDimensions';

const dims = getCanvasDimensions({ printWidth: 28, printHeight: 20 });
const PLACEHOLDER = 'טקסט ניתן לעריכה';
const text = (id, content, extra = {}) => ({ id, type: 'text', content, width: 200, height: 60, left: 30, top: 40, fontSize: 30, ...extra });
const image = (id) => ({ id, type: 'image', src: `https://x/${id}.jpg`, width: 100, height: 100, left: 0, top: 0 });

describe('normalizeEditorElements', () => {
    it('gives an empty design the placeholder text', () => {
        const result = normalizeEditorElements([], dims);
        expect(result).toHaveLength(1);
        expect(result[0]).toMatchObject({ type: 'text', content: PLACEHOLDER });
    });

    it('keeps every text box the customer wrote in', () => {
        const result = normalizeEditorElements([text('a', 'שלום'), text('b', 'עולם')], dims);
        expect(result.map((el) => el.content)).toEqual(['שלום', 'עולם']);
    });

    it('drops placeholders when something was written, and keeps one when nothing was', () => {
        expect(normalizeEditorElements([text('a', PLACEHOLDER), text('b', 'שלום')], dims).map((el) => el.id)).toEqual(['b']);
        expect(normalizeEditorElements([text('a', PLACEHOLDER), text('b', PLACEHOLDER)], dims).map((el) => el.id)).toEqual(['a']);
    });

    it('keeps the layer order (a text in front of a photo stays in front)', () => {
        const result = normalizeEditorElements([image('photo'), text('t', 'שלום')], dims);
        expect(result.map((el) => el.id)).toEqual(['photo', 't']);
    });

    it('keeps captions and other elements as they are', () => {
        const caption = text('c', 'כיתוב', { role: 'caption', width: 10 });
        const result = normalizeEditorElements([text('t', 'שלום'), caption, image('p')], dims);
        expect(result).toContainEqual(caption);
        expect(result.find((el) => el.id === 'p')).toEqual(image('p'));
    });

    it('adds the placeholder at the back of a design without a text box', () => {
        const result = normalizeEditorElements([image('p')], dims);
        expect(result.map((el) => el.type)).toEqual(['text', 'image']);
    });

    it('a written text keeps its place; one too small to see gets the default size', () => {
        const [kept] = normalizeEditorElements([text('t', 'שלום', { left: 77, top: 88 })], dims);
        expect(kept).toMatchObject({ left: 77, top: 88, width: 200, height: 60, locked: false });
        const [tiny] = normalizeEditorElements([text('t', 'שלום', { width: 5, height: 5 })], dims);
        expect(tiny.width).toBeGreaterThan(40);
        expect(tiny.height).toBeGreaterThan(24);
    });
});
