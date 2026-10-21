import { useEffect } from 'react';

const NUDGE_STEP_PX = 1;
const NUDGE_STEP_SHIFT_PX = 10;
const ARROW_DELTAS = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };

const isTypingTarget = (target) =>
    target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

/**
 * Keyboard shortcuts on the canvas: Escape (deselect / cancel crop), Delete/Backspace, Ctrl/Cmd+D
 * (duplicate) and the arrows (nudge, 10px with Shift). Ignored while typing in a field or a text.
 */
export function useCanvasKeyboard({
    elements,
    selectedElementId,
    setSelectedElementId,
    editingElementId,
    croppingElementId,
    updateElement,
    onDelete,
    onDuplicate,
    onCancelCrop,
    warnIfOutsideSafeZone,
}) {
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (editingElementId || isTypingTarget(event.target)) return;

            if (event.key === 'Escape') {
                if (croppingElementId) onCancelCrop();
                else setSelectedElementId(null);
                return;
            }

            const selected = elements.find((el) => el.id === selectedElementId);
            if (!selected || croppingElementId) return;

            if (event.key === 'Delete' || event.key === 'Backspace') {
                if (!selected.locked) onDelete();
                return;
            }
            if ((event.key === 'd' || event.key === 'D') && (event.ctrlKey || event.metaKey)) {
                event.preventDefault();
                if (!selected.locked) onDuplicate();
                return;
            }
            const delta = ARROW_DELTAS[event.key];
            if (selected.locked || !delta) return;

            event.preventDefault();
            const step = event.shiftKey ? NUDGE_STEP_SHIFT_PX : NUDGE_STEP_PX;
            const left = selected.left + delta[0] * step;
            const top = selected.top + delta[1] * step;
            updateElement(selectedElementId, { left, top });
            const nextElements = elements.map((el) => (el.id === selectedElementId ? { ...el, left, top } : el));
            window.setTimeout(() => warnIfOutsideSafeZone(nextElements), 0);
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [
        elements,
        selectedElementId,
        editingElementId,
        croppingElementId,
        updateElement,
        onDelete,
        onDuplicate,
        setSelectedElementId,
        onCancelCrop,
        warnIfOutsideSafeZone,
    ]);
}
