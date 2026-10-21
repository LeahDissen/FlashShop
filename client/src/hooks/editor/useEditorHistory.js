import { useCallback, useState } from 'react';
import { enforceLayerOrder } from '../../utils/editorLayering';

/**
 * The design's elements, the selected element and the undo/redo history.
 * Changes made by the customer go through commit() (one undo step each); setElements() changes the
 * elements without a history step (dragging, automatic fixes).
 * @param {() => object[]} createInitialElements
 */
export function useEditorHistory(createInitialElements) {
    const [elements, setElements] = useState(createInitialElements);
    const [history, setHistory] = useState(() => [elements]);
    const [historyIndex, setHistoryIndex] = useState(0);
    const [selectedElementId, setSelectedElementId] = useState(() => elements[0]?.id || null);

    /** A change the customer can undo: layered, applied and added to the history */
    const commit = useCallback((newElements) => {
        const layered = enforceLayerOrder(newElements);
        setElements(layered);
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(layered);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    }, [history, historyIndex]);

    /** Starts over from these elements (a restored draft, a loaded project, another copy) */
    const resetHistory = useCallback((nextElements) => {
        setElements(nextElements);
        setHistory([nextElements]);
        setHistoryIndex(0);
    }, []);

    const undo = useCallback(() => {
        if (historyIndex <= 0) return;
        const prevIndex = historyIndex - 1;
        setHistoryIndex(prevIndex);
        setElements(history[prevIndex]);
        setSelectedElementId(null);
    }, [history, historyIndex]);

    const redo = useCallback(() => {
        if (historyIndex >= history.length - 1) return;
        const nextIndex = historyIndex + 1;
        setHistoryIndex(nextIndex);
        setElements(history[nextIndex]);
        setSelectedElementId(null);
    }, [history, historyIndex]);

    return {
        elements,
        setElements,
        selectedElementId,
        setSelectedElementId,
        selectedElement: elements.find((el) => el.id === selectedElementId) || null,
        commit,
        resetHistory,
        undo,
        redo,
        canUndo: historyIndex > 0,
        canRedo: historyIndex < history.length - 1,
    };
}
