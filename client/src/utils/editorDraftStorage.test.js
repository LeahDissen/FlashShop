import { afterEach, describe, expect, it, vi } from 'vitest';
import {
    clearDraft,
    getCopiesStorageKey,
    getDraftStorageKeys,
    resolveDraftProductKey,
    safeJsonParse,
    safeStorageSetItem,
    writeDraft,
} from './editorDraftStorage';

afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
});

describe('draft keys', () => {
    it('keeps a separate draft per product', () => {
        const keys = getDraftStorageKeys('p1');
        expect(keys).toEqual({
            canvasKey: 'active_editor_canvas_key_p1',
            elements: 'active_editor_elements_p1',
            background: 'active_editor_bg_p1',
            projectName: 'active_editor_name_p1',
            frameSelection: 'active_editor_frame_selection_p1',
        });
        expect(getCopiesStorageKey('p1')).toBe('active_editor_elements_copies_p1');
    });

    it('resolves the product key from the product, the URL id, or a shared key', () => {
        expect(resolveDraftProductKey({ _id: 'a', id: 'b' }, 'c')).toBe('a');
        expect(resolveDraftProductKey({ id: 'b' }, 'c')).toBe('b');
        expect(resolveDraftProductKey(null, 'c')).toBe('c');
        expect(resolveDraftProductKey(null, undefined)).toBe('no-product');
    });
});

describe('writeDraft', () => {
    const keys = getDraftStorageKeys('p1');

    it('writes only the parts it is given', () => {
        localStorage.setItem(keys.projectName, 'קודם');
        writeDraft(keys, { canvasKey: 'k', elements: [{ id: 'x' }] });
        expect(localStorage.getItem(keys.canvasKey)).toBe('k');
        expect(JSON.parse(localStorage.getItem(keys.elements))).toEqual([{ id: 'x' }]);
        expect(localStorage.getItem(keys.projectName)).toBe('קודם');
    });

    it('removes the frame choice for null and keeps it for undefined', () => {
        writeDraft(keys, { frameSelection: { frameId: 'f' } });
        writeDraft(keys, { elements: [] });
        expect(JSON.parse(localStorage.getItem(keys.frameSelection))).toEqual({ frameId: 'f' });
        writeDraft(keys, { frameSelection: null });
        expect(localStorage.getItem(keys.frameSelection)).toBeNull();
    });

    it('clearDraft removes every part of the draft and nothing else', () => {
        writeDraft(keys, { canvasKey: 'k', elements: [], background: {}, projectName: 'n', frameSelection: {} });
        localStorage.setItem('other', '1');
        clearDraft(keys);
        Object.values(keys).forEach((key) => expect(localStorage.getItem(key)).toBeNull());
        expect(localStorage.getItem('other')).toBe('1');
    });
});

describe('safe storage', () => {
    it('falls back on broken JSON', () => {
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        expect(safeJsonParse('{broken', 'fallback')).toBe('fallback');
        expect(safeJsonParse(null, 'fallback')).toBe('fallback');
        expect(safeJsonParse('[1]', [])).toEqual([1]);
    });

    it('reports a full storage instead of throwing', () => {
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
            throw Object.assign(new Error('full'), { name: 'QuotaExceededError' });
        });
        expect(safeStorageSetItem('k', 'v')).toBe(false);
    });

    it('rethrows any other storage error', () => {
        vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
            throw new Error('denied');
        });
        expect(() => safeStorageSetItem('k', 'v')).toThrow('denied');
    });
});
