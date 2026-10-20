import { toPng } from 'html-to-image';
import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { applyShapeMask } from '../utils/productShapes';
import { uploadFilesInParallel } from '../utils/uploadQueue';
import { getProductById } from '../api/products';
import {
    getCanvasDimensions,
    formatPrintSizeLabel,
    getCanvasStorageKey,
    createDefaultTextElement,
    centerPosition,
    scaleElementsToCanvas,
    normalizeEditorElements,
    getPrintExportPixelRatio,
    fitImageElementBounds,
    createCaptionTextElement,
} from '../utils/canvasDimensions';
import {
    enforceLayerOrder,
    extractFrameAspectRatio,
    getActiveGlobalFrame,
    getDropzoneImageForSlot,
    insertBelowGlobalFrame,
    moveElementToEdge,
    isDropzoneImage,
    isGlobalFrame,
    removeDropzoneImages,
    removeGlobalFrames,
    replaceDropzoneImage,
    stripLegacyDropzoneFields,
} from '../utils/editorLayering';
import { fitImageToDropzone, isMultiDropzoneFrame, resolveDropzones } from '../utils/dropzoneUtils';
import { detectEmptyPhotoSlots } from '../utils/detectEmptyPhotoSlots';
import { prepareFrameImageSrc, punchDropzoneHoles } from '../utils/frameImageProcessing';
import {
    getCanvasOrientation,
    getFrameOrientation,
    getOrientation,
    getTargetOrientation,
    orientationsConflict,
    rotateImageElement90,
} from '../utils/orientationMatching';
import Canvas from '../components/editor/Canvas.jsx';
import ContextualToolbar from '../components/editor/ContextualToolbar';
import EditorFooter from '../components/editor/EditorFooter';
import EditorHeader from '../components/editor/EditorHeader';
import EditorSidebar from '../components/editor/EditorSidebar.jsx';
import OrientationMismatchNotice from '../components/editor/OrientationMismatchNotice';
import ProductPreviewModal from '../components/editor/ProductPreviewModal';
import { useEditorSettings } from '../hooks/useEditorSettings';
import { useEditorAssets } from '../hooks/useEditorAssets';
import { buildEditorPalette } from '../utils/editorPalette';
import { uploadFinalDesign } from '../api/designUploads';
import { ClockIcon, TrashIcon, XIcon } from '../components/icons';
import { db } from '../services/databaseService';
import { useProductStore } from '../store/productStore';
import { useCartStore } from '../store/cartStore'; 
import useAuthStore from '../store/authStore';
import { getUnitPriceForQuantity } from '../utils/productQuantityPricing';
import { withTieredPricingFields } from '../utils/cartItem';
import { withMagnetPrintDimensions } from '../utils/magnetSize';
import { EMPTY_EDITOR_ASSETS } from '../utils/mapEditorAssets';

/** The page needs only the colors from the library; the other categories load in the sidebar */

const CANVAS_KEY_STORAGE_PREFIX = 'active_editor_canvas_key';
const ACTIVE_ELEMENTS_STORAGE_PREFIX = 'active_editor_elements';
const ACTIVE_BG_STORAGE_PREFIX = 'active_editor_bg';
const ACTIVE_NAME_STORAGE_PREFIX = 'active_editor_name';
const ACTIVE_FRAME_SELECTION_STORAGE_PREFIX = 'active_editor_frame_selection';

const safeJsonParse = (raw, fallback) => {
    if (!raw) return fallback;
    try {
        return JSON.parse(raw);
    } catch (error) {
        console.warn('Invalid JSON in storage:', error);
        return fallback;
    }
};

const isQuotaExceededError = (error) =>
    error?.name === 'QuotaExceededError' || error?.code === 22 || error?.code === 1014;

const safeStorageSetItem = (key, value) => {
    try {
        localStorage.setItem(key, value);
        return true;
    } catch (error) {
        if (isQuotaExceededError(error)) {
            console.warn(`localStorage quota exceeded for key: ${key}`);
            return false;
        }
        throw error;
    }
};

const resolveDraftProductKey = (product, fallbackProductId) =>
    product?._id || product?.id || fallbackProductId || 'no-product';

const EditorPage = ({ onNavigateToHome }) => {
    const { productId } = useParams();
    const location = useLocation();
    // A separate design for each copy (chosen on the product page); the copies' block is further down
    const isPerCopyMode = Boolean(location.state?.perCopy);
    const navigate = useNavigate();

    // Get the selected product from the products store
    const { selectedProduct, setSelectedProduct, orderQuantity } = useProductStore();
    const onSelectProduct = setSelectedProduct;
    
    // Get the add-to-cart function from the cart store
    const addToCart = useCartStore((state) => state.addToCart);
    const userId = useAuthStore((state) => state.userId);

    const { settings: editorSettings } = useEditorSettings();
    const { assets: editorAssets } = useEditorAssets(EMPTY_EDITOR_ASSETS);
    const colorPalette = useMemo(
        () => buildEditorPalette(editorSettings.textToolbar?.colorPresets, editorAssets.colors),
        [editorSettings.textToolbar?.colorPresets, editorAssets.colors],
    );

    const [activeFrameAspectRatio, setActiveFrameAspectRatio] = useState(null);
    const [orientationFlipped, setOrientationFlipped] = useState(false);
    /** The customer's frame choice (size, orientation, frame) – saved with the order */
    const [frameSelection, setFrameSelection] = useState(null);
    /** Alert about an orientation mismatch between the photo and the frame */
    const [orientationNotice, setOrientationNotice] = useState(null);

    const canvasDimensions = useMemo(
        () => getCanvasDimensions(selectedProduct, activeFrameAspectRatio, orientationFlipped),
        [selectedProduct, activeFrameAspectRatio, orientationFlipped]
    );
    const printSizeLabel = formatPrintSizeLabel(
        canvasDimensions.widthCm,
        canvasDimensions.heightCm
    );

    const canvasAppliedKeyRef = useRef(null);
    const lastCanvasPxRef = useRef({ width: 0, height: 0 });
    const storageWarningShownRef = useRef(false);

    // --- Local state and draft management ---
    const [elements, setElements] = useState(() =>
        normalizeEditorElements(null, getCanvasDimensions(null)),
    );

    const [canvasBackground, setCanvasBackground] = useState({ type: 'color', value: '#FFFFFF' });

    const [projectName, setProjectName] = useState('הפרויקט שלי');

    const [history, setHistory] = useState([elements]);
    const [historyIndex, setHistoryIndex] = useState(0);
    const [selectedElementId, setSelectedElementId] = useState(elements[0]?.id || null);
    const [uploadedImages, setUploadedImages] = useState([]);
    const [croppingElementId, setCroppingElementId] = useState(null);
    const [uploadedBackgrounds, setUploadedBackgrounds] = useState([]);
    const [currentProjectId, setCurrentProjectId] = useState(undefined);

    const [showGrid, setShowGrid] = useState(false);
    const [gridSize, setGridSize] = useState(5);
    const [zoom, setZoom] = useState(100);
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [showLoadModal, setShowLoadModal] = useState(false);
    const [savedProjects, setSavedProjects] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
    const draftProductKey = resolveDraftProductKey(selectedProduct, productId);
    const draftStorage = useMemo(() => ({
        canvasKey: `${CANVAS_KEY_STORAGE_PREFIX}_${draftProductKey}`,
        elements: `${ACTIVE_ELEMENTS_STORAGE_PREFIX}_${draftProductKey}`,
        background: `${ACTIVE_BG_STORAGE_PREFIX}_${draftProductKey}`,
        projectName: `${ACTIVE_NAME_STORAGE_PREFIX}_${draftProductKey}`,
        frameSelection: `${ACTIVE_FRAME_SELECTION_STORAGE_PREFIX}_${draftProductKey}`,
    }), [draftProductKey]);

    const activeGlobalFrame = useMemo(
        () => getActiveGlobalFrame(elements),
        [elements],
    );

    const activeGlobalFrameId = useMemo(
        () => activeGlobalFrame?.frameId || null,
        [activeGlobalFrame],
    );

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
                            prev.map((el) => (
                                isGlobalFrame(el) ? { ...el, holesPunched: 'v2' } : el
                            )),
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeGlobalFrameId, activeGlobalFrame?.dropzones?.length]);

    useEffect(() => {
        setOrientationFlipped(false);
    }, [selectedProduct?._id, selectedProduct?.id]);

    useEffect(() => {
        let changed = false;
        const fixed = elements.map((el) => {
            if (el.type !== 'image') return el;
            const fitted = fitImageElementBounds(el);
            if (fitted !== el) changed = true;
            return fitted;
        });
        if (!changed) return;
        setElements(enforceLayerOrder(fixed));
    }, [elements]);

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
            setElements(normalized);
            setHistory([normalized]);
            setHistoryIndex(0);
            setSelectedElementId(normalized[0]?.id || null);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        // Until the saved draft of this product was loaded, saving would overwrite it with the empty canvas.
        // A design per copy is saved separately (per-copy block below), so the regular draft is left as it was.
        if (!canvasAppliedKeyRef.current || isPerCopyMode) return;
        const savedElements = safeStorageSetItem(draftStorage.elements, JSON.stringify(elements));
        safeStorageSetItem(draftStorage.background, JSON.stringify(canvasBackground));
        safeStorageSetItem(draftStorage.projectName, projectName);
        if (frameSelection) {
            safeStorageSetItem(draftStorage.frameSelection, JSON.stringify(frameSelection));
        } else {
            localStorage.removeItem(draftStorage.frameSelection);
        }

        if (!savedElements && !storageWarningShownRef.current) {
            storageWarningShownRef.current = true;
            alert('נפח האחסון המקומי מלא. השינויים ימשיכו לעבוד, אבל לא יישמרו מקומית עד לניקוי אחסון בדפדפן.');
        }
    }, [elements, canvasBackground, projectName, frameSelection, draftStorage, isPerCopyMode]);

    // Fit the workspace to the print dimensions of the selected product
    useEffect(() => {
        // Before the product arrives this would apply an empty "no-product" canvas, and the autosave
        // (which already uses the product id from the URL) would overwrite the product's saved draft
        if (!selectedProduct) return;
        const storageKey = getCanvasStorageKey(
            selectedProduct,
            canvasDimensions,
            activeFrameAspectRatio,
            orientationFlipped,
        );
        const savedKey = localStorage.getItem(draftStorage.canvasKey);

        if (canvasAppliedKeyRef.current === storageKey) {
            lastCanvasPxRef.current = {
                width: canvasDimensions.width,
                height: canvasDimensions.height,
            };
            return;
        }

        const savedElementsRaw = localStorage.getItem(draftStorage.elements);
        const savedBackgroundRaw = localStorage.getItem(draftStorage.background);
        const savedProjectName = localStorage.getItem(draftStorage.projectName);
        let nextElements;

        if (savedKey === storageKey && savedElementsRaw) {
            nextElements = enforceLayerOrder(normalizeEditorElements(
                safeJsonParse(savedElementsRaw, [createDefaultTextElement(canvasDimensions)]),
                canvasDimensions,
            ));
            const savedAspect = extractFrameAspectRatio(nextElements);
            if (savedAspect) setActiveFrameAspectRatio(savedAspect);
            setFrameSelection(
                safeJsonParse(localStorage.getItem(draftStorage.frameSelection), null),
            );
        } else {
            nextElements = [createDefaultTextElement(canvasDimensions)];
            setFrameSelection(null);
        }

        setElements(nextElements);
        setCanvasBackground(
            safeJsonParse(savedBackgroundRaw, { type: 'color', value: '#FFFFFF' })
        );
        setProjectName(savedProjectName || 'הפרויקט שלי');
        setHistory([nextElements]);
        setHistoryIndex(0);
        setSelectedElementId(nextElements[0]?.id || null);

        safeStorageSetItem(draftStorage.canvasKey, storageKey);
        safeStorageSetItem(draftStorage.elements, JSON.stringify(nextElements));
        safeStorageSetItem(
            draftStorage.background,
            JSON.stringify(safeJsonParse(savedBackgroundRaw, { type: 'color', value: '#FFFFFF' })),
        );
        safeStorageSetItem(draftStorage.projectName, savedProjectName || 'הפרויקט שלי');

        canvasAppliedKeyRef.current = storageKey;
        lastCanvasPxRef.current = {
            width: canvasDimensions.width,
            height: canvasDimensions.height,
        };
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
        draftStorage,
    ]);

    // Load the product selected on the products page (navigation state, or fetch by the id in the URL)
    useEffect(() => {
        const productFromNav = location.state?.product;
        if (productFromNav) {
            setSelectedProduct(withMagnetPrintDimensions(productFromNav));
            return;
        }

        if (!productId) return;

        let cancelled = false;
        getProductById(productId)
            .then((product) => {
                if (!cancelled && product) {
                    setSelectedProduct(withMagnetPrintDimensions(product));
                }
            })
            .catch((err) => console.error('Failed to load product for editor', err));

        return () => { cancelled = true; };
    }, [productId, location.state, setSelectedProduct]);

    const clearDraft = () => {
        localStorage.removeItem(draftStorage.elements);
        localStorage.removeItem(draftStorage.background);
        localStorage.removeItem(draftStorage.projectName);
        localStorage.removeItem(draftStorage.canvasKey);
        localStorage.removeItem(draftStorage.frameSelection);
    };

    const addToHistory = useCallback((newElements) => {
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newElements);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    }, [history, historyIndex]);

    const handleUndo = useCallback(() => {
        if (historyIndex > 0) {
            const prevIndex = historyIndex - 1;
            setHistoryIndex(prevIndex);
            setElements(history[prevIndex]);
            setSelectedElementId(null);
        }
    }, [history, historyIndex]);

    const handleRedo = useCallback(() => {
        if (historyIndex < history.length - 1) {
            const nextIndex = historyIndex + 1;
            setHistoryIndex(nextIndex);
            setElements(history[nextIndex]);
            setSelectedElementId(null);
        }
    }, [history, historyIndex]);

    const updateElementsWithHistory = useCallback((newElements) => {
        const layered = enforceLayerOrder(newElements);
        setElements(layered);
        addToHistory(layered);
    }, [addToHistory]);

    // Save the project to the database
    const saveProjectToDB = async (previewOverride) => {
        const node = document.getElementById('canvas-container');
        let previewDataUrl = undefined;
        if (node) {
            setSelectedElementId(null);
            await new Promise(resolve => setTimeout(resolve, 100));
            previewDataUrl = await toPng(node, {
                quality: 0.5,
                pixelRatio: 0.5,
                filter: (node) =>
                    !node.classList?.contains('canvas-grid-overlay')
                    && !node.classList?.contains('canvas-safe-zone-overlay'),
                backgroundColor: canvasBackground.type === 'color' ? canvasBackground.value : undefined,
                cacheBust: true,
            });
        }

        const projectData = {
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
        };

        const saved = await db.save(projectData);
        setCurrentProjectId(saved._id);
        return saved;
    };

    /** Snapshot of the design canvas – without an AI mockup (shows exactly what you designed) */
    /** background: the design's background when capturing a design other than the one in state (a copy) */
    const captureCanvasImage = useCallback(async (pixelRatioOverride, background = canvasBackground) => {
        const node = document.getElementById('canvas-container');
        if (!node) return null;

        setSelectedElementId(null);
        const previousZoom = zoom;
        if (zoom !== 100) {
            setZoom(100);
        }
        await new Promise((resolve) => setTimeout(resolve, 300));

        const pixelRatio = pixelRatioOverride ?? getPrintExportPixelRatio(canvasDimensions);

        try {
            const png = await toPng(node, {
                quality: 1,
                pixelRatio,
                filter: (n) =>
                    !n.classList?.contains('canvas-grid-overlay')
                    && !n.classList?.contains('canvas-safe-zone-overlay')
                    && !n.classList?.contains('canvas-shape-outline'),
                backgroundColor: background?.type === 'color' ? background.value : undefined,
                style: { transform: 'scale(1)', outline: 'none', outlineOffset: 0 },
                cacheBust: true,
            });
            // Shaped product: the print file is transparent outside the shape
            return await applyShapeMask(png, selectedProduct?.shape);
        } finally {
            if (previousZoom !== 100) {
                setZoom(previousZoom);
            }
        }
    }, [canvasBackground, zoom, canvasDimensions, selectedProduct?.shape]);

    /** 1.3 – the list of captions saved with the order for production */
    const collectCaptions = useCallback((fromElements = elements) => (
        fromElements
            .filter((el) => el.type === 'text' && el.content?.trim())
            .map((el) => ({
                content: el.content,
                fontFamily: el.fontFamily,
                fontSize: el.fontSize,
                color: el.color,
                isCaption: el.role === 'caption',
            }))
    ), [elements]);

    /**
     * 1.4 – Save the final image to the cloud. The file is moved to the order's folder on the server
     * as soon as the order is created. If Drive is not configured, the order continues as usual.
     */
    const uploadFinalDesignToDrive = useCallback(async (printImage) => {
        if (!printImage) return null;
        try {
            const result = await uploadFinalDesign({ image: printImage, projectName });
            return result?.file || null;
        } catch (error) {
            console.warn('Drive upload skipped', error);
            return null;
        }
    }, [projectName]);

    // --- 1. Main "approve and order" button from the preview screen ---
    const handleConfirmAndOrder = useCallback(async () => {
        setIsSaving(true);
        try {
            // Full-resolution print image – saved to the cloud in the order's folder
            const printImage = previewImage || (await captureCanvasImage());
            // Small image for display in the cart / local saving (not a huge print image)
            const cartThumb = await captureCanvasImage(2);
            if (printImage) {
                setPreviewImage(printImage);
            }

            const designFile = await uploadFinalDesignToDrive(printImage);

            // a. Save the project to get a unique id
            const savedProject = await saveProjectToDB(cartThumb || undefined);
            
            // b. Set default variables for the edge case where the object is empty
            let productName = 'מוצר בעיצוב אישי';
            let productPrice = 24.99; 
            let productOriginalId = 'custom_product';

            // c. Read directly and precisely from the object that came from the user's click (no guessing)
            if (selectedProduct) {
                if (typeof selectedProduct === 'object') {
                    // Get the product's original name (e.g. Travel Mug)
                    productName = selectedProduct.name ? `${selectedProduct.name} בעיצוב אישי` : productName;
                    productOriginalId = selectedProduct._id || selectedProduct.id || productOriginalId;
                    
                    // Smart price extraction: strips everything except digits and a dot (e.g. removes ₪ signs or spaces)
                    if (selectedProduct.price !== undefined && selectedProduct.price !== null) {
                        const tieredPrice = getUnitPriceForQuantity(selectedProduct, orderQuantity || 1);
                        if (tieredPrice > 0) {
                            productPrice = tieredPrice;
                        } else {
                            const rawPrice = String(selectedProduct.price).replace(/[^\d.]/g, '');
                            const parsedPrice = parseFloat(rawPrice);
                            if (!isNaN(parsedPrice) && parsedPrice > 0) {
                                productPrice = parsedPrice;
                            }
                        }
                    }
                } else if (typeof selectedProduct === 'string') {
                    productName = `${selectedProduct} בעיצוב אישי`;
                }
            }

            // d. Build a fully valid cart object with the original price and name
            const cartItem = withTieredPricingFields({
                id: `cart_${Date.now()}`,
                productId: productOriginalId,
                name: productName.includes('עיצוב אישי') ? productName : `${productName} בעיצוב אישי`, 
                price: productPrice,            
                image: cartThumb || savedProject.preview || selectedProduct?.image,
                quantity: orderQuantity || 1,
                size: typeof selectedProduct === 'object' ? selectedProduct.size : undefined,
                customDesign: {
                    projectId: savedProject._id,
                    projectName: savedProject.name,
                    elements: savedProject.elements,
                    canvasBackground: savedProject.canvasBackground,
                    canvasSize: savedProject.canvasSize,
                    frameSelection,
                    captions: collectCaptions(),
                    designFile,
                    printSizeCm: {
                        width: canvasDimensions.widthCm,
                        height: canvasDimensions.heightCm,
                    },
                }
            }, typeof selectedProduct === 'object' ? selectedProduct : null);

            // e. Inject into the shopping cart (thumbnail/light URL for display in the cart)
            await addToCart([cartItem], { successMessage: 'המוצר והעיצוב שלך נוספו בהצלחה לסל הקניות!' });
            setShowPreviewModal(false);
            clearDraft();

            if (onNavigateToHome) {
                onNavigateToHome();
            }
        } catch (error) {
            console.error("Failed to order project", error);
            alert("אירעה שגיאה בעיבוד ההזמנה, אנא נסה שנית.");
        } finally {
            setIsSaving(false);
        }
    }, [selectedProduct, previewImage, canvasBackground, projectName, elements, uploadedImages, uploadedBackgrounds, currentProjectId, addToCart, onNavigateToHome, captureCanvasImage, canvasDimensions, orderQuantity, frameSelection, collectCaptions, uploadFinalDesignToDrive]);

    const handleSaveToDatabase = useCallback(async () => {
        setIsSaving(true);
        try {
            await saveProjectToDB();
            alert('הפרויקט נשמר בהצלחה בספריה!');
        } catch (e) {
            console.error("Failed to save", e);
            alert("שגיאה בשמירת הפרויקט");
        } finally {
            setIsSaving(false);
        }
    }, [currentProjectId, projectName, elements, canvasBackground, uploadedImages, uploadedBackgrounds, selectedProduct, previewImage]);

    // --- 2. Add-to-cart button directly from the "my projects" screen ---
    const handleAddExistingProjectToCart = useCallback(async (e, proj) => {
        e.stopPropagation(); 
        
        try {
            let productName = 'מוצר בעיצוב אישי';
            let productPrice = 24.99;
            let productOriginalId = 'custom_product';

            if (proj.selectedProduct) {
                if (typeof proj.selectedProduct === 'object') {
                    productName = proj.selectedProduct.name ? `${proj.selectedProduct.name} בעיצוב אישי` : productName;
                    productOriginalId = proj.selectedProduct._id || proj.selectedProduct.id || productOriginalId;
                    
                    if (proj.selectedProduct.price !== undefined && proj.selectedProduct.price !== null) {
                        const rawPrice = String(proj.selectedProduct.price).replace(/[^\d.]/g, '');
                        const parsedPrice = parseFloat(rawPrice);
                        if (!isNaN(parsedPrice) && parsedPrice > 0) {
                            productPrice = parsedPrice;
                        }
                    }
                } else if (typeof proj.selectedProduct === 'string') {
                    productName = `${proj.selectedProduct} בעיצוב אישי`;
                }
            }

            const cartItem = withTieredPricingFields({
                id: `cart_${Date.now()}`,
                productId: productOriginalId,
                name: productName.includes('עיצוב אישי') ? productName : `${productName} בעיצוב אישי`,
                price: productPrice,
                image: proj.preview,
                quantity: 1,
                size: typeof proj.selectedProduct === 'object' ? proj.selectedProduct.size : undefined,
                customDesign: {
                    projectId: proj._id,
                    projectName: proj.name,
                    elements: proj.elements,
                    canvasBackground: proj.canvasBackground
                }
            }, typeof proj.selectedProduct === 'object' ? proj.selectedProduct : null);

            await addToCart([cartItem], { successMessage: `הפרויקט "${proj.name}" נוסף בהצלחה לסל הקניות!` });
            setShowLoadModal(false);
            
            if (onNavigateToHome) {
                onNavigateToHome();
            }
        } catch (error) {
            console.error("Error adding project to cart", error);
            alert("שגיאה בהוספת הפרויקט לסל");
        }
    }, [addToCart, onNavigateToHome]);

    const handleOpenLoadModal = useCallback(async () => {
        setShowLoadModal(true);
        const projects = await db.findAll(userId);
        setSavedProjects(projects);
    }, [userId]);

    const handleLoadProjectFromDB = useCallback((project) => {
        try {
            const productForDims = project.selectedProduct || selectedProduct;
            const savedW = project.canvasSize?.widthCm;
            const savedH = project.canvasSize?.heightCm;
            const nativeW = Number(productForDims?.printWidth) || 12;
            const nativeH = Number(productForDims?.printHeight) || 18;
            const loadedOrientationFlipped = project.canvasSize?.orientationFlipped ?? (
                Boolean(savedW && savedH && savedW === nativeH && savedH === nativeW && savedW !== nativeW)
            );
            const dims = getCanvasDimensions(productForDims, null, loadedOrientationFlipped);
            let loadedElements = enforceLayerOrder((project.elements && project.elements.length > 0)
                ? project.elements
                : [createDefaultTextElement(dims)]);

            const loadedAspect = extractFrameAspectRatio(loadedElements);
            if (loadedAspect) setActiveFrameAspectRatio(loadedAspect);
            setOrientationFlipped(loadedOrientationFlipped);

            if (project.canvasSize?.width && project.canvasSize?.height) {
                loadedElements = scaleElementsToCanvas(
                    loadedElements,
                    project.canvasSize.width,
                    project.canvasSize.height,
                    dims.width,
                    dims.height,
                );
            }

            loadedElements = loadedElements.map((el) => (
                isGlobalFrame(el)
                    ? { ...el, width: dims.width, height: dims.height, top: 0, left: 0 }
                    : el
            ));

            setElements(loadedElements);
            setCanvasBackground(project.canvasBackground || { type: 'color', value: '#FFFFFF' });
            setUploadedImages(project.uploadedImages || []);
            setUploadedBackgrounds(project.uploadedBackgrounds || []);
            setProjectName(project.name || 'הפרויקט שלי');
            setCurrentProjectId(project._id);
            setFrameSelection(project.frameSelection || null);
            setOrientationNotice(null);

            if (onSelectProduct) {
                onSelectProduct(project.selectedProduct || null);
            }

            setHistory([loadedElements]);
            setHistoryIndex(0);
            setSelectedElementId(null);
            const loadedProduct = project.selectedProduct || selectedProduct;
            const loadedDims = getCanvasDimensions(loadedProduct, loadedAspect, loadedOrientationFlipped);
            const loadedDraftKey = resolveDraftProductKey(loadedProduct, loadedProduct?._id || loadedProduct?.id || productId);
            const loadedDraftStorage = {
                canvasKey: `${CANVAS_KEY_STORAGE_PREFIX}_${loadedDraftKey}`,
                elements: `${ACTIVE_ELEMENTS_STORAGE_PREFIX}_${loadedDraftKey}`,
                background: `${ACTIVE_BG_STORAGE_PREFIX}_${loadedDraftKey}`,
                projectName: `${ACTIVE_NAME_STORAGE_PREFIX}_${loadedDraftKey}`,
                frameSelection: `${ACTIVE_FRAME_SELECTION_STORAGE_PREFIX}_${loadedDraftKey}`,
            };

            safeStorageSetItem(
                loadedDraftStorage.canvasKey,
                getCanvasStorageKey(loadedProduct, loadedDims, loadedAspect, loadedOrientationFlipped),
            );
            safeStorageSetItem(loadedDraftStorage.elements, JSON.stringify(loadedElements));
            safeStorageSetItem(loadedDraftStorage.background, JSON.stringify(project.canvasBackground || { type: 'color', value: '#FFFFFF' }));
            safeStorageSetItem(loadedDraftStorage.projectName, project.name || 'הפרויקט שלי');
            if (project.frameSelection) {
                safeStorageSetItem(
                    loadedDraftStorage.frameSelection,
                    JSON.stringify(project.frameSelection),
                );
            } else {
                localStorage.removeItem(loadedDraftStorage.frameSelection);
            }
            canvasAppliedKeyRef.current = getCanvasStorageKey(
                loadedProduct,
                loadedDims,
                loadedAspect,
                loadedOrientationFlipped,
            );
            lastCanvasPxRef.current = { width: dims.width, height: dims.height };

            setShowLoadModal(false);
        } catch (error) {
            console.error("Error loading project:", error);
            alert("אירעה שגיאה בטעינת הפרויקט");
        }
    }, [onSelectProduct, selectedProduct, productId]);

    const handleDeleteProject = useCallback(async (e, id) => {
        e.stopPropagation();
        if (confirm("האם אתה בטוח שברצונך למחוק פרויקט זה?")) {
            await db.delete(id, userId);
            const updated = await db.findAll(userId);
            setSavedProjects(updated);
            if (currentProjectId === id) setCurrentProjectId(undefined);
        }
    }, [currentProjectId, userId]);

    const applyGlobalFrame = useCallback(async (frame, printSize = null, requestedOrientation = null) => {
        const newAspectRatio = frame.aspectRatio;
        const dims = canvasDimensions;

        let dropzones = Array.isArray(frame.dropzones) ? frame.dropzones : [];
        let layoutType = frame.layoutType === 'multi_dropzone' ? 'multi_dropzone' : 'single_overlay';

        // If no windows are defined – try to detect empty squares in the image (as in collage templates)
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

        const isMulti = layoutType === 'multi_dropzone' && dropzones.length > 0;

        let updatedElements = isMulti
            ? removeDropzoneImages(removeGlobalFrames(elements))
            : stripLegacyDropzoneFields(removeDropzoneImages(removeGlobalFrames(elements)));

        const processedSrc = await prepareFrameImageSrc(frame.imageUrl);
        const frameSrc = isMulti
            ? await punchDropzoneHoles(processedSrc, dropzones)
            : processedSrc;

        // Fixed frame: an overlay layer spanning the whole canvas that the customer cannot move
        const isFixedOverlay = frame.isFixedOverlay !== false;

        const frameElement = {
            id: `globalFrame_${frame._id}`,
            type: 'globalFrame',
            frameId: frame._id,
            src: frameSrc,
            originalSrc: frame.imageUrl,
            title: frame.title,
            aspectRatio: frame.aspectRatio,
            frameOrientation: getFrameOrientation(frame),
            printSizeKey: frame.printSizeKey || printSize?.key || '',
            isFixedOverlay,
            layoutType: isMulti ? 'multi_dropzone' : 'single_overlay',
            dropzones: isMulti ? dropzones : [],
            holesPunched: isMulti ? 'v2' : false,
            width: dims.width,
            height: dims.height,
            top: 0,
            left: 0,
            opacity: 1,
            rotation: 0,
            locked: isFixedOverlay,
        };

        const layered = enforceLayerOrder([...updatedElements, frameElement]);
        const storageKey = getCanvasStorageKey(
            selectedProduct,
            dims,
            newAspectRatio,
            orientationFlipped,
        );

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
            canvasOrientation: getCanvasOrientation(dims),
            orientationFlipped,
            layoutType: frameElement.layoutType,
            isFixedOverlay,
            selectedAt: new Date().toISOString(),
        };

        canvasAppliedKeyRef.current = storageKey;
        lastCanvasPxRef.current = { width: dims.width, height: dims.height };
        safeStorageSetItem(draftStorage.canvasKey, storageKey);
        safeStorageSetItem(draftStorage.elements, JSON.stringify(layered));
        safeStorageSetItem(draftStorage.frameSelection, JSON.stringify(selection));

        updateElementsWithHistory(layered);
        setSelectedElementId(isFixedOverlay ? null : frameElement.id);
        setActiveFrameAspectRatio(newAspectRatio);
        setFrameSelection(selection);
        setOrientationNotice(null);
    }, [
        elements,
        selectedProduct,
        canvasDimensions,
        orientationFlipped,
        printSizeLabel,
        updateElementsWithHistory,
        draftStorage,
    ]);

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

            const prepared = await prepareFrameImageSrc(source);
            const punchedSrc = await punchDropzoneHoles(prepared, detected);

            const withoutOldSlots = removeDropzoneImages(elements);
            const updated = withoutOldSlots.map((el) => (
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

            updateElementsWithHistory(enforceLayerOrder(updated));
            setSelectedElementId(null);
        } catch (err) {
            console.error(err);
            alert('שגיאה בזיהוי חלונות מהמסגרת');
        }
    }, [elements, updateElementsWithHistory]);

    const removeGlobalFrame = useCallback(() => {
        if (!elements.some(isGlobalFrame)) return;

        const dims = canvasDimensions;
        const updatedElements = stripLegacyDropzoneFields(
            removeDropzoneImages(removeGlobalFrames(elements)),
        );
        const layered = enforceLayerOrder(updatedElements);
        const storageKey = getCanvasStorageKey(selectedProduct, dims, null, orientationFlipped);

        canvasAppliedKeyRef.current = storageKey;
        lastCanvasPxRef.current = { width: dims.width, height: dims.height };
        safeStorageSetItem(draftStorage.canvasKey, storageKey);
        safeStorageSetItem(draftStorage.elements, JSON.stringify(layered));
        localStorage.removeItem(draftStorage.frameSelection);

        updateElementsWithHistory(layered);
        setSelectedElementId(null);
        setActiveFrameAspectRatio(null);
        setFrameSelection(null);
        setOrientationNotice(null);
    }, [elements, selectedProduct, canvasDimensions, orientationFlipped, updateElementsWithHistory, draftStorage]);

    const handleToggleOrientation = useCallback(() => {
        if (!selectedProduct?.allowOrientationToggle) return;

        const prevDims = canvasDimensions;
        const nextFlipped = !orientationFlipped;
        const newDims = getCanvasDimensions(selectedProduct, activeFrameAspectRatio, nextFlipped);

        let updatedElements = scaleElementsToCanvas(
            elements,
            prevDims.width,
            prevDims.height,
            newDims.width,
            newDims.height,
        );

        updatedElements = updatedElements.map((el) => (
            isGlobalFrame(el)
                ? { ...el, width: newDims.width, height: newDims.height, top: 0, left: 0 }
                : el
        ));

        // Refit the collage window photos to the new size
        const frame = updatedElements.find(isGlobalFrame);
        if (frame && isMultiDropzoneFrame(frame)) {
            const resolved = resolveDropzones(
                frame.dropzones,
                frame.width,
                frame.height,
                frame.left ?? 0,
                frame.top ?? 0,
            );
            updatedElements = updatedElements.map((el) => {
                if (!isDropzoneImage(el)) return el;
                const zone = resolved.find((z) => z.id === el.dropzoneId);
                if (!zone) return el;
                const fitted = fitImageToDropzone(el.naturalWidth, el.naturalHeight, zone);
                return { ...el, ...fitted };
            });
        }

        const layered = enforceLayerOrder(updatedElements);
        const storageKey = getCanvasStorageKey(
            selectedProduct,
            newDims,
            activeFrameAspectRatio,
            nextFlipped,
        );

        canvasAppliedKeyRef.current = storageKey;
        lastCanvasPxRef.current = { width: newDims.width, height: newDims.height };
        safeStorageSetItem(draftStorage.canvasKey, storageKey);
        safeStorageSetItem(draftStorage.elements, JSON.stringify(layered));

        setOrientationFlipped(nextFlipped);
        updateElementsWithHistory(layered);
        setSelectedElementId(null);
    }, [
        selectedProduct,
        canvasDimensions,
        orientationFlipped,
        activeFrameAspectRatio,
        elements,
        updateElementsWithHistory,
        draftStorage,
    ]);

    const addTextElement = useCallback(() => {
        const newElement = {
            ...createDefaultTextElement(canvasDimensions),
            id: `text_${Date.now()}`,
        };
        const newElements = enforceLayerOrder([...elements, newElement]);
        updateElementsWithHistory(newElements);
        setSelectedElementId(newElement.id);
    }, [elements, updateElementsWithHistory, canvasDimensions]);

    /** 1.3 – photo caption with the defaults the admin defines */
    const addCaptionElement = useCallback(() => {
        const newElement = createCaptionTextElement(
            canvasDimensions,
            editorSettings.captionDefaults,
        );
        const newElements = enforceLayerOrder([...elements, newElement]);
        updateElementsWithHistory(newElements);
        setSelectedElementId(newElement.id);
    }, [elements, updateElementsWithHistory, canvasDimensions, editorSettings.captionDefaults]);

    /** 1.2 – rotate the photo by 90° to match the frame's orientation */
    const handleRotateToMatchOrientation = useCallback(() => {
        if (!orientationNotice?.elementId) return;

        const target = elements.find((el) => el.id === orientationNotice.elementId);
        if (!target) {
            setOrientationNotice(null);
            return;
        }

        const rotated = rotateImageElement90(
            target,
            canvasDimensions.width,
            canvasDimensions.height,
        );

        updateElementsWithHistory(
            elements.map((el) => (el.id === rotated.id ? rotated : el)),
        );
        setSelectedElementId(rotated.id);
        setFrameSelection((prev) => (prev ? { ...prev, rotationApplied: true } : prev));
        setOrientationNotice(null);
    }, [orientationNotice, elements, canvasDimensions, updateElementsWithHistory]);

    const dismissOrientationNotice = useCallback(() => {
        setFrameSelection((prev) => (prev ? { ...prev, rotationApplied: false } : prev));
        setOrientationNotice(null);
    }, []);

    /** 1.2 – automatic detection of an orientation mismatch between the photo and the frame/canvas */
    const detectOrientationMismatch = useCallback((elementId, naturalWidth, naturalHeight) => {
        const imageOrientation = getOrientation(naturalWidth, naturalHeight);
        const targetOrientation = getTargetOrientation(
            getActiveGlobalFrame(elements),
            canvasDimensions,
        );

        if (!orientationsConflict(imageOrientation, targetOrientation)) {
            setOrientationNotice(null);
            return;
        }

        setOrientationNotice({ elementId, imageOrientation, targetOrientation });
    }, [elements, canvasDimensions]);

    const addImageElement = useCallback((src, width, height, naturalWidth, naturalHeight, { atBack = false } = {}) => {
        const { left, top } = centerPosition(
            width,
            height,
            canvasDimensions.width,
            canvasDimensions.height,
        );
        const newElement = {
            id: `image_${Date.now()}`,
            type: 'image',
            src,
            width,
            height,
            top,
            left,
            opacity: 1,
            rotation: 0,
            naturalWidth,
            naturalHeight,
            scaleX: 1,
            scaleY: 1,
            brightness: 100,
            contrast: 100,
            grayscale: 0,
            sepia: 0,
            blur: 0,
        };
        const inserted = insertBelowGlobalFrame(elements, newElement);
        // A base photo goes under the existing elements (e.g. the default text) instead of covering them
        const newElements = enforceLayerOrder(atBack ? moveElementToEdge(inserted, newElement.id, 'back') : inserted);
        updateElementsWithHistory(newElements);
        setSelectedElementId(newElement.id);
        setUploadedImages(prev => prev.includes(src) ? prev : [...prev, src]);
        detectOrientationMismatch(newElement.id, naturalWidth, naturalHeight);
    }, [elements, updateElementsWithHistory, canvasDimensions, detectOrientationMismatch]);

    // A photo the customer uploaded on the product page before choosing "עיצוב עצמי" is placed on the canvas,
    // fitted inside it, so she designs around it instead of uploading it again.
    const initialImageRef = useRef(location.state?.initialImage || null);
    const [pendingInitialImage, setPendingInitialImage] = useState(null);

    useEffect(() => {
        const src = initialImageRef.current;
        if (!src || !selectedProduct || !canvasDimensions.width || !canvasDimensions.height) return;
        initialImageRef.current = null;
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            const scale = Math.min(canvasDimensions.width / img.naturalWidth, canvasDimensions.height / img.naturalHeight);
            setPendingInitialImage({
                src,
                width: img.naturalWidth * scale,
                height: img.naturalHeight * scale,
                naturalWidth: img.naturalWidth,
                naturalHeight: img.naturalHeight,
            });
        };
        img.src = src;
    }, [selectedProduct, canvasDimensions.width, canvasDimensions.height]);

    // Added in its own render, after the draft was restored, so it is not overwritten
    useEffect(() => {
        if (!pendingInitialImage) return;
        const { src, width, height, naturalWidth, naturalHeight } = pendingInitialImage;
        setPendingInitialImage(null);
        addImageElement(src, width, height, naturalWidth, naturalHeight, { atBack: true });
        // Off the history entry, so a refresh (which restores the draft) does not add it a second time
        navigate(location.pathname, { replace: true, state: { ...location.state, initialImage: undefined } });
    }, [pendingInitialImage, addImageElement, navigate, location.pathname, location.state]);

    const addImageToDropzone = useCallback((dropzoneId, src, naturalWidth, naturalHeight) => {
        const frame = getActiveGlobalFrame(elements);
        if (!frame || !isMultiDropzoneFrame(frame) || !dropzoneId) return;

        const resolved = resolveDropzones(
            frame.dropzones,
            frame.width || canvasDimensions.width,
            frame.height || canvasDimensions.height,
            frame.left ?? 0,
            frame.top ?? 0,
        );
        const zone = resolved.find((z) => z.id === dropzoneId);
        if (!zone) return;

        const fitted = fitImageToDropzone(naturalWidth, naturalHeight, zone);
        const newElement = {
            id: `image_dz_${dropzoneId}_${Date.now()}`,
            type: 'image',
            dropzoneId,
            src,
            width: fitted.width,
            height: fitted.height,
            top: fitted.top,
            left: fitted.left,
            opacity: 1,
            rotation: 0,
            naturalWidth,
            naturalHeight,
            scaleX: 1,
            scaleY: 1,
            brightness: 100,
            contrast: 100,
            grayscale: 0,
            sepia: 0,
            blur: 0,
            locked: false,
        };

        const newElements = enforceLayerOrder(replaceDropzoneImage(elements, dropzoneId, newElement));
        updateElementsWithHistory(newElements);
        setSelectedElementId(newElement.id);
        setUploadedImages((prev) => (prev.includes(src) ? prev : [...prev, src]));
    }, [elements, updateElementsWithHistory, canvasDimensions]);

    const clearDropzoneImage = useCallback((dropzoneId) => {
        if (!dropzoneId) return;
        const existing = getDropzoneImageForSlot(elements, dropzoneId);
        if (!existing) return;
        const newElements = enforceLayerOrder(
            elements.filter((el) => !(isDropzoneImage(el) && el.dropzoneId === dropzoneId)),
        );
        updateElementsWithHistory(newElements);
        if (selectedElementId === existing.id) setSelectedElementId(null);
    }, [elements, selectedElementId, updateElementsWithHistory]);

    const addShapeElement = useCallback((svgContent) => {
        const width = 100;
        const height = 100;
        const { left, top } = centerPosition(
            width,
            height,
            canvasDimensions.width,
            canvasDimensions.height,
        );

        const newElement = {
            id: `shape_${Date.now()}`,
            type: 'shape',
            svgContent,
            fill: '#3B82F6',
            width,
            height,
            top,
            left,
            opacity: 1,
            rotation: 0,
            scaleX: 1,
            scaleY: 1,
        };
        const newElements = enforceLayerOrder(insertBelowGlobalFrame(elements, newElement));
        updateElementsWithHistory(newElements);
        setSelectedElementId(newElement.id);
    }, [elements, updateElementsWithHistory, canvasDimensions]);

    const updateElement = useCallback((id, newProps) => {
        setElements((prev) => {
            const target = prev.find((el) => el.id === id);
            if (!target) return prev;

            // Moving/resizing a frame – the collage windows move with it
            if (
                isGlobalFrame(target)
                && (newProps.left !== undefined
                    || newProps.top !== undefined
                    || newProps.width !== undefined
                    || newProps.height !== undefined)
            ) {
                const nextFrame = { ...target, ...newProps };
                const dx = (nextFrame.left ?? 0) - (target.left ?? 0);
                const dy = (nextFrame.top ?? 0) - (target.top ?? 0);
                const sizeChanged = (
                    (newProps.width !== undefined && newProps.width !== target.width)
                    || (newProps.height !== undefined && newProps.height !== target.height)
                );

                return prev.map((el) => {
                    if (el.id === id) return nextFrame;
                    if (!isDropzoneImage(el)) return el;

                    if (sizeChanged && isMultiDropzoneFrame(nextFrame)) {
                        const zones = resolveDropzones(
                            nextFrame.dropzones,
                            nextFrame.width,
                            nextFrame.height,
                            nextFrame.left ?? 0,
                            nextFrame.top ?? 0,
                        );
                        const zone = zones.find((z) => z.id === el.dropzoneId);
                        if (!zone) return el;
                        return { ...el, ...fitImageToDropzone(el.naturalWidth, el.naturalHeight, zone) };
                    }

                    if (dx || dy) {
                        return { ...el, left: (el.left ?? 0) + dx, top: (el.top ?? 0) + dy };
                    }
                    return el;
                });
            }

            return prev.map((el) => (el.id === id ? { ...el, ...newProps } : el));
        });
    }, []);

    const deleteElement = useCallback(() => {
        if (!selectedElementId) return;
        const target = elements.find((el) => el.id === selectedElementId);
        if (!target) return;

        if (isGlobalFrame(target)) {
            removeGlobalFrame();
            return;
        }

        const newElements = elements.filter(el => el.id !== selectedElementId);
        updateElementsWithHistory(newElements);
        setSelectedElementId(null);
    }, [elements, selectedElementId, updateElementsWithHistory, removeGlobalFrame]);

    const selectGlobalFrame = useCallback(() => {
        const frame = getActiveGlobalFrame(elements);
        if (!frame) return;
        setSelectedElementId(frame.id);
    }, [elements]);

    const duplicateElementWithState = useCallback(() => {
        const elementToDuplicate = elements.find(el => el.id === selectedElementId);
        if (!elementToDuplicate || elementToDuplicate.locked || isGlobalFrame(elementToDuplicate)) return;
        // Collage photos – not duplicated (one window per photo)
        if (isDropzoneImage(elementToDuplicate)) return;

        const newElement = {
            ...elementToDuplicate,
            id: `${elementToDuplicate.type}_${Date.now()}`,
            top: elementToDuplicate.top + 20,
            left: elementToDuplicate.left + 20,
            locked: false,
        };

        const newElements = [...elements, newElement];
        updateElementsWithHistory(newElements);
        setSelectedElementId(newElement.id);
    }, [elements, selectedElementId, updateElementsWithHistory]);

    const toggleLockElement = useCallback(() => {
        if (!selectedElementId) return;
        const newElements = elements.map(el =>
            el.id === selectedElementId ? { ...el, locked: !el.locked } : el
        );
        updateElementsWithHistory(newElements);
    }, [elements, selectedElementId, updateElementsWithHistory]);

    const handleBringToFront = useCallback(() => {
        if (!selectedElementId) return;
        updateElementsWithHistory(moveElementToEdge(elements, selectedElementId, 'front'));
    }, [elements, selectedElementId, updateElementsWithHistory]);

    const handleSendToBack = useCallback(() => {
        if (!selectedElementId) return;
        updateElementsWithHistory(moveElementToEdge(elements, selectedElementId, 'back'));
    }, [elements, selectedElementId, updateElementsWithHistory]);

    const deleteUploadedImage = useCallback((srcToDelete) => {
        setUploadedImages(prev => prev.filter(src => src !== srcToDelete));
        const newElements = elements.filter(el => {
            if (el.type === 'image' && el.src === srcToDelete) {
                return false;
            }
            return true;
        });

        if (newElements.length !== elements.length) {
            updateElementsWithHistory(newElements);
        }
        if (selectedElementId && !newElements.find(el => el.id === selectedElementId)) {
            setSelectedElementId(null);
        }
    }, [elements, selectedElementId, updateElementsWithHistory]);

    const addUploadedBackground = useCallback((src) => {
        setUploadedBackgrounds(prev => prev.includes(src) ? prev : [...prev, src]);
    }, []);

    const deleteUploadedBackground = useCallback((srcToDelete) => {
        setUploadedBackgrounds(prev => prev.filter(src => src !== srcToDelete));
        setCanvasBackground(prev =>
            (prev.type === 'image' && prev.value === srcToDelete)
                ? { type: 'color', value: '#FFFFFF' }
                : prev
        );
    }, []);

    const selectedElement = elements.find(el => el.id === selectedElementId) || null;

    const handleSaveCrop = useCallback((elementId, croppedPx) => {
        const newElements = elements.map(el => {
            if (el.id !== elementId || el.type !== 'image') return el;

            const { width: currentWidth, height: currentHeight } = el;
            const cropAspectRatio = croppedPx.width / croppedPx.height;
            let newWidth, newHeight;

            if (currentWidth > currentHeight) {
                newWidth = currentWidth;
                newHeight = currentWidth / cropAspectRatio;
            } else {
                newHeight = currentHeight;
                newWidth = currentHeight * cropAspectRatio;
            }

            return {
                ...el,
                crop: croppedPx,
                width: newWidth,
                height: newHeight,
            };
        });
        updateElementsWithHistory(newElements);
        setCroppingElementId(null);
    }, [elements, updateElementsWithHistory]);

    const handleCancelCrop = useCallback(() => {
        setCroppingElementId(null);
    }, []);

    // --- A separate design for each copy (quantity > 1, chosen on the product page) ---
    const perCopyCount = isPerCopyMode ? Math.max(2, Number(location.state?.quantity) || orderQuantity || 2) : 0;
    const copiesStorageKey = `${ACTIVE_ELEMENTS_STORAGE_PREFIX}_copies_${draftProductKey}`;
    const [copyDesigns, setCopyDesigns] = useState(() => {
        if (!perCopyCount) return [];
        return safeJsonParse(localStorage.getItem(copiesStorageKey), []) || [];
    });
    const [activeCopy, setActiveCopy] = useState(0);
    const [copyPreviews, setCopyPreviews] = useState(null);

    // After the product's draft was restored, the copy being edited comes from the saved copies
    const copiesLoadedRef = useRef(false);
    useEffect(() => {
        if (!perCopyCount || copiesLoadedRef.current || !canvasAppliedKeyRef.current) return;
        copiesLoadedRef.current = true;
        const saved = copyDesigns[activeCopy];
        if (saved?.elements?.length) {
            setElements(saved.elements);
            setCanvasBackground(saved.canvasBackground || { type: 'color', value: '#FFFFFF' });
            setHistory([saved.elements]);
            setHistoryIndex(0);
        }
    });

    const blankCopy = useCallback(() => ({
        elements: [createDefaultTextElement(canvasDimensions)],
        canvasBackground: { type: 'color', value: '#FFFFFF' },
    }), [canvasDimensions]);

    /** All copies, with the one on the canvas taken from the canvas itself */
    const currentCopyDesigns = useCallback(() => {
        const designs = Array.from({ length: perCopyCount }, (_, i) => copyDesigns[i] || null);
        designs[activeCopy] = { elements, canvasBackground };
        return designs;
    }, [perCopyCount, copyDesigns, activeCopy, elements, canvasBackground]);

    // Each copy's design is kept across refreshes, like the single design's draft
    useEffect(() => {
        if (!perCopyCount || !canvasAppliedKeyRef.current) return;
        safeStorageSetItem(copiesStorageKey, JSON.stringify(currentCopyDesigns()));
    }, [perCopyCount, copiesStorageKey, currentCopyDesigns]);

    const loadDesignOnCanvas = useCallback((design) => {
        setElements(design.elements);
        setCanvasBackground(design.canvasBackground);
        setHistory([design.elements]);
        setHistoryIndex(0);
        setSelectedElementId(null);
    }, []);

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
            for (let i = 0; i < designs.length; i += 1) {
                const design = designs[i] || blankCopy();
                loadDesignOnCanvas(design);
                await new Promise((resolve) => setTimeout(resolve, 150));
                images.push(await captureCanvasImage(pixelRatio, design.canvasBackground));
            }
        } finally {
            setCopyDesigns(designs);
            loadDesignOnCanvas(designs[activeCopy] || blankCopy());
        }
        return images;
    }, [currentCopyDesigns, loadDesignOnCanvas, blankCopy, captureCanvasImage, activeCopy]);

    const handlePreviewCopies = useCallback(async () => {
        setIsPreviewLoading(true);
        try {
            setCopyPreviews(await captureAllCopies(1));
        } catch (error) {
            console.error('Copies preview failed', error);
            alert('אירעה שגיאה ביצירת התצוגה המקדימה. אנא נסה שוב.');
        } finally {
            setIsPreviewLoading(false);
        }
    }, [captureAllCopies]);

    /** One cart line, quantity = copies, with each copy's print file uploaded */
    const handleConfirmCopies = useCallback(async () => {
        setIsSaving(true);
        try {
            const designs = currentCopyDesigns();
            const printImages = await captureAllCopies();
            const files = await Promise.all(printImages.map(async (dataUrl, i) => {
                const blob = await (await fetch(dataUrl)).blob();
                return new File([blob], `copy-${i + 1}.png`, { type: 'image/png' });
            }));
            // A few uploads at a time, with retries; one failed copy fails the whole order line
            const { uploaded, failed } = await uploadFilesInParallel(files);
            if (failed.length) throw failed[0].error;
            const copies = uploaded.map(({ url }) => ({ image: url }));
            const product = typeof selectedProduct === 'object' ? selectedProduct : null;
            const unitPrice = product ? getUnitPriceForQuantity(product, perCopyCount) : 0;
            const cartItem = withTieredPricingFields({
                id: `cart_${Date.now()}`,
                productId: product?._id || product?.id || 'custom_product',
                name: `${product?.name || 'מוצר'} בעיצוב אישי (עיצוב לכל עותק)`,
                price: unitPrice,
                image: copies[0]?.image || product?.image,
                quantity: perCopyCount,
                size: product?.size,
                customDesign: {
                    projectName,
                    copies,
                    captions: collectCaptions(designs.flatMap((design) => design?.elements || [])),
                    printSizeCm: { width: canvasDimensions.widthCm, height: canvasDimensions.heightCm },
                },
            }, product);
            await addToCart([cartItem], { successMessage: `${perCopyCount} העיצובים נוספו לסל הקניות!` });
            setCopyPreviews(null);
            localStorage.removeItem(copiesStorageKey);
            if (onNavigateToHome) onNavigateToHome();
        } catch (error) {
            console.error('Failed to order copies', error);
            alert('אירעה שגיאה בעיבוד ההזמנה, אנא נסה שנית.');
        } finally {
            setIsSaving(false);
        }
    }, [captureAllCopies, currentCopyDesigns, selectedProduct, perCopyCount, projectName, collectCaptions, canvasDimensions, addToCart, copiesStorageKey, onNavigateToHome]);

    const handlePreview = useCallback(async () => {
        setIsPreviewLoading(true);
        setPreviewImage(null);

        try {
            const dataUrl = await captureCanvasImage();
            if (!dataUrl) {
                alert('לא נמצא משטח העיצוב. נסה לרענן את הדף.');
                return;
            }
            setPreviewImage(dataUrl);
            setShowPreviewModal(true);
        } catch (error) {
            console.error('Preview generation failed', error);
            alert('אירעה שגיאה ביצירת התצוגה המקדימה. אנא נסה שוב.');
        } finally {
            setIsPreviewLoading(false);
        }
    }, [captureCanvasImage]);

    return (
        <div className="flex flex-col flex-1 min-h-0 h-full overflow-hidden" style={{ direction: 'rtl' }}>
            <EditorHeader
                onExit={onNavigateToHome}
                projectName={projectName}
                onProjectNameChange={setProjectName}
                onPreview={perCopyCount ? handlePreviewCopies : handlePreview}
                isPreviewLoading={isPreviewLoading}
                onUndo={handleUndo}
                onRedo={handleRedo}
                canUndo={historyIndex > 0}
                canRedo={historyIndex < history.length - 1}
                onSave={handleSaveToDatabase}
                onLoad={handleOpenLoadModal}
                productLabel={selectedProduct?.name || null}
                printSizeLabel={printSizeLabel}
            />
            {perCopyCount > 0 && (
                <div className="shrink-0 bg-[#fff5f4] border-b border-[#f2665e]/20 px-3 py-2 flex items-center gap-2 overflow-x-auto" dir="rtl">
                    <span className="text-xs font-bold text-[#a83232] whitespace-nowrap">עיצוב לכל עותק:</span>
                    {Array.from({ length: perCopyCount }, (_, i) => {
                        const designed = i === activeCopy || Boolean(copyDesigns[i]);
                        return (
                            <button
                                key={i}
                                type="button"
                                onClick={() => switchCopy(i)}
                                aria-pressed={i === activeCopy}
                                className={`whitespace-nowrap text-xs font-bold px-3 py-1.5 rounded-full border transition-colors ${
                                    i === activeCopy
                                        ? 'bg-[#f2665e] text-white border-[#f2665e]'
                                        : 'bg-white text-[#f2665e] border-[#f2665e]/40 hover:bg-[#ffeae8]'
                                }`}
                            >
                                עותק {i + 1}{designed && i !== activeCopy ? ' ✓' : ''}
                            </button>
                        );
                    })}
                    <span className="text-[11px] text-gray-500 whitespace-nowrap mr-auto">בסיום לוחצים &quot;המשך&quot; לצפייה בכל העיצובים</span>
                </div>
            )}


            <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
                <div className="order-1 md:order-2 flex-1 min-h-0 min-w-0 relative overflow-hidden flex flex-col">
                    {selectedElement && (
                        <div className="absolute top-0 left-0 right-0 z-40 overflow-x-auto">
                            <ContextualToolbar
                                selectedElement={selectedElement}
                                onUpdateElement={(props) => selectedElement && updateElement(selectedElement.id, props)}
                                onCrop={() => selectedElement && setCroppingElementId(selectedElement.id)}
                                onDuplicate={duplicateElementWithState}
                                onDelete={deleteElement}
                                onBringToFront={handleBringToFront}
                                onSendToBack={handleSendToBack}
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
                    updateElement={updateElement}
                    croppingElementId={croppingElementId}
                    onSaveCrop={handleSaveCrop}
                    onCancelCrop={handleCancelCrop}
                    onDelete={deleteElement}
                    onDuplicate={duplicateElementWithState}
                    onToggleLock={toggleLockElement}
                    canvasBackground={canvasBackground}
                    showGrid={showGrid}
                    gridSize={gridSize}
                    zoom={zoom}
                    canvasWidth={canvasDimensions.width}
                    canvasHeight={canvasDimensions.height}
                    printWidthCm={canvasDimensions.widthCm}
                    printHeightCm={canvasDimensions.heightCm}
                    showOrientationToggle={Boolean(selectedProduct?.allowOrientationToggle)}
                    onToggleOrientation={handleToggleOrientation}
                    onAddImageToDropzone={addImageToDropzone}
                />
                    <OrientationMismatchNotice
                        notice={orientationNotice}
                        prompt={editorSettings.orientationPrompt}
                        orientationLabels={editorSettings.orientationLabels}
                        onRotate={handleRotateToMatchOrientation}
                        onDismiss={dismissOrientationNotice}
                    />
                </div>
                <div className="order-2 md:order-1 shrink-0 md:h-full md:flex md:flex-col">
                    <EditorSidebar
                        addTextElement={addTextElement}
                        addCaptionElement={addCaptionElement}
                        addImageElement={addImageElement}
                        addShapeElement={addShapeElement}
                        onApplyGlobalFrame={applyGlobalFrame}
                        onRemoveGlobalFrame={removeGlobalFrame}
                        onSelectGlobalFrame={selectGlobalFrame}
                        onDetectFrameSlots={detectSlotsOnActiveFrame}
                        activeGlobalFrameId={activeGlobalFrameId}
                        activeGlobalFrame={activeGlobalFrame}
                        elements={elements}
                        onAddImageToDropzone={addImageToDropzone}
                        onClearDropzoneImage={clearDropzoneImage}
                        uploadedImages={uploadedImages}
                        deleteUploadedImage={deleteUploadedImage}
                        selectedElement={selectedElement}
                        onUpdateElement={(props) => {
                            if (selectedElement) {
                                updateElement(selectedElement.id, props);
                            }
                        }}
                        canvasBackground={canvasBackground}
                        setCanvasBackground={setCanvasBackground}
                        uploadedBackgrounds={uploadedBackgrounds}
                        addUploadedBackground={addUploadedBackground}
                        deleteUploadedBackground={deleteUploadedBackground}
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

            {/* Saved projects modal */}
            {showLoadModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black bg-opacity-75 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden">
                        <div className="p-5 border-b flex justify-between items-center bg-gray-50">
                            <h3 className="text-xl font-bold text-gray-800">הפרויקטים שלי</h3>
                            <button onClick={() => setShowLoadModal(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                                <XIcon className="w-6 h-6 text-gray-500" />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 bg-gray-100">
                            {savedProjects.length === 0 ? (
                                <div className="text-center py-20 text-gray-500">
                                    <p className="text-xl mb-2">אין פרויקטים שמורים</p>
                                    <p className="text-sm">שמור את העיצוב הנוכחי שלך כדי לראות אותו כאן</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {savedProjects.map((proj) => (
                                        <div
                                            key={proj._id}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handleLoadProjectFromDB(proj);
                                            }}
                                            className="bg-white rounded-xl shadow-sm hover:shadow-md border border-gray-200 overflow-hidden cursor-pointer transition-all hover:border-red-300 group relative flex flex-col"
                                        >
                                            <div className="h-40 bg-gray-100 flex items-center justify-center overflow-hidden relative">
                                                {proj.preview ? (
                                                    <img src={proj.preview} alt={proj.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-gray-400">אין תצוגה מקדימה</span>
                                                )}
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                            </div>
                                            <div className="p-4 flex-1 flex flex-col justify-between">
                                                <div>
                                                    <div className="flex justify-between items-start mb-2">
                                                        <h4 className="font-bold text-gray-800 truncate flex-1 ml-2">{proj.name}</h4>
                                                        <button
                                                            onClick={(e) => handleDeleteProject(e, proj._id)}
                                                            className="text-gray-400 hover:text-red-500 p-1 hover:bg-red-50 rounded transition-colors"
                                                            title="מחק פרויקט"
                                                        >
                                                            <TrashIcon className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                    <div className="flex items-center text-xs text-gray-500 mt-1">
                                                        <ClockIcon className="w-3 h-3 ml-1" />
                                                        {proj.updatedAt ? new Date(proj.updatedAt).toLocaleDateString('he-IL') : 'תאריך לא ידוע'}
                                                    </div>
                                                </div>
                                                
                                                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                                                    {proj.selectedProduct ? (
                                                        <span className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded-full max-w-[50%] truncate">
                                                            {proj.selectedProduct?.name || (typeof proj.selectedProduct === 'string' ? proj.selectedProduct : 'מוצר')}
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-gray-400">מוצר כללי</span>
                                                    )}
                                                    
                                                    <button
                                                        onClick={(e) => handleAddExistingProjectToCart(e, proj)}
                                                        className="flex items-center bg-red-500 text-white text-xs font-bold py-1.5 px-3 rounded-lg hover:bg-red-600 transition-colors shadow-sm"
                                                    >
                                                        <span>הוסף לסל</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {copyPreviews && (
                <div className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center p-4" dir="rtl" role="dialog" aria-modal="true" aria-label="כל העיצובים">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                        <div className="px-5 py-4 border-b flex items-center justify-between">
                            <h2 className="text-lg font-bold text-gray-800">כל העיצובים ({copyPreviews.length} עותקים)</h2>
                            <button type="button" onClick={() => setCopyPreviews(null)} className="text-gray-400 hover:text-gray-700 text-xl" aria-label="סגירה">×</button>
                        </div>
                        <div className="p-5 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {copyPreviews.map((src, i) => (
                                <button key={i} type="button" onClick={() => { setCopyPreviews(null); switchCopy(i); }} className="text-right group">
                                    <img src={src} alt={`עותק ${i + 1}`} className="w-full rounded-lg border bg-gray-50 group-hover:ring-2 ring-[#f2665e]" />
                                    <span className="block text-xs text-gray-600 mt-1">עותק {i + 1} · לחיצה לעריכה</span>
                                </button>
                            ))}
                        </div>
                        <div className="px-5 py-4 border-t flex gap-3 justify-end">
                            <button type="button" onClick={() => setCopyPreviews(null)} className="px-5 py-2 rounded-full text-sm text-gray-700 hover:bg-gray-100">חזרה לעריכה</button>
                            <button type="button" onClick={handleConfirmCopies} disabled={isSaving} className="px-6 py-2 rounded-full bg-[#f2665e] text-white font-bold text-sm hover:bg-[#d95248] disabled:opacity-60">
                                {isSaving ? 'מכין את העיצובים...' : `אישור והוספת ${copyPreviews.length} עותקים לסל`}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ProductPreviewModal
                isOpen={showPreviewModal}
                onClose={() => setShowPreviewModal(false)}
                previewImage={previewImage}
                productNameHe={
                    selectedProduct?.name
                    || (typeof selectedProduct === 'string' ? selectedProduct : null)
                }
                printSizeLabel={printSizeLabel}
                isSaving={isSaving}
                onConfirm={handleConfirmAndOrder}
            />

            {/* Loading Overlay */}
            {(isPreviewLoading || isSaving) && !showPreviewModal && (
                <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
                    <svg className="animate-spin h-16 w-16 text-red-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">{isSaving ? 'מעבד הזמנה...' : 'יוצר תצוגה מקדימה...'}</h2>
                    <p className="text-gray-600">{isSaving ? 'נא להמתין בזמן שהמוצר מתווסף לעגלה שלך...' : 'מכין את העיצוב שלך להדפסה'}</p>
                </div>
            )}
        </div>
    );
};

export default EditorPage;