import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useEditorHistory } from './useEditorHistory';

const text = (id) => ({ id, type: 'text', content: id });

describe('useEditorHistory', () => {
    it('starts with the initial elements, the first one selected', () => {
        const { result } = renderHook(() => useEditorHistory(() => [text('a')]));
        expect(result.current.elements.map((el) => el.id)).toEqual(['a']);
        expect(result.current.selectedElementId).toBe('a');
        expect(result.current.canUndo).toBe(false);
    });

    it('undoes and redoes committed changes, clearing the selection', () => {
        const { result } = renderHook(() => useEditorHistory(() => [text('a')]));
        act(() => result.current.commit([text('a'), text('b')]));
        act(() => result.current.commit([text('a'), text('b'), text('c')]));
        expect(result.current.elements).toHaveLength(3);

        act(() => result.current.undo());
        expect(result.current.elements).toHaveLength(2);
        expect(result.current.selectedElementId).toBeNull();
        expect(result.current.canRedo).toBe(true);

        act(() => result.current.redo());
        expect(result.current.elements).toHaveLength(3);
        expect(result.current.canRedo).toBe(false);
    });

    it('drops the redo steps after a new change', () => {
        const { result } = renderHook(() => useEditorHistory(() => [text('a')]));
        act(() => result.current.commit([text('a'), text('b')]));
        act(() => result.current.undo());
        act(() => result.current.commit([text('a'), text('z')]));
        expect(result.current.canRedo).toBe(false);
        act(() => result.current.undo());
        expect(result.current.elements.map((el) => el.id)).toEqual(['a']);
    });

    it('live edits (setElements) are not undo steps', () => {
        const { result } = renderHook(() => useEditorHistory(() => [text('a')]));
        act(() => result.current.setElements([text('moved')]));
        expect(result.current.canUndo).toBe(false);
    });

    it('resetHistory starts over from the given elements', () => {
        const { result } = renderHook(() => useEditorHistory(() => [text('a')]));
        act(() => result.current.commit([text('a'), text('b')]));
        act(() => result.current.resetHistory([text('restored')]));
        expect(result.current.elements.map((el) => el.id)).toEqual(['restored']);
        expect(result.current.canUndo).toBe(false);
    });

    it('exposes the selected element', () => {
        const { result } = renderHook(() => useEditorHistory(() => [text('a'), text('b')]));
        act(() => result.current.setSelectedElementId('b'));
        expect(result.current.selectedElement.id).toBe('b');
        act(() => result.current.setSelectedElementId('missing'));
        expect(result.current.selectedElement).toBeNull();
    });
});
