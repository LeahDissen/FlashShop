import { useCallback } from 'react';
import { getCanvasStorageKey } from '../../utils/canvasDimensions';
import { detectEmptyPhotoSlots } from '../../utils/detectEmptyPhotoSlots';
import {
    enforceLayerOrder,
    getActiveGlobalFrame,
    isGlobalFrame,
    removeDropzoneImages,
    removeGlobalFrames,
    stripLegacyDropzoneFields,
} from '../../utils/editorLayering';
import { prepareFrameImageSrc, punchDropzoneHoles } from '../../utils/frameImageProcessing';
import { getCanvasOrientation, getFrameOrientation } from '../../utils/orientationMatching';

/** A frame laid over the whole canvas; a collage frame has windows (dropzones) for the photos */
function buildFrameElement(frame, { src, dropzones, isMulti, printSize, canvas }) {
    // Fixed frame: an overlay layer spanning the whole canvas that the customer cannot move
    const isFixedOverlay = frame.isFixedOverlay !== false;
    return {
        id: `globalFrame_${frame._id}`,
        type: 'globalFrame',
        frameId: frame._id,
        src,
        originalSrc: frame.imageUrl,
        title: frame.title,
        aspectRatio: frame.aspectRatio,
        frameOrientation: getFrameOrientation(frame),
        printSizeKey: frame.printSizeKey || printSize?.key || '',
        isFixedOverlay,
        layoutType: isMulti ? 'multi_dropzone' : 'single_overlay',
        dropzones: isMulti ? dropzones : [],
        holesPunched: isMulti ? 'v2' : false,
        width: canvas.width,
        height: canvas.height,
        top: 0,
        left: 0,
        opacity: 1,
        rotation: 0,
        locked: isFixedOverlay,
    };
}

/** Windows defined on the frame, or – when none are – empty squares detected in its image (collage templates) */
async function resolveFrameLayout(frame) {
    let dropzones = Array.isArray(frame.dropzones) ? frame.dropzones : [];
    let layoutType = frame.layoutType === 'multi_dropzone' ? 'multi_dropzone' : 'single_overlay';
    if (dropzones.length === 0) {
        try {
            const detected = await detectEmptyPhotoSlots(frame.imageUrl || frame.thumbnailUrl);
            if (detected.length >= 2) {
                dropzones = detected;
                layoutType = 'multi_dropzone';
            }
        } catch (err) {
            console.warn('Auto slot detection failed', err);
        }
    }
    return { dropzones, isMulti: layoutType === 'multi_dropzone' && dropzones.length > 0 };
}

/**
 * Choosing, removing and selecting the canvas frame. The frame choice (size, orientation, frame)
 * is kept as frameSelection and saved with the order.
 */
export function useGlobalFrame({
    elements,
    commit,
    setSelectedElementId,
    selectedProduct,
    canvasDimensions,
    orientationFlipped,
    printSizeLabel,
    setActiveFrameAspectRatio,
    setFrameSelection,
    setOrientationNotice,
    saveCanvasDraft,
}) {
    const applyGlobalFrame = useCallback(async (frame, printSize = null, requestedOrientation = null) => {
        const canvas = canvasDimensions;
        const { dropzones, isMulti } = await resolveFrameLayout(frame);

        const withoutFrame = isMulti
            ? removeDropzoneImages(removeGlobalFrames(elements))
            : stripLegacyDropzoneFields(removeDropzoneImages(removeGlobalFrames(elements)));

        const processedSrc = await prepareFrameImageSrc(frame.imageUrl);
        const src = isMulti ? await punchDropzoneHoles(processedSrc, dropzones) : processedSrc;
        const frameElement = buildFrameElement(frame, { src, dropzones, isMulti, printSize, canvas });
        const layered = enforceLayerOrder([...withoutFrame, frameElement]);

        const selection = {
            frameId: frame._id,
            frameTitle: frame.title,
            frameImageUrl: frame.imageUrl,
            frameCategory: frame.category,
            aspectRatio: frame.aspectRatio,
            printSizeKey: frame.printSizeKey || printSize?.key || '',
            printSizeLabel: printSize?.label || printSizeLabel,
            frameOrientation: getFrameOrientation(frame) || requestedOrientation || null,
            requestedOrientation: requestedOrientation || null,
            canvasOrientation: getCanvasOrientation(canvas),
            orientationFlipped,
            layoutType: frameElement.layoutType,
            isFixedOverlay: frameElement.isFixedOverlay,
            selectedAt: new Date().toISOString(),
        };

        saveCanvasDraft(
            getCanvasStorageKey(selectedProduct, canvas, frame.aspectRatio, orientationFlipped),
            layered,
            { frameSelection: selection },
        );
        commit(layered);
        setSelectedElementId(frameElement.isFixedOverlay ? null : frameElement.id);
        setActiveFrameAspectRatio(frame.aspectRatio);
        setFrameSelection(selection);
        setOrientationNotice(null);
    }, [
        elements,
        selectedProduct,
        canvasDimensions,
        orientationFlipped,
        printSizeLabel,
        commit,
        saveCanvasDraft,
        setSelectedElementId,
        setActiveFrameAspectRatio,
        setFrameSelection,
        setOrientationNotice,
    ]);

    /** Finds the empty windows in the current frame's image and turns it into a collage frame */
    const detectSlotsOnActiveFrame = useCallback(async () => {
        const frame = getActiveGlobalFrame(elements);
        if (!frame) {
            alert('יש לבחור מסגרת קודם');
            return;
        }
        const source = frame.originalSrc || frame.src;
        if (!source) return;

        try {
            const detected = await detectEmptyPhotoSlots(source);
            if (!detected.length) {
                alert('לא נמצאו ריבועים ריקים במסגרת');
                return;
            }
            const punchedSrc = await punchDropzoneHoles(await prepareFrameImageSrc(source), detected);
            const updated = removeDropzoneImages(elements).map((el) => (
                isGlobalFrame(el)
                    ? {
                        ...el,
                        src: punchedSrc,
                        originalSrc: el.originalSrc || source,
                        layoutType: 'multi_dropzone',
                        dropzones: detected,
                        holesPunched: 'v2',
                    }
                    : el
            ));
            commit(enforceLayerOrder(updated));
            setSelectedElementId(null);
        } catch (err) {
            console.error(err);
            alert('שגיאה בזיהוי חלונות מהמסגרת');
        }
    }, [elements, commit, setSelectedElementId]);

    const removeGlobalFrame = useCallback(() => {
        if (!elements.some(isGlobalFrame)) return;
        const layered = enforceLayerOrder(stripLegacyDropzoneFields(removeDropzoneImages(removeGlobalFrames(elements))));

        saveCanvasDraft(
            getCanvasStorageKey(selectedProduct, canvasDimensions, null, orientationFlipped),
            layered,
            { frameSelection: null },
        );
        commit(layered);
        setSelectedElementId(null);
        setActiveFrameAspectRatio(null);
        setFrameSelection(null);
        setOrientationNotice(null);
    }, [
        elements,
        selectedProduct,
        canvasDimensions,
        orientationFlipped,
        commit,
        saveCanvasDraft,
        setSelectedElementId,
        setActiveFrameAspectRatio,
        setFrameSelection,
        setOrientationNotice,
    ]);

    const selectGlobalFrame = useCallback(() => {
        const frame = getActiveGlobalFrame(elements);
        if (frame) setSelectedElementId(frame.id);
    }, [elements, setSelectedElementId]);

    return { applyGlobalFrame, detectSlotsOnActiveFrame, removeGlobalFrame, selectGlobalFrame };
}
