import { useCallback, useState } from 'react';
import { uploadFinalDesign } from '../../api/designUploads';
import { buildDesignCartItem, collectCaptions } from '../../utils/designCartItem';

/**
 * The final print file goes to the cloud; the server moves it to the order's folder once the order
 * is created. Without Drive the order continues as usual.
 */
async function uploadPrintFile(printImage, projectName) {
    if (!printImage) return null;
    try {
        const result = await uploadFinalDesign({ image: printImage, projectName });
        return result?.file || null;
    } catch (error) {
        console.warn('Drive upload skipped', error);
        return null;
    }
}

/**
 * The regular design's way to the cart: a preview of the print file, then "אישור והזמנה" saves the
 * project, uploads the print file and adds one cart line with the design.
 * previewImage lives in the page: a saved project uses it as its preview too.
 */
export function useDesignOrder({
    selectedProduct,
    orderQuantity,
    projectName,
    elements,
    frameSelection,
    canvasDimensions,
    captureCanvasImage,
    saveProjectToDB,
    addToCart,
    clearDraft,
    onNavigateToHome,
    setIsSaving,
    setIsPreviewLoading,
    previewImage,
    setPreviewImage,
}) {
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    const openPreview = useCallback(async () => {
        setIsPreviewLoading(true);
        setPreviewImage(null);
        try {
            const dataUrl = await captureCanvasImage();
            if (!dataUrl) {
                alert('לא נמצא משטח העיצוב. נסה לרענן את הדף.');
                return;
            }
            setPreviewImage(dataUrl);
            setIsPreviewOpen(true);
        } catch (error) {
            console.error('Preview generation failed', error);
            alert('אירעה שגיאה ביצירת התצוגה המקדימה. אנא נסה שוב.');
        } finally {
            setIsPreviewLoading(false);
        }
    }, [captureCanvasImage, setIsPreviewLoading, setPreviewImage]);

    const closePreview = useCallback(() => setIsPreviewOpen(false), []);

    const confirmAndOrder = useCallback(async () => {
        setIsSaving(true);
        try {
            // Full-resolution print file, and a small image for the cart and the saved project
            const printImage = previewImage || (await captureCanvasImage());
            const cartThumb = await captureCanvasImage(2);
            if (printImage) setPreviewImage(printImage);

            const designFile = await uploadPrintFile(printImage, projectName);
            const savedProject = await saveProjectToDB(cartThumb || undefined);

            const cartItem = buildDesignCartItem({
                product: selectedProduct,
                quantity: orderQuantity || 1,
                tieredPrice: true,
                image: cartThumb || savedProject.preview || selectedProduct?.image,
                customDesign: {
                    projectId: savedProject._id,
                    projectName: savedProject.name,
                    elements: savedProject.elements,
                    canvasBackground: savedProject.canvasBackground,
                    canvasSize: savedProject.canvasSize,
                    frameSelection,
                    captions: collectCaptions(elements),
                    designFile,
                    printSizeCm: { width: canvasDimensions.widthCm, height: canvasDimensions.heightCm },
                },
            });

            await addToCart([cartItem], { successMessage: 'המוצר והעיצוב שלך נוספו בהצלחה לסל הקניות!' });
            setIsPreviewOpen(false);
            clearDraft();
            onNavigateToHome?.();
        } catch (error) {
            console.error('Failed to order project', error);
            alert('אירעה שגיאה בעיבוד ההזמנה, אנא נסה שנית.');
        } finally {
            setIsSaving(false);
        }
    }, [
        previewImage,
        captureCanvasImage,
        projectName,
        saveProjectToDB,
        selectedProduct,
        orderQuantity,
        frameSelection,
        elements,
        canvasDimensions,
        addToCart,
        clearDraft,
        onNavigateToHome,
        setIsSaving,
        setPreviewImage,
    ]);

    return { isPreviewOpen, openPreview, closePreview, confirmAndOrder };
}
