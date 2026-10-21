import { useCallback, useState } from 'react';
import { db } from '../../services/databaseService';
import { buildDesignCartItem } from '../../utils/designCartItem';
import {
    DEFAULT_PROJECT_NAME,
    createDefaultBackground,
    getDraftStorageKeys,
    resolveDraftProductKey,
    writeDraft,
} from '../../utils/editorDraftStorage';
import { prepareProjectForCanvas } from '../../utils/editorProjects';

/**
 * "My projects": saving the design to the customer's library, opening a saved project on the canvas,
 * deleting one, and adding one to the cart as it was saved.
 */
export function useSavedProjects({
    userId,
    productId,
    design,
    captureProjectPreview,
    setIsSaving,
    addToCart,
    onNavigateToHome,
    editor,
}) {
    const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);
    const [savedProjects, setSavedProjects] = useState([]);
    const [currentProjectId, setCurrentProjectId] = useState(undefined);

    const {
        projectName,
        elements,
        canvasBackground,
        uploadedImages,
        uploadedBackgrounds,
        selectedProduct,
        frameSelection,
        canvasDimensions,
        orientationFlipped,
        previewImage,
    } = design;

    /** @param {string} [previewOverride] the preview to save (otherwise a light capture of the canvas) */
    const saveProjectToDB = useCallback(async (previewOverride) => {
        const previewDataUrl = await captureProjectPreview();
        const saved = await db.save({
            _id: currentProjectId,
            userId: userId ?? null,
            name: projectName,
            elements,
            canvasBackground,
            uploadedImages,
            uploadedBackgrounds,
            selectedProduct,
            frameSelection,
            canvasSize: {
                width: canvasDimensions.width,
                height: canvasDimensions.height,
                widthCm: canvasDimensions.widthCm,
                heightCm: canvasDimensions.heightCm,
                orientationFlipped,
            },
            preview: previewOverride || previewDataUrl || previewImage,
        });
        setCurrentProjectId(saved._id);
        return saved;
    }, [
        captureProjectPreview,
        currentProjectId,
        userId,
        projectName,
        elements,
        canvasBackground,
        uploadedImages,
        uploadedBackgrounds,
        selectedProduct,
        frameSelection,
        canvasDimensions,
        orientationFlipped,
        previewImage,
    ]);

    const saveToLibrary = useCallback(async () => {
        setIsSaving(true);
        try {
            await saveProjectToDB();
            alert('הפרויקט נשמר בהצלחה בספריה!');
        } catch (error) {
            console.error('Failed to save', error);
            alert('שגיאה בשמירת הפרויקט');
        } finally {
            setIsSaving(false);
        }
    }, [saveProjectToDB, setIsSaving]);

    const openLoadModal = useCallback(async () => {
        setIsLoadModalOpen(true);
        setSavedProjects(await db.findAll(userId));
    }, [userId]);

    const closeLoadModal = useCallback(() => setIsLoadModalOpen(false), []);

    /** Opens a saved project on the canvas and makes it the product's draft */
    const loadProject = useCallback((project) => {
        try {
            const prepared = prepareProjectForCanvas(project, selectedProduct);
            const background = project.canvasBackground || createDefaultBackground();
            const name = project.name || DEFAULT_PROJECT_NAME;

            if (prepared.frameAspectRatio) editor.setActiveFrameAspectRatio(prepared.frameAspectRatio);
            editor.setOrientationFlipped(prepared.orientationFlipped);
            editor.resetHistory(prepared.elements);
            editor.setSelectedElementId(null);
            editor.setCanvasBackground(background);
            editor.setUploadedImages(project.uploadedImages || []);
            editor.setUploadedBackgrounds(project.uploadedBackgrounds || []);
            editor.setProjectName(name);
            editor.setFrameSelection(project.frameSelection || null);
            editor.setOrientationNotice(null);
            editor.selectProduct(project.selectedProduct || null);
            setCurrentProjectId(project._id);

            const product = prepared.product;
            const draftKey = resolveDraftProductKey(product, product?._id || product?.id || productId);
            writeDraft(getDraftStorageKeys(draftKey), {
                canvasKey: prepared.canvasStorageKey,
                elements: prepared.elements,
                background,
                projectName: name,
                frameSelection: project.frameSelection || null,
            });
            editor.markCanvasApplied(prepared.canvasStorageKey);
            setIsLoadModalOpen(false);
        } catch (error) {
            console.error('Error loading project:', error);
            alert('אירעה שגיאה בטעינת הפרויקט');
        }
    }, [selectedProduct, productId, editor]);

    const deleteProject = useCallback(async (event, id) => {
        event.stopPropagation();
        if (!confirm('האם אתה בטוח שברצונך למחוק פרויקט זה?')) return;
        await db.delete(id, userId);
        setSavedProjects(await db.findAll(userId));
        if (currentProjectId === id) setCurrentProjectId(undefined);
    }, [currentProjectId, userId]);

    /** Adds a saved project to the cart as it was saved (one copy, the product's regular price) */
    const addProjectToCart = useCallback(async (event, project) => {
        event.stopPropagation();
        try {
            const cartItem = buildDesignCartItem({
                product: project.selectedProduct,
                image: project.preview,
                customDesign: {
                    projectId: project._id,
                    projectName: project.name,
                    elements: project.elements,
                    canvasBackground: project.canvasBackground,
                },
            });
            await addToCart([cartItem], { successMessage: `הפרויקט "${project.name}" נוסף בהצלחה לסל הקניות!` });
            setIsLoadModalOpen(false);
            onNavigateToHome?.();
        } catch (error) {
            console.error('Error adding project to cart', error);
            alert('שגיאה בהוספת הפרויקט לסל');
        }
    }, [addToCart, onNavigateToHome]);

    return {
        saveProjectToDB,
        saveToLibrary,
        isLoadModalOpen,
        openLoadModal,
        closeLoadModal,
        savedProjects,
        loadProject,
        deleteProject,
        addProjectToCart,
    };
}
