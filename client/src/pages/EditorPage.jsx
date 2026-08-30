import { toPng } from 'html-to-image';
import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useParams, useLocation } from 'react-router-dom';
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
} from '../utils/canvasDimensions';
import {
    enforceLayerOrder,
    extractFrameAspectRatio,
    getActiveGlobalFrame,
    getDropzoneImageForSlot,
    insertBelowGlobalFrame,
    isDropzoneImage,
    isGlobalFrame,
    removeDropzoneImages,
    removeGlobalFrames,
    replaceDropzoneImage,
    stripLegacyDropzoneFields,
} from '../utils/editorLayering';
import { fitImageToDropzone, isMultiDropzoneFrame, resolveDropzones } from '../utils/dropzoneUtils';
import { detectEmptyPhotoSlots } from '../utils/detectEmptyPhotoSlots';
import Canvas from '../components/editor/Canvas.jsx';
import ContextualToolbar from '../components/editor/ContextualToolbar';
import EditorFooter from '../components/editor/EditorFooter';
import EditorHeader from '../components/editor/EditorHeader';
import EditorSidebar from '../components/editor/EditorSidebar.jsx';
import ProductPreviewModal from '../components/editor/ProductPreviewModal';
import { ClockIcon, TrashIcon, XIcon } from '../components/icons';
import { db } from '../services/databaseService';
import { useProductStore } from '../store/productStore';
import { useCartStore } from '../store/cartStore'; 
import useAuthStore from '../store/authStore';
import { getUnitPriceForQuantity } from '../utils/productQuantityPricing';
import { withTieredPricingFields } from '../utils/cartItem';
import { prepareFrameImageSrc, punchDropzoneHoles } from '../utils/frameImageProcessing';

const CANVAS_KEY_STORAGE_PREFIX = 'active_editor_canvas_key';
const ACTIVE_ELEMENTS_STORAGE_PREFIX = 'active_editor_elements';
const ACTIVE_BG_STORAGE_PREFIX = 'active_editor_bg';
const ACTIVE_NAME_STORAGE_PREFIX = 'active_editor_name';

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

const EditorPage = ({ onNavigateToHome, onNavigateToCart }) => {
    const { productId } = useParams();
    const location = useLocation();

    // שליפת המוצר הנבחר מה-Store של המוצרים
    const { selectedProduct, setSelectedProduct, orderQuantity } = useProductStore();
    const onSelectProduct = setSelectedProduct;
    
    // שליפת פונקציית ההוספה לסל מה-Store של העגלה
    const addToCart = useCartStore((state) => state.addToCart);
    const userId = useAuthStore((state) => state.userId);

    const [activeFrameAspectRatio, setActiveFrameAspectRatio] = useState(null);
    const [orientationFlipped, setOrientationFlipped] = useState(false);

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

    // --- ניהול סטייט מקומי וטיוטות ---
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

        // כבר מעובד עם חורים / data URL – לא לדרוס
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
                    // גם אם ה-src זהה, לסמן שעודכן לחורים v2
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
        const savedElements = safeStorageSetItem(draftStorage.elements, JSON.stringify(elements));
        safeStorageSetItem(draftStorage.background, JSON.stringify(canvasBackground));
        safeStorageSetItem(draftStorage.projectName, projectName);

        if (!savedElements && !storageWarningShownRef.current) {
            storageWarningShownRef.current = true;
            alert('נפח האחסון המקומי מלא. השינויים ימשיכו לעבוד, אבל לא יישמרו מקומית עד לניקוי אחסון בדפדפן.');
        }
    }, [elements, canvasBackground, projectName, draftStorage]);

    // התאמת משטח העבודה למידות ההדפסה של המוצר שנבחר
    useEffect(() => {
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
        } else {
            nextElements = [createDefaultTextElement(canvasDimensions)];
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

    // טעינת המוצר שנבחר מעמוד המוצרים (state של הניווט או שליפה לפי מזהה ב-URL)
    useEffect(() => {
        const productFromNav = location.state?.product;
        if (productFromNav) {
            setSelectedProduct(productFromNav);
            return;
        }

        if (!productId) return;

        let cancelled = false;
        getProductById(productId)
            .then((product) => {
                if (!cancelled && product) {
                    setSelectedProduct(product);
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

    // פונקציית שמירת פרויקט לבסיס הנתונים
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

    /** צילום משטח העיצוב – בלי מוקאפ AI (מציג בדיוק מה שעיצבת) */
    const captureCanvasImage = useCallback(async (pixelRatioOverride) => {
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
            return await toPng(node, {
                quality: 1,
                pixelRatio,
                filter: (n) =>
                    !n.classList?.contains('canvas-grid-overlay')
                    && !n.classList?.contains('canvas-safe-zone-overlay'),
                backgroundColor: canvasBackground.type === 'color' ? canvasBackground.value : undefined,
                style: { transform: 'scale(1)', outline: 'none', outlineOffset: 0 },
                cacheBust: true,
            });
        } finally {
            if (previousZoom !== 100) {
                setZoom(previousZoom);
            }
        }
    }, [canvasBackground, zoom, canvasDimensions]);

    // --- 1. כפתור "אישור והזמנה" הראשי מתוך מסך התצוגה המקדימה ---
    const handleConfirmAndOrder = useCallback(async () => {
        setIsSaving(true);
        try {
            // תמונה קטנה לתצוגה בעגלה / שמירה מקומית (לא תמונת הדפסה ענקית)
            const cartThumb = previewImage || (await captureCanvasImage(2));
            if (cartThumb) {
                setPreviewImage(cartThumb);
            }

            // א. שמירת הפרויקט לקבלת מזהה ייחודי
            const savedProject = await saveProjectToDB(cartThumb || undefined);
            
            // ב. הגדרת משתני ברירת מחדל למקרה קיצוני שהאובייקט ריק
            let productName = 'מוצר בעיצוב אישי';
            let productPrice = 24.99; 
            let productOriginalId = 'custom_product';

            // ג. שליפה ישירה ומדויקת מתוך האובייקט שהגיע מהקליק של המשתמש (ללא ניחושים)
            if (selectedProduct) {
                if (typeof selectedProduct === 'object') {
                    // שליפת השם המקורי של המוצר (למשל Travel Mug)
                    productName = selectedProduct.name ? `${selectedProduct.name} בעיצוב אישי` : productName;
                    productOriginalId = selectedProduct._id || selectedProduct.id || productOriginalId;
                    
                    // חילוץ חכם של המחיר: מנקה הכל חוץ ממספרים ונקודה (למשל מנקה סימני ₪ או רווחים)
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

            // ד. בניית אובייקט עגלה תקין לחלוטין עם המחיר והשם המקוריים
            const cartItem = withTieredPricingFields({
                id: `cart_${Date.now()}`,
                productId: productOriginalId,
                name: productName.includes('עיצוב אישי') ? productName : `${productName} בעיצוב אישי`, 
                price: productPrice,            
                image: cartThumb || savedProject.preview || selectedProduct?.image,
                quantity: orderQuantity || 1,
                customDesign: {
                    projectId: savedProject._id,
                    projectName: savedProject.name,
                    elements: savedProject.elements,
                    canvasBackground: savedProject.canvasBackground,
                    canvasSize: savedProject.canvasSize,
                    printSizeCm: {
                        width: canvasDimensions.widthCm,
                        height: canvasDimensions.heightCm,
                    },
                }
            }, typeof selectedProduct === 'object' ? selectedProduct : null);

            // ה. הזרקה לסל הקניות (תמונה ממוזערת/URL קל לתצוגה בעגלה)
            await addToCart([cartItem]);

            alert('המוצר והעיצוב שלך נוספו בהצלחה לסל הקניות!');
            setShowPreviewModal(false);
            clearDraft();

            if (onNavigateToCart) {
                onNavigateToCart();
            }
        } catch (error) {
            console.error("Failed to order project", error);
            alert("אירעה שגיאה בעיבוד ההזמנה, אנא נסה שנית.");
        } finally {
            setIsSaving(false);
        }
    }, [selectedProduct, previewImage, canvasBackground, projectName, elements, uploadedImages, uploadedBackgrounds, currentProjectId, addToCart, onNavigateToCart, captureCanvasImage, canvasDimensions, orderQuantity]);

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

    // --- 2. כפתור הוספה ישירה לסל מתוך מסך "הפרויקטים שלי" ---
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
                customDesign: {
                    projectId: proj._id,
                    projectName: proj.name,
                    elements: proj.elements,
                    canvasBackground: proj.canvasBackground
                }
            }, typeof proj.selectedProduct === 'object' ? proj.selectedProduct : null);

            await addToCart([cartItem]);
            
            alert(`הפרויקט "${proj.name}" נוסף בהצלחה לסל הקניות!`);
            setShowLoadModal(false);
            
            if (onNavigateToCart) {
                onNavigateToCart();
            }
        } catch (error) {
            console.error("Error adding project to cart", error);
            alert("שגיאה בהוספת הפרויקט לסל");
        }
    }, [addToCart, onNavigateToCart]);

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
            };

            safeStorageSetItem(
                loadedDraftStorage.canvasKey,
                getCanvasStorageKey(loadedProduct, loadedDims, loadedAspect, loadedOrientationFlipped),
            );
            safeStorageSetItem(loadedDraftStorage.elements, JSON.stringify(loadedElements));
            safeStorageSetItem(loadedDraftStorage.background, JSON.stringify(project.canvasBackground || { type: 'color', value: '#FFFFFF' }));
            safeStorageSetItem(loadedDraftStorage.projectName, project.name || 'הפרויקט שלי');
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

    const applyGlobalFrame = useCallback(async (frame) => {
        const newAspectRatio = frame.aspectRatio;
        const dims = canvasDimensions;

        let dropzones = Array.isArray(frame.dropzones) ? frame.dropzones : [];
        let layoutType = frame.layoutType === 'multi_dropzone' ? 'multi_dropzone' : 'single_overlay';

        // אם אין חלונות מוגדרים – מנסים לזהות ריבועים ריקים בתמונה (כמו בתבניות קולאז׳)
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

        const frameElement = {
            id: `globalFrame_${frame._id}`,
            type: 'globalFrame',
            frameId: frame._id,
            src: frameSrc,
            originalSrc: frame.imageUrl,
            title: frame.title,
            aspectRatio: frame.aspectRatio,
            layoutType: isMulti ? 'multi_dropzone' : 'single_overlay',
            dropzones: isMulti ? dropzones : [],
            holesPunched: isMulti ? 'v2' : false,
            width: dims.width,
            height: dims.height,
            top: 0,
            left: 0,
            opacity: 1,
            rotation: 0,
            locked: false,
        };

        const layered = enforceLayerOrder([...updatedElements, frameElement]);
        const storageKey = getCanvasStorageKey(
            selectedProduct,
            dims,
            newAspectRatio,
            orientationFlipped,
        );

        canvasAppliedKeyRef.current = storageKey;
        lastCanvasPxRef.current = { width: dims.width, height: dims.height };
        safeStorageSetItem(draftStorage.canvasKey, storageKey);
        safeStorageSetItem(draftStorage.elements, JSON.stringify(layered));

        updateElementsWithHistory(layered);
        setSelectedElementId(frameElement.id);
        setActiveFrameAspectRatio(newAspectRatio);
    }, [elements, selectedProduct, canvasDimensions, orientationFlipped, updateElementsWithHistory, draftStorage]);

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

        updateElementsWithHistory(layered);
        setSelectedElementId(null);
        setActiveFrameAspectRatio(null);
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

        // התאמה מחדש של תמונות חלונות הקולאז׳ לגודל החדש
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

    const addImageElement = useCallback((src, width, height, naturalWidth, naturalHeight) => {
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
        const newElements = enforceLayerOrder(insertBelowGlobalFrame(elements, newElement));
        updateElementsWithHistory(newElements);
        setSelectedElementId(newElement.id);
        setUploadedImages(prev => prev.includes(src) ? prev : [...prev, src]);
    }, [elements, updateElementsWithHistory, canvasDimensions]);

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

            // הזזת/שינוי גודל מסגרת – חלונות הקולאז׳ זזים יחד איתה
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
        // תמונות קולאז׳ – לא משכפלים (חלון אחד לתמונה)
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
        const el = elements.find((item) => item.id === selectedElementId);
        if (!el || isGlobalFrame(el)) return;

        const newElements = [...elements];
        const index = newElements.findIndex((item) => item.id === selectedElementId);
        if (index === -1) return;

        const [removed] = newElements.splice(index, 1);

        if (el.type === 'text') {
            newElements.push(removed);
        } else {
            const frameIdx = newElements.findIndex(isGlobalFrame);
            if (frameIdx === -1) {
                newElements.push(removed);
            } else {
                newElements.splice(frameIdx, 0, removed);
            }
        }

        updateElementsWithHistory(enforceLayerOrder(newElements));
    }, [elements, selectedElementId, updateElementsWithHistory]);

    const handleSendToBack = useCallback(() => {
        if (!selectedElementId) return;
        const el = elements.find((item) => item.id === selectedElementId);
        if (!el || isGlobalFrame(el)) return;

        const newElements = [...elements];
        const index = newElements.findIndex((item) => item.id === selectedElementId);
        if (index === -1) return;

        const [removed] = newElements.splice(index, 1);

        if (el.type === 'text') {
            const frameIdx = newElements.findIndex(isGlobalFrame);
            const insertAt = frameIdx === -1 ? 0 : frameIdx + 1;
            newElements.splice(insertAt, 0, removed);
        } else {
            newElements.unshift(removed);
        }

        updateElementsWithHistory(enforceLayerOrder(newElements));
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
                onPreview={handlePreview}
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
                            />
                        </div>
                    )}
                    <Canvas
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
                </div>
                <div className="order-2 md:order-1 shrink-0 md:h-full md:flex md:flex-col">
                    <EditorSidebar
                        addTextElement={addTextElement}
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

            {/* מודאל פרויקטים שמורים */}
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