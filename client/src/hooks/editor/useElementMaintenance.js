import { useEffect, useMemo } from 'react';
import { fitImageElementBounds, normalizeEditorElements } from '../../utils/canvasDimensions';
import { isMultiDropzoneFrame } from '../../utils/dropzoneUtils';
import { enforceLayerOrder, extractFrameAspectRatio, getActiveGlobalFrame, isGlobalFrame } from '../../utils/editorLayering';
import { prepareFrameImageSrc, punchDropzoneHoles } from '../../utils/frameImageProcessing';

/**
 * Automatic fixes that keep the design valid, without an undo step:
 * the frame image is prepared once (transparent background, holes for collage windows),
 * images never exceed their bounds, and the elements are normalized when the editor opens.
 */
export function useElementMaintenance({
    elements,
    setElements,
    resetHistory,
    setSelectedElementId,
    canvasDimensions,
    activeFrameAspectRatio,
    setActiveFrameAspectRatio,
}) {
    const activeGlobalFrame = useMemo(() => getActiveGlobalFrame(elements), [elements]);
    const activeGlobalFrameId = activeGlobalFrame?.frameId || null;

    useEffect(() => {
        const frame = elements.find(isGlobalFrame);
        if (!frame) return undefined;

        // Already processed with holes / data URL – don't overwrite
        if (frame.holesPunched === 'v2') return undefined;
        if (frame.src?.startsWith('data:') && !isMultiDropzoneFrame(frame)) return undefined;

        let cancelled = false;
        const source = frame.originalSrc || frame.src;

        (async () => {
            try {
                const processed = await prepareFrameImageSrc(source);
                const nextSrc = isMultiDropzoneFrame(frame)
                    ? await punchDropzoneHoles(processed, frame.dropzones)
                    : processed;
                if (cancelled || !nextSrc || nextSrc === frame.src) {
                    // Even if the src is the same, mark it as updated for v2 holes
                    if (!cancelled && isMultiDropzoneFrame(frame) && frame.holesPunched !== 'v2') {
                        setElements((prev) => enforceLayerOrder(
                            prev.map((el) => (isGlobalFrame(el) ? { ...el, holesPunched: 'v2' } : el)),
                        ));
                    }
                    return;
                }
                setElements((prev) => enforceLayerOrder(
                    prev.map((el) => (
                        isGlobalFrame(el)
                            ? {
                                ...el,
                                src: nextSrc,
                                originalSrc: el.originalSrc || source,
                                holesPunched: isMultiDropzoneFrame(el) ? 'v2' : false,
                            }
                            : el
                    )),
                ));
            } catch (err) {
                console.warn('Frame image prepare failed', err);
            }
        })();

        return () => { cancelled = true; };
    // Runs per frame (and per number of its windows), not on every element change
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeGlobalFrameId, activeGlobalFrame?.dropzones?.length]);

    useEffect(() => {
        let changed = false;
        const fixed = elements.map((el) => {
            if (el.type !== 'image') return el;
            const fitted = fitImageElementBounds(el);
            if (fitted !== el) changed = true;
            return fitted;
        });
        if (changed) setElements(enforceLayerOrder(fixed));
    }, [elements, setElements]);

    // Once, when the editor opens
    useEffect(() => {
        const fromElements = extractFrameAspectRatio(elements);
        if (fromElements && fromElements !== activeFrameAspectRatio) {
            setActiveFrameAspectRatio(fromElements);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const normalized = normalizeEditorElements(elements, canvasDimensions);
        if (JSON.stringify(normalized) !== JSON.stringify(elements)) {
            resetHistory(normalized);
            setSelectedElementId(normalized[0]?.id || null);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return { activeGlobalFrame, activeGlobalFrameId };
}
