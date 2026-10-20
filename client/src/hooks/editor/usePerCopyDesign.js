import { useCallback, useEffect, useState } from 'react';
import { createDefaultTextElement } from '../../utils/canvasDimensions';
import { withTieredPricingFields } from '../../utils/cartItem';
import { collectCaptions } from '../../utils/designCartItem';
import { createDefaultBackground, getCopiesStorageKey, safeJsonParse, safeStorageSetItem } from '../../utils/editorDraftStorage';
import { getUnitPriceForQuantity } from '../../utils/productQuantityPricing';
import { uploadFilesInParallel } from '../../utils/uploadQueue';

/** Time for the canvas to render a copy before it is captured */
const COPY_RENDER_DELAY_MS = 150;

const dataUrlToFile = async (dataUrl, name) => {
    const blob = await (await fetch(dataUrl)).blob();
    return new File([blob], name, { type: 'image/png' });
};

/**
 * A separate design for each copy (quantity > 1, chosen on the product page).
 * One copy is on the canvas at a time; the others are kept in copyDesigns and saved across refreshes.
 * Ordering captures every copy, uploads the print files and adds one cart line with all of them.
 */
export function usePerCopyDesign({
    enabled,
    quantity,
    draftProductKey,
    isCanvasReady,
    elements,
    canvasBackground,
    resetHistory,
    setCanvasBackground,
    setSelectedElementId,
    canvasDimensions,
    captureCanvasImage,
    selectedProduct,
    projectName,
    addToCart,
    onNavigateToHome,
    setIsSaving,
    setIsPreviewLoading,
}) {
    const copyCount = enabled ? Math.max(2, Number(quantity) || 2) : 0;
    const storageKey = getCopiesStorageKey(draftProductKey);
    const [copyDesigns, setCopyDesigns] = useState(() => (
        copyCount ? safeJsonParse(localStorage.getItem(storageKey), []) || [] : []
    ));
    const [activeCopy, setActiveCopy] = useState(0);
    const [copyPreviews, setCopyPreviews] = useState(null);

    // Once the product's draft is on the canvas, the copy being edited replaces it from the saved copies.
    // Saving the copies waits for that, so the draft is never saved as a copy.
    const [copiesLoaded, setCopiesLoaded] = useState(false);
    const savedActiveCopy = copyDesigns[activeCopy];
    useEffect(() => {
        if (!copyCount || !isCanvasReady || copiesLoaded) return;
        setCopiesLoaded(true);
        if (savedActiveCopy?.elements?.length) {
            resetHistory(savedActiveCopy.elements);
            setCanvasBackground(savedActiveCopy.canvasBackground || createDefaultBackground());
        }
    }, [copyCount, isCanvasReady, copiesLoaded, savedActiveCopy, resetHistory, setCanvasBackground]);

    const blankCopy = useCallback(() => ({
        elements: [createDefaultTextElement(canvasDimensions)],
        canvasBackground: createDefaultBackground(),
    }), [canvasDimensions]);

    /** All copies, with the one on the canvas taken from the canvas itself */
    const currentCopyDesigns = useCallback(() => {
        const designs = Array.from({ length: copyCount }, (_, i) => copyDesigns[i] || null);
        designs[activeCopy] = { elements, canvasBackground };
        return designs;
    }, [copyCount, copyDesigns, activeCopy, elements, canvasBackground]);

    // Each copy's design is kept across refreshes, like the single design's draft
    useEffect(() => {
        if (!copiesLoaded) return;
        safeStorageSetItem(storageKey, JSON.stringify(currentCopyDesigns()));
    }, [copiesLoaded, storageKey, currentCopyDesigns]);

    const loadDesignOnCanvas = useCallback((design) => {
        resetHistory(design.elements);
        setCanvasBackground(design.canvasBackground);
        setSelectedElementId(null);
    }, [resetHistory, setCanvasBackground, setSelectedElementId]);

    const switchCopy = useCallback((next) => {
        if (next === activeCopy) return;
        const designs = currentCopyDesigns();
        setCopyDesigns(designs);
        setActiveCopy(next);
        loadDesignOnCanvas(designs[next] || blankCopy());
    }, [activeCopy, currentCopyDesigns, loadDesignOnCanvas, blankCopy]);

    /** Renders every copy on the canvas in turn and captures it; the canvas returns to the copy being edited */
    const captureAllCopies = useCallback(async (pixelRatio) => {
        const designs = currentCopyDesigns();
        const images = [];
        try {
            for (const saved of designs) {
                const design = saved || blankCopy();
                loadDesignOnCanvas(design);
                await new Promise((resolve) => setTimeout(resolve, COPY_RENDER_DELAY_MS));
                images.push(await captureCanvasImage(pixelRatio, design.canvasBackground));
            }
        } finally {
            setCopyDesigns(designs);
            loadDesignOnCanvas(designs[activeCopy] || blankCopy());
        }
        return images;
    }, [currentCopyDesigns, loadDesignOnCanvas, blankCopy, captureCanvasImage, activeCopy]);

    /** "המשך": all the copies in one review window */
    const previewCopies = useCallback(async () => {
        setIsPreviewLoading(true);
        try {
            setCopyPreviews(await captureAllCopies(1));
        } catch (error) {
            console.error('Copies preview failed', error);
            alert('אירעה שגיאה ביצירת התצוגה המקדימה. אנא נסה שוב.');
        } finally {
            setIsPreviewLoading(false);
        }
    }, [captureAllCopies, setIsPreviewLoading]);

    const closeCopyPreviews = useCallback(() => setCopyPreviews(null), []);

    /** One cart line, quantity = copies, with each copy's print file uploaded */
    const confirmCopies = useCallback(async () => {
        setIsSaving(true);
        try {
            const designs = currentCopyDesigns();
            const printImages = await captureAllCopies();
            const files = await Promise.all(printImages.map((dataUrl, i) => dataUrlToFile(dataUrl, `copy-${i + 1}.png`)));
            // A few uploads at a time, with retries; one failed copy fails the whole order line
            const { uploaded, failed } = await uploadFilesInParallel(files);
            if (failed.length) throw failed[0].error;
            const copies = uploaded.map(({ url }) => ({ image: url }));

            const product = typeof selectedProduct === 'object' ? selectedProduct : null;
            const cartItem = withTieredPricingFields({
                id: `cart_${Date.now()}`,
                productId: product?._id || product?.id || 'custom_product',
                name: `${product?.name || 'מוצר'} בעיצוב אישי (עיצוב לכל עותק)`,
                price: product ? getUnitPriceForQuantity(product, copyCount) : 0,
                image: copies[0]?.image || product?.image,
                quantity: copyCount,
                size: product?.size,
                customDesign: {
                    projectName,
                    copies,
                    captions: collectCaptions(designs.flatMap((design) => design?.elements || [])),
                    printSizeCm: { width: canvasDimensions.widthCm, height: canvasDimensions.heightCm },
                },
            }, product);
            await addToCart([cartItem], { successMessage: `${copyCount} העיצובים נוספו לסל הקניות!` });
            setCopyPreviews(null);
            localStorage.removeItem(storageKey);
            onNavigateToHome?.();
        } catch (error) {
            console.error('Failed to order copies', error);
            alert('אירעה שגיאה בעיבוד ההזמנה, אנא נסה שנית.');
        } finally {
            setIsSaving(false);
        }
    }, [
        currentCopyDesigns,
        captureAllCopies,
        selectedProduct,
        copyCount,
        projectName,
        canvasDimensions,
        addToCart,
        storageKey,
        onNavigateToHome,
        setIsSaving,
    ]);

    return {
        copyCount,
        copyDesigns,
        activeCopy,
        switchCopy,
        copyPreviews,
        previewCopies,
        closeCopyPreviews,
        confirmCopies,
    };
}
