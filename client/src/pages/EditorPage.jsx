import { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Canvas from '../components/editor/Canvas.jsx';
import ContextualToolbar from '../components/editor/ContextualToolbar';
import CopiesReviewModal from '../components/editor/CopiesReviewModal';
import CopiesStrip from '../components/editor/CopiesStrip';
import EditorBusyOverlay from '../components/editor/EditorBusyOverlay';
import EditorFooter from '../components/editor/EditorFooter';
import EditorHeader from '../components/editor/EditorHeader';
import EditorSidebar from '../components/editor/EditorSidebar.jsx';
import OrientationMismatchNotice from '../components/editor/OrientationMismatchNotice';
import ProductPreviewModal from '../components/editor/ProductPreviewModal';
import SavedProjectsModal from '../components/editor/SavedProjectsModal';
import { useCanvasCapture } from '../hooks/editor/useCanvasCapture';
import { useCanvasLayout } from '../hooks/editor/useCanvasLayout';
import { useDesignOrder } from '../hooks/editor/useDesignOrder';
import { useEditorDraft } from '../hooks/editor/useEditorDraft';
import { useEditorHistory } from '../hooks/editor/useEditorHistory';
import { useEditorProduct } from '../hooks/editor/useEditorProduct';
import { useElementActions } from '../hooks/editor/useElementActions';
import { useElementMaintenance } from '../hooks/editor/useElementMaintenance';
import { useGlobalFrame } from '../hooks/editor/useGlobalFrame';
import { useInitialImage } from '../hooks/editor/useInitialImage';
import { useOrientationTools } from '../hooks/editor/useOrientationTools';
import { usePerCopyDesign } from '../hooks/editor/usePerCopyDesign';
import { useSavedProjects } from '../hooks/editor/useSavedProjects';
import { useUploadedMedia } from '../hooks/editor/useUploadedMedia';
import { useEditorAssets } from '../hooks/useEditorAssets';
import { useEditorSettings } from '../hooks/useEditorSettings';
import useAuthStore from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import { getCanvasDimensions, normalizeEditorElements } from '../utils/canvasDimensions';
import { DEFAULT_PROJECT_NAME, createDefaultBackground } from '../utils/editorDraftStorage';
import { buildEditorPalette } from '../utils/editorPalette';
import { EMPTY_EDITOR_ASSETS } from '../utils/mapEditorAssets';

const createInitialElements = () => normalizeEditorElements(null, getCanvasDimensions(null));

/**
 * The design editor. The page only composes: each concern lives in its own hook under hooks/editor
 * (history, canvas size, draft, frames, orientation, elements, saved projects, ordering, copies).
 * Hook order matters – it is the order of their effects (e.g. the draft is restored before a photo
 * from the product page is added, and before the per-copy designs take over the canvas).
 */
const EditorPage = ({ onNavigateToHome }) => {
    const location = useLocation();
    const { productId, selectedProduct, selectProduct, orderQuantity } = useEditorProduct();
    const addToCart = useCartStore((state) => state.addToCart);
    const userId = useAuthStore((state) => state.userId);

    const { settings: editorSettings } = useEditorSettings();
    const { assets: editorAssets } = useEditorAssets(EMPTY_EDITOR_ASSETS);
    const colorPalette = useMemo(
        () => buildEditorPalette(editorSettings.textToolbar?.colorPresets, editorAssets.colors),
        [editorSettings.textToolbar?.colorPresets, editorAssets.colors],
    );

    const history = useEditorHistory(createInitialElements);
    const { elements, setElements, selectedElementId, setSelectedElementId, selectedElement, commit, resetHistory } = history;
    const layout = useCanvasLayout(selectedProduct);
    const { canvasDimensions, printSizeLabel, orientationFlipped, activeFrameAspectRatio } = layout;

    const [canvasBackground, setCanvasBackground] = useState(createDefaultBackground);
    const [projectName, setProjectName] = useState(DEFAULT_PROJECT_NAME);
    /** The customer's frame choice (size, orientation, frame) – saved with the order */
    const [frameSelection, setFrameSelection] = useState(null);
    const [showGrid, setShowGrid] = useState(false);
    const [gridSize, setGridSize] = useState(5);
    const [zoom, setZoom] = useState(100);
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);
    const isPerCopyMode = Boolean(location.state?.perCopy);

    const { activeGlobalFrame, activeGlobalFrameId } = useElementMaintenance({
        elements,
        setElements,
        resetHistory,
        setSelectedElementId,
        canvasDimensions,
        activeFrameAspectRatio,
        setActiveFrameAspectRatio: layout.setActiveFrameAspectRatio,
    });

    const draft = useEditorDraft({
        selectedProduct,
        productId,
        canvasDimensions,
        activeFrameAspectRatio,
        setActiveFrameAspectRatio: layout.setActiveFrameAspectRatio,
        orientationFlipped,
        isPerCopyMode,
        design: { elements, canvasBackground, projectName, frameSelection },
        resetHistory,
        setSelectedElementId,
        setCanvasBackground,
        setProjectName,
        setFrameSelection,
    });

    const { captureCanvasImage, captureProjectPreview } = useCanvasCapture({
        canvasBackground,
        canvasDimensions,
        shape: selectedProduct?.shape,
        zoom,
        setZoom,
        setSelectedElementId,
    });

    const media = useUploadedMedia({ setCanvasBackground });

    const orientation = useOrientationTools({
        elements,
        commit,
        setSelectedElementId,
        selectedProduct,
        canvasDimensions,
        activeFrameAspectRatio,
        orientationFlipped,
        setOrientationFlipped: layout.setOrientationFlipped,
        setFrameSelection,
        saveCanvasDraft: draft.saveCanvasDraft,
    });

    const frames = useGlobalFrame({
        elements,
        commit,
        setSelectedElementId,
        selectedProduct,
        canvasDimensions,
        orientationFlipped,
        printSizeLabel,
        setActiveFrameAspectRatio: layout.setActiveFrameAspectRatio,
        setFrameSelection,
        setOrientationNotice: orientation.setOrientationNotice,
        saveCanvasDraft: draft.saveCanvasDraft,
    });

    const actions = useElementActions({
        elements,
        setElements,
        commit,
        selectedElementId,
        setSelectedElementId,
        canvasDimensions,
        captionDefaults: editorSettings.captionDefaults,
        rememberUploadedImage: media.rememberUploadedImage,
        forgetUploadedImage: media.forgetUploadedImage,
        detectOrientationMismatch: orientation.detectOrientationMismatch,
        removeGlobalFrame: frames.removeGlobalFrame,
    });

    useInitialImage({ selectedProduct, canvasDimensions, addImageElement: actions.addImageElement });

    const projectEditor = useMemo(() => ({
        resetHistory,
        setSelectedElementId,
        setCanvasBackground,
        setUploadedImages: media.setUploadedImages,
        setUploadedBackgrounds: media.setUploadedBackgrounds,
        setProjectName,
        setFrameSelection,
        setOrientationNotice: orientation.setOrientationNotice,
        setActiveFrameAspectRatio: layout.setActiveFrameAspectRatio,
        setOrientationFlipped: layout.setOrientationFlipped,
        selectProduct,
        markCanvasApplied: draft.markCanvasApplied,
    }), [
        resetHistory,
        setSelectedElementId,
        media.setUploadedImages,
        media.setUploadedBackgrounds,
        orientation.setOrientationNotice,
        layout.setActiveFrameAspectRatio,
        layout.setOrientationFlipped,
        selectProduct,
        draft.markCanvasApplied,
    ]);

    const projects = useSavedProjects({
        userId,
        productId,
        design: {
            projectName,
            elements,
            canvasBackground,
            uploadedImages: media.uploadedImages,
            uploadedBackgrounds: media.uploadedBackgrounds,
            selectedProduct,
            frameSelection,
            canvasDimensions,
            orientationFlipped,
            previewImage,
        },
        captureProjectPreview,
        setIsSaving,
        addToCart,
        onNavigateToHome,
        editor: projectEditor,
    });

    const order = useDesignOrder({
        selectedProduct,
        orderQuantity,
        projectName,
        elements,
        frameSelection,
        canvasDimensions,
        captureCanvasImage,
        saveProjectToDB: projects.saveProjectToDB,
        addToCart,
        clearDraft: draft.clearDraft,
        onNavigateToHome,
        setIsSaving,
        setIsPreviewLoading,
        previewImage,
        setPreviewImage,
    });

    const copies = usePerCopyDesign({
        enabled: isPerCopyMode,
        quantity: Number(location.state?.quantity) || orderQuantity,
        draftProductKey: draft.draftProductKey,
        isCanvasReady: draft.isCanvasReady,
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
    });

    return (
        <div className="flex flex-col flex-1 min-h-0 h-full overflow-hidden" style={{ direction: 'rtl' }}>
            <EditorHeader
                onExit={onNavigateToHome}
                projectName={projectName}
                onProjectNameChange={setProjectName}
                onPreview={copies.copyCount ? copies.previewCopies : order.openPreview}
                isPreviewLoading={isPreviewLoading}
                onUndo={history.undo}
                onRedo={history.redo}
                canUndo={history.canUndo}
                canRedo={history.canRedo}
                onSave={projects.saveToLibrary}
                onLoad={projects.openLoadModal}
                productLabel={selectedProduct?.name || null}
                printSizeLabel={printSizeLabel}
            />
            {copies.copyCount > 0 && (
                <CopiesStrip
                    copyCount={copies.copyCount}
                    activeCopy={copies.activeCopy}
                    copyDesigns={copies.copyDesigns}
                    onSelectCopy={copies.switchCopy}
                />
            )}

            <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
                <div className="order-1 md:order-2 flex-1 min-h-0 min-w-0 relative overflow-hidden flex flex-col">
                    {selectedElement && (
                        <div className="absolute top-0 left-0 right-0 z-40 overflow-x-auto">
                            <ContextualToolbar
                                selectedElement={selectedElement}
                                onUpdateElement={actions.updateSelectedElement}
                                onCrop={actions.startCrop}
                                onDuplicate={actions.duplicateElement}
                                onDelete={actions.deleteElement}
                                onBringToFront={actions.bringToFront}
                                onSendToBack={actions.sendToBack}
                                textOptions={editorSettings.textToolbar}
                                colors={colorPalette}
                            />
                        </div>
                    )}
                    <Canvas
                        shape={selectedProduct?.shape}
                        elements={elements}
                        selectedElementId={selectedElementId}
                        setSelectedElementId={setSelectedElementId}
                        updateElement={actions.updateElement}
                        croppingElementId={actions.croppingElementId}
                        onSaveCrop={actions.saveCrop}
                        onCancelCrop={actions.cancelCrop}
                        onDelete={actions.deleteElement}
                        onDuplicate={actions.duplicateElement}
                        onToggleLock={actions.toggleLockElement}
                        canvasBackground={canvasBackground}
                        showGrid={showGrid}
                        gridSize={gridSize}
                        zoom={zoom}
                        canvasWidth={canvasDimensions.width}
                        canvasHeight={canvasDimensions.height}
                        printWidthCm={canvasDimensions.widthCm}
                        printHeightCm={canvasDimensions.heightCm}
                        showOrientationToggle={Boolean(selectedProduct?.allowOrientationToggle)}
                        onToggleOrientation={orientation.handleToggleOrientation}
                        onAddImageToDropzone={actions.addImageToDropzone}
                    />
                    <OrientationMismatchNotice
                        notice={orientation.orientationNotice}
                        prompt={editorSettings.orientationPrompt}
                        orientationLabels={editorSettings.orientationLabels}
                        onRotate={orientation.handleRotateToMatchOrientation}
                        onDismiss={orientation.dismissOrientationNotice}
                    />
                </div>
                <div className="order-2 md:order-1 shrink-0 md:h-full md:flex md:flex-col">
                    <EditorSidebar
                        addTextElement={actions.addTextElement}
                        addCaptionElement={actions.addCaptionElement}
                        addImageElement={actions.addImageElement}
                        addShapeElement={actions.addShapeElement}
                        onApplyGlobalFrame={frames.applyGlobalFrame}
                        onRemoveGlobalFrame={frames.removeGlobalFrame}
                        onSelectGlobalFrame={frames.selectGlobalFrame}
                        onDetectFrameSlots={frames.detectSlotsOnActiveFrame}
                        activeGlobalFrameId={activeGlobalFrameId}
                        activeGlobalFrame={activeGlobalFrame}
                        elements={elements}
                        onAddImageToDropzone={actions.addImageToDropzone}
                        onClearDropzoneImage={actions.clearDropzoneImage}
                        uploadedImages={media.uploadedImages}
                        deleteUploadedImage={actions.deleteUploadedImage}
                        selectedElement={selectedElement}
                        onUpdateElement={actions.updateSelectedElement}
                        canvasBackground={canvasBackground}
                        setCanvasBackground={setCanvasBackground}
                        uploadedBackgrounds={media.uploadedBackgrounds}
                        addUploadedBackground={media.addUploadedBackground}
                        deleteUploadedBackground={media.deleteUploadedBackground}
                        editorSettings={editorSettings}
                        colors={colorPalette}
                    />
                </div>
            </div>
            <EditorFooter
                showGrid={showGrid}
                setShowGrid={setShowGrid}
                gridSize={gridSize}
                setGridSize={setGridSize}
                zoom={zoom}
                setZoom={setZoom}
                printSizeLabel={printSizeLabel}
            />

            {projects.isLoadModalOpen && (
                <SavedProjectsModal
                    projects={projects.savedProjects}
                    onClose={projects.closeLoadModal}
                    onOpen={projects.loadProject}
                    onDelete={projects.deleteProject}
                    onAddToCart={projects.addProjectToCart}
                />
            )}

            {copies.copyPreviews && (
                <CopiesReviewModal
                    previews={copies.copyPreviews}
                    isSaving={isSaving}
                    onClose={copies.closeCopyPreviews}
                    onEditCopy={(index) => {
                        copies.closeCopyPreviews();
                        copies.switchCopy(index);
                    }}
                    onConfirm={copies.confirmCopies}
                />
            )}

            <ProductPreviewModal
                isOpen={order.isPreviewOpen}
                onClose={order.closePreview}
                previewImage={previewImage}
                productNameHe={selectedProduct?.name || (typeof selectedProduct === 'string' ? selectedProduct : null)}
                printSizeLabel={printSizeLabel}
                isSaving={isSaving}
                onConfirm={order.confirmAndOrder}
            />

            {(isPreviewLoading || isSaving) && !order.isPreviewOpen && <EditorBusyOverlay isSaving={isSaving} />}
        </div>
    );
};

export default EditorPage;
