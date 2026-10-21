import { useCallback, useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';

/** After leaving a text, the safe-zone check waits for the final text size */
const SAFE_ZONE_CHECK_DELAY_MS = 150;

/**
 * Editing a text box in place (contentEditable). Entering edit mode happens synchronously inside the
 * user's tap, so the phone keyboard opens; the text is selected for typing over it.
 */
export function useTextEditing({ elements, setSelectedElementId, updateElement, onEditEnd }) {
    const [editingElementId, setEditingElementId] = useState(null);
    const textNodesRef = useRef({});
    const elementsRef = useRef(elements);
    elementsRef.current = elements;

    const registerTextNode = useCallback((elementId, node) => {
        if (node) textNodesRef.current[elementId] = node;
    }, []);

    const focusTextEditor = useCallback((elementId) => {
        const node = textNodesRef.current[elementId];
        const element = elementsRef.current.find((el) => el.id === elementId);
        if (!node || element?.type !== 'text') return false;

        if (node.textContent !== element.content) node.textContent = element.content;
        node.focus({ preventScroll: true });
        try {
            const range = document.createRange();
            range.selectNodeContents(node);
            const selection = window.getSelection();
            selection?.removeAllRanges();
            selection?.addRange(range);
        } catch {
            // Some mobile browsers don't support range selection on contentEditable
        }
        return true;
    }, []);

    const startTextEditing = useCallback((elementId) => {
        const element = elementsRef.current.find((el) => el.id === elementId);
        if (!element || element.type !== 'text' || element.locked) return;
        flushSync(() => {
            setSelectedElementId(elementId);
            setEditingElementId(elementId);
        });
        if (!focusTextEditor(elementId)) {
            window.requestAnimationFrame(() => focusTextEditor(elementId));
        }
    }, [focusTextEditor, setSelectedElementId]);

    // Fallback when the editable node was not ready yet right after flushSync
    useEffect(() => {
        if (!editingElementId) return undefined;
        const timer = window.setTimeout(() => focusTextEditor(editingElementId), 0);
        return () => window.clearTimeout(timer);
    }, [editingElementId, focusTextEditor]);

    const handleTextInput = useCallback((elementId, content) => {
        updateElement(elementId, { content });
    }, [updateElement]);

    const handleTextBlur = useCallback((event, elementId) => {
        updateElement(elementId, { content: event.currentTarget.innerText });
        setEditingElementId(null);
        window.setTimeout(() => onEditEnd?.(), SAFE_ZONE_CHECK_DELAY_MS);
    }, [updateElement, onEditEnd]);

    return { editingElementId, startTextEditing, registerTextNode, handleTextInput, handleTextBlur };
}
