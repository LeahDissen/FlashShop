import { useCallback, useState } from 'react';
import { getCanvasDimensions, getCanvasStorageKey, scaleElementsToCanvas } from '../../utils/canvasDimensions';
import { fitImageToDropzone, isMultiDropzoneFrame, resolveDropzones } from '../../utils/dropzoneUtils';
import { enforceLayerOrder, getActiveGlobalFrame, isDropzoneImage, isGlobalFrame } from '../../utils/editorLayering';
import {
    getOrientation,
    getTargetOrientation,
    orientationsConflict,
    rotateImageElement90,
} from '../../utils/orientationMatching';

/** The elements moved to a canvas of another size; the frame covers it, and collage photos refit their windows */
function fitElementsToCanvas(elements, fromCanvas, toCanvas) {
    let updated = scaleElementsToCanvas(elements, fromCanvas.width, fromCanvas.height, toCanvas.width, toCanvas.height)
        .map((el) => (isGlobalFrame(el) ? { ...el, width: toCanvas.width, height: toCanvas.height, top: 0, left: 0 } : el));

    const frame = updated.find(isGlobalFrame);
    if (frame && isMultiDropzoneFrame(frame)) {
        const zones = resolveDropzones(frame.dropzones, frame.width, frame.height, frame.left ?? 0, frame.top ?? 0);
        updated = updated.map((el) => {
            if (!isDropzoneImage(el)) return el;
            const zone = zones.find((z) => z.id === el.dropzoneId);
            return zone ? { ...el, ...fitImageToDropzone(el.naturalWidth, el.naturalHeight, zone) } : el;
        });
    }
    return enforceLayerOrder(updated);
}

/**
 * Turning the canvas (products that allow it), and the notice shown when a photo's orientation
 * does not match the frame or canvas, with a one-click 90° rotation.
 */
export function useOrientationTools({
    elements,
    commit,
    setSelectedElementId,
    selectedProduct,
    canvasDimensions,
    activeFrameAspectRatio,
    orientationFlipped,
    setOrientationFlipped,
    setFrameSelection,
    saveCanvasDraft,
}) {
    /** { elementId, imageOrientation, targetOrientation } while a photo does not match, else null */
    const [orientationNotice, setOrientationNotice] = useState(null);

    const handleToggleOrientation = useCallback(() => {
        if (!selectedProduct?.allowOrientationToggle) return;
        const nextFlipped = !orientationFlipped;
        const nextCanvas = getCanvasDimensions(selectedProduct, activeFrameAspectRatio, nextFlipped);
        const layered = fitElementsToCanvas(elements, canvasDimensions, nextCanvas);

        saveCanvasDraft(getCanvasStorageKey(selectedProduct, nextCanvas, activeFrameAspectRatio, nextFlipped), layered);
        setOrientationFlipped(nextFlipped);
        commit(layered);
        setSelectedElementId(null);
    }, [
        selectedProduct,
        canvasDimensions,
        orientationFlipped,
        activeFrameAspectRatio,
        elements,
        commit,
        saveCanvasDraft,
        setOrientationFlipped,
        setSelectedElementId,
    ]);

    /** Checks a newly added photo against the frame (or the canvas) */
    const detectOrientationMismatch = useCallback((elementId, naturalWidth, naturalHeight) => {
        const imageOrientation = getOrientation(naturalWidth, naturalHeight);
        const targetOrientation = getTargetOrientation(getActiveGlobalFrame(elements), canvasDimensions);
        setOrientationNotice(orientationsConflict(imageOrientation, targetOrientation)
            ? { elementId, imageOrientation, targetOrientation }
            : null);
    }, [elements, canvasDimensions]);

    const handleRotateToMatchOrientation = useCallback(() => {
        if (!orientationNotice?.elementId) return;
        const target = elements.find((el) => el.id === orientationNotice.elementId);
        if (!target) {
            setOrientationNotice(null);
            return;
        }
        const rotated = rotateImageElement90(target, canvasDimensions.width, canvasDimensions.height);
        commit(elements.map((el) => (el.id === rotated.id ? rotated : el)));
        setSelectedElementId(rotated.id);
        setFrameSelection((prev) => (prev ? { ...prev, rotationApplied: true } : prev));
        setOrientationNotice(null);
    }, [orientationNotice, elements, canvasDimensions, commit, setSelectedElementId, setFrameSelection]);

    const dismissOrientationNotice = useCallback(() => {
        setFrameSelection((prev) => (prev ? { ...prev, rotationApplied: false } : prev));
        setOrientationNotice(null);
    }, [setFrameSelection]);

    return {
        orientationNotice,
        setOrientationNotice,
        handleToggleOrientation,
        detectOrientationMismatch,
        handleRotateToMatchOrientation,
        dismissOrientationNotice,
    };
}
