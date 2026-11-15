import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { areaFilesStorageKey, areaProduct, mainProduct } from '../../utils/designAreas';
import { safeJsonParse, safeStorageSetItem } from '../../utils/editorDraftStorage';
import { uploadFilesInParallel } from '../../utils/uploadQueue';

/** Time for the canvas to show the area's design before anything is captured */
const AREA_RENDER_DELAY_MS = 300;

const dataUrlToFile = async (dataUrl, name) => {
    const blob = await (await fetch(dataUrl)).blob();
    return new File([blob], name, { type: 'image/png' });
};

/**
 * Extra design areas (e.g. a shirt's back). The main design is the regular one; the customer may open
 * any extra area, which becomes its own canvas (the product with the area's size, see areaProduct).
 * Leaving an area captures it and uploads its print file; the uploaded files are kept per product until
 * the order, so the order line carries every area she designed. "המשך" from an area goes back to the
 * main design first, since the order is made from there.
 */
export function useDesignAreas({ enabled, selectedProduct, selectProduct, captureCanvasImage, setIsSaving, openPreview, resetCanvasLayout }) {
    const base = mainProduct(selectedProduct);
    const productId = base?._id || base?.id || null;
    const baseAreas = base?.designAreas;
    const areas = useMemo(() => (enabled && Array.isArray(baseAreas) ? baseAreas : []), [enabled, baseAreas]);
    const activeArea = selectedProduct?.designArea || null;
    const storageKey = productId ? areaFilesStorageKey(productId) : null;

    /** { [areaName]: { image, widthCm, heightCm } } – the uploaded print file of each designed area */
    const [areaFiles, setAreaFiles] = useState({});
    useEffect(() => {
        setAreaFiles(storageKey ? safeJsonParse(localStorage.getItem(storageKey), {}) || {} : {});
    }, [storageKey]);
    const saveAreaFiles = useCallback((next) => {
        setAreaFiles(next);
        if (storageKey) safeStorageSetItem(storageKey, JSON.stringify(next));
    }, [storageKey]);

    /** Captures the area on the canvas and uploads it as that area's print file */
    const captureActiveArea = useCallback(async () => {
        if (!activeArea) return areaFiles;
        const area = areas.find((a) => a.name === activeArea);
        const dataUrl = await captureCanvasImage();
        if (!dataUrl || !area) return areaFiles;
        const file = await dataUrlToFile(dataUrl, `area-${area.name}.png`);
        const { uploaded, failed } = await uploadFilesInParallel([file]);
        if (failed.length) throw failed[0].error;
        const next = {
            ...areaFiles,
            [area.name]: { image: uploaded[0].url, widthCm: area.printWidth, heightCm: area.printHeight },
        };
        saveAreaFiles(next);
        return next;
    }, [activeArea, areas, areaFiles, captureCanvasImage, saveAreaFiles]);

    /** Set by "המשך" on an area: the main design's preview opens once it is back on the canvas */
    const pendingPreviewRef = useRef(false);
    const switchArea = useCallback(async (areaName) => {
        if ((areaName || null) === activeArea || !base) return;
        setIsSaving(true);
        try {
            await captureActiveArea();
            const target = areas.find((a) => a.name === areaName);
            // Each area opens unframed and unturned; its draft then reopens its own frame/orientation
            resetCanvasLayout();
            selectProduct(target ? areaProduct(base, target) : base);
        } catch (error) {
            pendingPreviewRef.current = false;
            console.error('Saving the design area failed', error);
            alert('לא הצלחנו לשמור את העיצוב של השטח הזה. נסו שוב.');
        } finally {
            setIsSaving(false);
        }
    }, [activeArea, base, areas, captureActiveArea, selectProduct, setIsSaving, resetCanvasLayout]);

    /** An area she no longer wants printed */
    const removeArea = useCallback((areaName) => {
        const next = { ...areaFiles };
        delete next[areaName];
        saveAreaFiles(next);
    }, [areaFiles, saveAreaFiles]);

    // "המשך" on an area: back to the main design, then its preview opens
    const continueToPreview = useCallback(async () => {
        if (!activeArea) {
            openPreview();
            return;
        }
        pendingPreviewRef.current = true;
        await switchArea(null);
    }, [activeArea, openPreview, switchArea]);
    useEffect(() => {
        if (activeArea || !pendingPreviewRef.current) return undefined;
        pendingPreviewRef.current = false;
        const timer = setTimeout(openPreview, AREA_RENDER_DELAY_MS);
        return () => clearTimeout(timer);
    }, [activeArea, openPreview]);

    /** The designed areas for the order line, in the product's order */
    const orderedAreas = areas
        .filter((area) => areaFiles[area.name]?.image)
        .map((area) => ({ name: area.name, ...areaFiles[area.name] }));

    const clearAreas = useCallback(() => {
        if (storageKey) localStorage.removeItem(storageKey);
        setAreaFiles({});
    }, [storageKey]);

    return {
        areas,
        activeArea,
        areaFiles,
        switchArea,
        removeArea,
        continueToPreview,
        orderedAreas,
        clearAreas,
    };
}
