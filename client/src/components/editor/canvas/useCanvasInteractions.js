import { useCallback, useEffect, useRef, useState } from 'react';
import { angleAround, resizeFromHandle, TEXT_DRAG_THRESHOLD_PX } from './canvasGeometry';

/** A click right after pressing an element must not count as a click on the empty canvas */
const DESELECT_GUARD_MS = 400;
const RESIZABLE_TYPES = ['image', 'shape', 'globalFrame'];

const IDLE_DRAG = {
    isDragging: false,
    pendingDrag: false,
    elementId: null,
    initialMouseX: 0,
    initialMouseY: 0,
    initialTop: 0,
    initialLeft: 0,
    wasAlreadySelected: false,
    didMove: false,
};

/** The pointer position of a mouse, pen or touch event */
const pointerOf = (event) => event.touches?.[0] || event.changedTouches?.[0] || event;

/**
 * Moving, rotating and resizing elements with the mouse or a finger. While an interaction runs,
 * window-level listeners follow the pointer; the element is updated live (no undo step per move).
 * A text box starts moving only after a small threshold, so a second tap can open text editing.
 */
export function useCanvasInteractions({
    scale,
    updateElement,
    selectedElementId,
    setSelectedElementId,
    croppingElementId,
    editingElementId,
    onInteractionEnd,
}) {
    const [isInteracting, setIsInteracting] = useState(false);
    const dragRef = useRef({ ...IDLE_DRAG });
    const rotationRef = useRef({ isRotating: false, elementId: null, centerX: 0, centerY: 0, startAngle: 0, initialRotation: 0 });
    const resizeRef = useRef({ isResizing: false, elementId: null });
    /** The last press, to recognize a second tap on a text (mobile) */
    const lastTapRef = useRef({ elementId: null, wasAlreadySelected: false, didMove: false });
    const deselectGuardUntilRef = useRef(0);
    const wasInteractingRef = useRef(false);
    const onInteractionEndRef = useRef(onInteractionEnd);
    onInteractionEndRef.current = onInteractionEnd;

    useEffect(() => {
        if (!isInteracting) return undefined;
        wasInteractingRef.current = true;

        const handleMove = (event) => {
            const { clientX, clientY } = pointerOf(event);
            const drag = dragRef.current;
            const rotation = rotationRef.current;
            const resize = resizeRef.current;

            if (drag.isDragging && drag.elementId) {
                updateElement(drag.elementId, {
                    top: drag.initialTop + (clientY - drag.initialMouseY) / scale,
                    left: drag.initialLeft + (clientX - drag.initialMouseX) / scale,
                });
            } else if (drag.elementId && drag.pendingDrag) {
                if (Math.hypot(clientX - drag.initialMouseX, clientY - drag.initialMouseY) > TEXT_DRAG_THRESHOLD_PX) {
                    drag.isDragging = true;
                    drag.pendingDrag = false;
                    drag.didMove = true;
                }
            } else if (rotation.isRotating && rotation.elementId) {
                const angle = angleAround(rotation.centerX, rotation.centerY, clientX, clientY);
                updateElement(rotation.elementId, { rotation: rotation.initialRotation + (angle - rotation.startAngle) });
            } else if (resize.isResizing && resize.elementId) {
                const dx = (clientX - resize.initialMouseX) / scale;
                const dy = (clientY - resize.initialMouseY) / scale;
                updateElement(resize.elementId, resizeFromHandle(resize, dx, dy));
            }
        };

        const handleUp = () => {
            const drag = dragRef.current;
            if (drag.elementId || rotationRef.current.isRotating || resizeRef.current.isResizing) {
                lastTapRef.current = {
                    elementId: drag.elementId,
                    wasAlreadySelected: drag.wasAlreadySelected,
                    didMove: Boolean(drag.didMove || drag.isDragging),
                };
            }

            const didInteract = wasInteractingRef.current;
            setIsInteracting(false);
            if (drag.isDragging || drag.pendingDrag || drag.elementId) {
                dragRef.current = { ...drag, isDragging: false, pendingDrag: false, elementId: null, didMove: false };
            }
            if (rotationRef.current.isRotating) {
                rotationRef.current = { ...rotationRef.current, isRotating: false, elementId: null };
            }
            if (resizeRef.current.isResizing) {
                resizeRef.current = { ...resizeRef.current, isResizing: false, elementId: null };
            }
            if (didInteract) onInteractionEndRef.current?.();
            wasInteractingRef.current = false;
        };

        window.addEventListener('pointermove', handleMove);
        window.addEventListener('pointerup', handleUp);
        window.addEventListener('pointercancel', handleUp);
        // Fallback for old browsers without full Pointer Events
        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleUp);
        return () => {
            window.removeEventListener('pointermove', handleMove);
            window.removeEventListener('pointerup', handleUp);
            window.removeEventListener('pointercancel', handleUp);
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('mouseup', handleUp);
        };
    }, [isInteracting, scale, updateElement]);

    /** Pressing an element selects it and starts moving it (a text: after the threshold) */
    const startDrag = useCallback((event, el) => {
        if (el.id === croppingElementId || el.locked) return;
        if (el.type === 'text' && el.id === editingElementId) return;

        event.stopPropagation();
        deselectGuardUntilRef.current = Date.now() + DESELECT_GUARD_MS;
        const point = event.touches?.[0] || event;
        const wasAlreadySelected = selectedElementId === el.id;
        // On an already selected text the default is kept, so the phone can focus it for typing
        if (!(el.type === 'text' && wasAlreadySelected)) event.preventDefault();

        setSelectedElementId(el.id);
        dragRef.current = {
            isDragging: el.type !== 'text',
            pendingDrag: el.type === 'text',
            elementId: el.id,
            initialMouseX: point.clientX,
            initialMouseY: point.clientY,
            initialTop: el.top,
            initialLeft: el.left,
            wasAlreadySelected,
            didMove: false,
            dropzoneId: el.dropzoneId || null,
        };
        setIsInteracting(true);
    }, [croppingElementId, editingElementId, selectedElementId, setSelectedElementId]);

    /** The rotate handle: the element turns around its center following the pointer */
    const startRotation = useCallback((event, el) => {
        if (el.locked) return;
        event.preventDefault();
        event.stopPropagation();
        const wrapper = event.currentTarget.parentElement;
        if (!wrapper) return;
        const rect = wrapper.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        rotationRef.current = {
            isRotating: true,
            elementId: el.id,
            centerX,
            centerY,
            startAngle: angleAround(centerX, centerY, event.clientX, event.clientY),
            initialRotation: el.rotation || 0,
        };
        setIsInteracting(true);
    }, []);

    /** A corner handle: photos keep their natural proportions, other elements their current ones */
    const startResize = useCallback((event, el, handle) => {
        if (el.locked || !RESIZABLE_TYPES.includes(el.type)) return;
        event.preventDefault();
        event.stopPropagation();
        resizeRef.current = {
            isResizing: true,
            elementId: el.id,
            handle,
            initialWidth: el.width,
            initialHeight: el.height,
            initialTop: el.top,
            initialLeft: el.left,
            initialRotation: el.rotation || 0,
            initialMouseX: event.clientX,
            initialMouseY: event.clientY,
            aspectRatio: el.type === 'image' && el.naturalWidth > 0 && el.naturalHeight > 0
                ? el.naturalWidth / el.naturalHeight
                : el.width / el.height,
        };
        setIsInteracting(true);
    }, []);

    /** A tap on a text that was already selected and did not move: open it for typing */
    const isSecondTapOnText = useCallback((el) => {
        const tap = lastTapRef.current;
        return el.type === 'text' && !el.locked && tap.elementId === el.id && tap.wasAlreadySelected && !tap.didMove;
    }, []);

    /** True right after an element was pressed, when a click on the empty canvas must be ignored */
    const isDeselectGuarded = useCallback(() => Date.now() < deselectGuardUntilRef.current, []);

    return { startDrag, startRotation, startResize, isSecondTapOnText, isDeselectGuarded };
}
