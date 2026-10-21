import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    createDefaultTextElement,
    findSavedCanvasSettings,
    getCanvasStorageKey,
    normalizeEditorElements,
} from '../../utils/canvasDimensions';
import { enforceLayerOrder, extractFrameAspectRatio } from '../../utils/editorLayering';
import {
    DEFAULT_PROJECT_NAME,
    clearDraft as clearStoredDraft,
    createDefaultBackground,
    getDraftStorageKeys,
    resolveDraftProductKey,
    safeJsonParse,
    safeStorageSetItem,
    writeDraft,
} from '../../utils/editorDraftStorage';

const STORAGE_FULL_MESSAGE = 'נפח האחסון המקומי מלא. השינויים ימשיכו לעבוד, אבל לא יישמרו מקומית עד לניקוי אחסון בדפדפן.';

/**
 * The design is saved as a draft per product on every change, and restored when the product's canvas
 * opens. A draft belongs to one canvas (product, size, frame, orientation): when the canvas changes,
 * a draft made for another canvas is not applied.
 *
 * Nothing is saved before the product's draft was restored – saving earlier would overwrite it
 * with the empty canvas the page starts with.
 */
export function useEditorDraft({
    selectedProduct,
    productId,
    canvasDimensions,
    activeFrameAspectRatio,
    setActiveFrameAspectRatio,
    orientationFlipped,
    setOrientationFlipped,
    isPerCopyMode,
    design: { elements, canvasBackground, projectName, frameSelection },
    resetHistory,
    setSelectedElementId,
    setCanvasBackground,
    setProjectName,
    setFrameSelection,
}) {
    const draftProductKey = resolveDraftProductKey(selectedProduct, productId);
    const draftKeys = useMemo(() => getDraftStorageKeys(draftProductKey), [draftProductKey]);
    /** The canvas whose draft is on screen (null until the product's draft was restored) */
    const canvasAppliedKeyRef = useRef(null);
    /** The same as a render-safe flag: true once the product's draft is on the canvas */
    const [isCanvasReady, setIsCanvasReady] = useState(false);
    const storageWarningShownRef = useRef(false);

    // Autosave. A design per copy is saved separately (usePerCopyDesign), so the regular draft is left as it was.
    useEffect(() => {
        if (!canvasAppliedKeyRef.current || isPerCopyMode) return;
        const savedElements = safeStorageSetItem(draftKeys.elements, JSON.stringify(elements));
        writeDraft(draftKeys, { background: canvasBackground, projectName, frameSelection: frameSelection || null });

        if (!savedElements && !storageWarningShownRef.current) {
            storageWarningShownRef.current = true;
            alert(STORAGE_FULL_MESSAGE);
        }
    }, [elements, canvasBackground, projectName, frameSelection, draftKeys, isPerCopyMode]);

    // Restore the product's draft when its canvas opens (or start a new design)
    useEffect(() => {
        // Before the product arrives this would apply an empty "no-product" canvas
        if (!selectedProduct) return;
        const storageKey = getCanvasStorageKey(selectedProduct, canvasDimensions, activeFrameAspectRatio, orientationFlipped);
        if (canvasAppliedKeyRef.current === storageKey) return;

        const savedKey = localStorage.getItem(draftKeys.canvasKey);
        const savedElementsRaw = localStorage.getItem(draftKeys.elements);

        if (!canvasAppliedKeyRef.current && savedKey && savedKey !== storageKey && savedElementsRaw) {
            // The page opens unframed and unturned: a draft made with a frame or a turned canvas opens that canvas first
            const saved = findSavedCanvasSettings(selectedProduct, savedKey, safeJsonParse(savedElementsRaw, []));
            if (saved && (saved.frameAspectRatio !== activeFrameAspectRatio || saved.orientationFlipped !== orientationFlipped)) {
                // Open the draft's canvas first; this effect runs again with it and restores the draft
                setActiveFrameAspectRatio(saved.frameAspectRatio);
                setOrientationFlipped(saved.orientationFlipped);
                return;
            }
        }

        const savedBackground = safeJsonParse(localStorage.getItem(draftKeys.background), createDefaultBackground());
        const savedProjectName = localStorage.getItem(draftKeys.projectName) || DEFAULT_PROJECT_NAME;
        let nextElements;

        if (savedKey === storageKey && savedElementsRaw) {
            nextElements = enforceLayerOrder(normalizeEditorElements(
                safeJsonParse(savedElementsRaw, [createDefaultTextElement(canvasDimensions)]),
                canvasDimensions,
            ));
            const savedAspect = extractFrameAspectRatio(nextElements);
            if (savedAspect) setActiveFrameAspectRatio(savedAspect);
            setFrameSelection(safeJsonParse(localStorage.getItem(draftKeys.frameSelection), null));
        } else {
            nextElements = [createDefaultTextElement(canvasDimensions)];
            setFrameSelection(null);
        }

        resetHistory(nextElements);
        setCanvasBackground(savedBackground);
        setProjectName(savedProjectName);
        setSelectedElementId(nextElements[0]?.id || null);

        writeDraft(draftKeys, {
            canvasKey: storageKey,
            elements: nextElements,
            background: savedBackground,
            projectName: savedProjectName,
        });
        canvasAppliedKeyRef.current = storageKey;
        setIsCanvasReady(true);
    // The canvas identity – not the whole product object, which is replaced on every load
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        selectedProduct?._id,
        selectedProduct?.id,
        productId,
        canvasDimensions.width,
        canvasDimensions.height,
        canvasDimensions.widthCm,
        canvasDimensions.heightCm,
        activeFrameAspectRatio,
        orientationFlipped,
        draftKeys,
    ]);

    /** The canvas on screen now belongs to this storage key (a frame, an orientation or a project was applied) */
    const markCanvasApplied = useCallback((storageKey) => {
        canvasAppliedKeyRef.current = storageKey;
        setIsCanvasReady(true);
    }, []);

    /** Saves the canvas right away under its new key, so a refresh restores it (see writeDraft for frameSelection) */
    const saveCanvasDraft = useCallback((storageKey, canvasElements, { frameSelection: selection } = {}) => {
        canvasAppliedKeyRef.current = storageKey;
        writeDraft(draftKeys, { canvasKey: storageKey, elements: canvasElements, frameSelection: selection });
    }, [draftKeys]);

    const clearDraft = useCallback(() => clearStoredDraft(draftKeys), [draftKeys]);

    return { draftProductKey, isCanvasReady, markCanvasApplied, saveCanvasDraft, clearDraft };
}
