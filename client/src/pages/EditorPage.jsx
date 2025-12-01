import React, { useState, useCallback, useEffect, useRef } from 'react';
import EditorHeader from '../components/editor/EditorHeader';

import Canvas from '../components/editor/Canvas.jsx';
import EditorFooter from '../components/editor/EditorFooter';
import ContextualToolbar from '../components/editor/ContextualToolbar';
import { toPng } from 'html-to-image';
import { generatePersonalizedProduct } from '../services/geminiService';
import { XIcon, SparklesIcon, TrashIcon, ClockIcon } from '../components/icons';
import { db } from '../services/databaseService';
import EditorSidebar from '../components/editor/EditorSideBar.jsx';
import { useProductStore } from '../store/productStore';

const initialElements = [
    {
        id: `text_${Date.now()}`,
        type: 'text',
        fontFamily: 'Arial',
        fontSize: 32,
        color: '#333333',
        bold: false,
        italic: false,
        underline: false,
        textAlign: 'center',
        direction: 'rtl',
        content: 'טקסט ניתן לעריכה',
        top: 230,
        left: 75,
        backgroundColor: 'transparent',
        borderColor: '#000000',
        borderWidth: 0,
        textShadowEnabled: false,
        textShadowColor: '#000000',
        textShadowBlur: 2,
        textShadowOffsetX: 2,
        textShadowOffsetY: 2,
        opacity: 1,
        rotation: 0,
        locked: false,
    },
];

const EditorPage = ({ onNavigateToHome }) => {
    const { selectedProduct, setSelectedProduct } = useProductStore();

    // If onSelectProduct was passed as a prop (legacy), we ignore it or sync it if needed.
    // But now we use the store directly.
    const onSelectProduct = setSelectedProduct;
    // State for Elements & History
    const [history, setHistory] = useState([initialElements]);
    const [historyIndex, setHistoryIndex] = useState(0);
    const [elements, setElements] = useState(initialElements);

    const [selectedElementId, setSelectedElementId] = useState(initialElements[0]?.id || null);
    const [uploadedImages, setUploadedImages] = useState([]);
    const [croppingElementId, setCroppingElementId] = useState(null);
    const [canvasBackground, setCanvasBackground] = useState({ type: 'color', value: '#FFFFFF' });
    const [uploadedBackgrounds, setUploadedBackgrounds] = useState([]);
    const [projectName, setProjectName] = useState('הפרויקט שלי');
    const [currentProjectId, setCurrentProjectId] = useState(undefined);

    // Grid State
    const [showGrid, setShowGrid] = useState(false);
    const [gridSize, setGridSize] = useState(5);

    // Zoom State
    const [zoom, setZoom] = useState(100);

    // Preview State
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);
    const [showPreviewModal, setShowPreviewModal] = useState(false);

    // Persistence Modal State
    const [showLoadModal, setShowLoadModal] = useState(false);
    const [savedProjects, setSavedProjects] = useState([]);
    const [isSaving, setIsSaving] = useState(false);

    // --- History Logic ---
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
        setElements(newElements);
        addToHistory(newElements);
    }, [addToHistory]);

    const handleSaveToDatabase = useCallback(async () => {
        setIsSaving(true);
        try {
            const node = document.getElementById('canvas-container');
            let previewDataUrl = undefined;
            if (node) {
                setSelectedElementId(null);
                await new Promise(resolve => setTimeout(resolve, 100));
                previewDataUrl = await toPng(node, {
                    quality: 0.5,
                    pixelRatio: 0.5,
                    filter: (node) => !node.classList?.contains('canvas-grid-overlay'),
                    backgroundColor: canvasBackground.type === 'color' ? canvasBackground.value : undefined,
                });
            }

            const projectData = {
                _id: currentProjectId,
                name: projectName,
                elements,
                canvasBackground,
                uploadedImages,
                uploadedBackgrounds,
                selectedProduct,
                preview: previewDataUrl
            };

            const saved = await db.save(projectData);
            setCurrentProjectId(saved._id);
            alert('הפרויקט נשמר בהצלחה בספריה!');
        } catch (e) {
            console.error("Failed to save", e);
            alert("שגיאה בשמירת הפרויקט");
        } finally {
            setIsSaving(false);
        }
    }, [currentProjectId, projectName, elements, canvasBackground, uploadedImages, uploadedBackgrounds, selectedProduct]);

    const handleOpenLoadModal = useCallback(async () => {
        setShowLoadModal(true);
        const projects = await db.findAll();
        setSavedProjects(projects);
    }, []);

    const handleLoadProjectFromDB = useCallback((project) => {
        try {
            const loadedElements = (project.elements && project.elements.length > 0) ? project.elements : initialElements;

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
            setShowLoadModal(false);
        } catch (error) {
            console.error("Error loading project:", error);
            alert("אירעה שגיאה בטעינת הפרויקט");
        }
    }, [onSelectProduct]);

    const handleDeleteProject = useCallback(async (e, id) => {
        e.stopPropagation();
        if (confirm("האם אתה בטוח שברצונך למחוק פרויקט זה?")) {
            await db.delete(id);
            const updated = await db.findAll();
            setSavedProjects(updated);
            if (currentProjectId === id) setCurrentProjectId(undefined);
        }
    }, [currentProjectId]);

    const addTextElement = useCallback(() => {
        const config = { content: 'הוסף טקסט כאן', fontSize: 18, bold: false };

        const newElement = {
            id: `text_${Date.now()}`,
            type: 'text',
            content: config.content,
            fontFamily: 'Arial',
            fontSize: config.fontSize,
            color: '#333333',
            bold: config.bold,
            italic: false,
            underline: false,
            textAlign: 'right',
            direction: 'rtl',
            top: 100,
            left: 100,
            backgroundColor: 'transparent',
            borderColor: '#000000',
            borderWidth: 0,
            textShadowEnabled: false,
            textShadowColor: '#000000',
            textShadowBlur: 2,
            textShadowOffsetX: 2,
            textShadowOffsetY: 2,
            opacity: 1,
            rotation: 0,
        };
        const newElements = [...elements, newElement];
        updateElementsWithHistory(newElements);
        setSelectedElementId(newElement.id);
    }, [elements, updateElementsWithHistory]);

    const addImageElement = useCallback((src, width, height, naturalWidth, naturalHeight) => {
        const canvasWidth = 350;
        const canvasHeight = 525;
        const newElement = {
            id: `image_${Date.now()}`,
            type: 'image',
            src,
            width,
            height,
            top: (canvasHeight - height) / 2,
            left: (canvasWidth - width) / 2,
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
        const newElements = [...elements, newElement];
        updateElementsWithHistory(newElements);
        setSelectedElementId(newElement.id);
        setUploadedImages(prev => prev.includes(src) ? prev : [...prev, src]);
    }, [elements, updateElementsWithHistory]);

    const addShapeElement = useCallback((svgContent) => {
        const canvasWidth = 350;
        const canvasHeight = 525;
        const width = 100;
        const height = 100;

        const newElement = {
            id: `shape_${Date.now()}`,
            type: 'shape',
            svgContent,
            fill: '#3B82F6',
            width,
            height,
            top: (canvasHeight - height) / 2,
            left: (canvasWidth - width) / 2,
            opacity: 1,
            rotation: 0,
            scaleX: 1,
            scaleY: 1,
        };
        const newElements = [...elements, newElement];
        updateElementsWithHistory(newElements);
        setSelectedElementId(newElement.id);
    }, [elements, updateElementsWithHistory]);

    const updateElement = useCallback((id, newProps) => {
        setElements(prev =>
            prev.map(el => {
                if (el.id === id) {
                    return { ...el, ...newProps };
                }
                return el;
            }),
        );
    }, []);

    const deleteElement = useCallback(() => {
        if (!selectedElementId) return;
        const newElements = elements.filter(el => el.id !== selectedElementId);
        updateElementsWithHistory(newElements);
        setSelectedElementId(null);
    }, [elements, selectedElementId, updateElementsWithHistory]);

    const duplicateElementWithState = useCallback(() => {
        const elementToDuplicate = elements.find(el => el.id === selectedElementId);
        if (!elementToDuplicate || elementToDuplicate.locked) return;

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
        const index = elements.findIndex(el => el.id === selectedElementId);
        if (index === -1 || index === elements.length - 1) return;

        const newElements = [...elements];
        const [removed] = newElements.splice(index, 1);
        newElements.push(removed);
        updateElementsWithHistory(newElements);
    }, [elements, selectedElementId, updateElementsWithHistory]);

    const handleSendToBack = useCallback(() => {
        if (!selectedElementId) return;
        const index = elements.findIndex(el => el.id === selectedElementId);
        if (index === -1 || index === 0) return;

        const newElements = [...elements];
        const [removed] = newElements.splice(index, 1);
        newElements.unshift(removed);
        updateElementsWithHistory(newElements);
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
        const node = document.getElementById('canvas-container');
        if (!node) return;

        setSelectedElementId(null);
        setIsPreviewLoading(true);
        setPreviewImage(null);

        try {
            await new Promise(resolve => setTimeout(resolve, 250));

            const dataUrl = await toPng(node, {
                quality: 0.95,
                pixelRatio: 2,
                filter: (node) => !node.classList?.contains('canvas-grid-overlay'),
                backgroundColor: canvasBackground.type === 'color' ? canvasBackground.value : undefined,
                style: { transform: 'scale(1)', outline: 'none' }
            });

            if (!selectedProduct) {
                setPreviewImage(dataUrl);
            } else {
                try {
                    const result = await generatePersonalizedProduct(selectedProduct, dataUrl);
                    setPreviewImage(result);
                } catch (aiError) {
                    console.error("AI generation failed, showing canvas fallback", aiError);
                    setPreviewImage(dataUrl);
                }
            }
            setShowPreviewModal(true);
        } catch (error) {
            console.error("Preview generation failed", error);
            alert("אירעה שגיאה ביצירת התצוגה המקדימה. אנא נסה שוב.");
        } finally {
            setIsPreviewLoading(false);
        }
    }, [selectedProduct, canvasBackground]);

    return (
        <div className="h-screen flex flex-col" style={{ direction: 'rtl' }}>
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
            />

            <ContextualToolbar
                selectedElement={selectedElement}
                onUpdateElement={(props) => selectedElement && updateElement(selectedElement.id, props)}
                onCrop={() => selectedElement && setCroppingElementId(selectedElement.id)}
                onDuplicate={duplicateElementWithState}
                onDelete={deleteElement}
                onBringToFront={handleBringToFront}
                onSendToBack={handleSendToBack}
            />

            <div className="flex-1 flex flex-row overflow-hidden">
                <EditorSidebar
                    addTextElement={addTextElement}
                    addImageElement={addImageElement}
                    addShapeElement={addShapeElement}
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
                />
            </div>
            <EditorFooter
                showGrid={showGrid}
                setShowGrid={setShowGrid}
                gridSize={gridSize}
                setGridSize={setGridSize}
                zoom={zoom}
                setZoom={setZoom}
            />

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
                                                e.stopPropagation();
                                                handleLoadProjectFromDB(proj);
                                            }}
                                            className="bg-white rounded-xl shadow-sm hover:shadow-md border border-gray-200 overflow-hidden cursor-pointer transition-all hover:border-red-300 group"
                                        >
                                            <div className="h-40 bg-gray-100 flex items-center justify-center overflow-hidden relative">
                                                {proj.preview ? (
                                                    <img src={proj.preview} alt={proj.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-gray-400">אין תצוגה מקדימה</span>
                                                )}
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                            </div>
                                            <div className="p-4">
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
                                                <div className="flex items-center text-xs text-gray-500 mt-2">
                                                    <ClockIcon className="w-3 h-3 ml-1" />
                                                    {new Date(proj.updatedAt).toLocaleDateString('he-IL')}
                                                </div>
                                                {proj.selectedProduct && (
                                                    <span className="inline-block mt-2 px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded-full">
                                                        {proj.selectedProduct}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Preview Modal */}
            {showPreviewModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <SparklesIcon className="w-6 h-6 text-red-400" />
                                תצוגה מקדימה: {selectedProduct || 'העיצוב שלך'}
                            </h3>
                            <button onClick={() => setShowPreviewModal(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                                <XIcon className="w-6 h-6 text-gray-500" />
                            </button>
                        </div>
                        <div className="flex-1 p-6 overflow-auto bg-gray-100 flex items-center justify-center">
                            {previewImage ? (
                                <img src={previewImage} alt="Generated Preview" className="max-w-full max-h-full object-contain rounded-lg shadow-md" />
                            ) : (
                                <div className="text-center text-gray-500">
                                    <p>טוען תצוגה מקדימה...</p>
                                </div>
                            )}
                        </div>
                        <div className="p-4 border-t bg-white flex justify-end gap-3">
                            <button
                                onClick={() => setShowPreviewModal(false)}
                                className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium"
                            >
                                חזור לעריכה
                            </button>
                            <button className="px-6 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 font-bold shadow-lg">
                                אישור והזמנה
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Loading Overlay */}
            {(isPreviewLoading || isSaving) && !showPreviewModal && (
                <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white bg-opacity-80 backdrop-blur-sm">
                    <svg className="animate-spin h-16 w-16 text-red-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">{isSaving ? 'שומר פרויקט...' : 'יוצר תצוגה מקדימה...'}</h2>
                    <p className="text-gray-600">{isSaving ? 'נא להמתין בזמן שהפרויקט נשמר בספריה' : 'ה-AI שלנו מלביש את העיצוב שלך על המוצר'}</p>
                </div>
            )}
        </div>
    );
};

export default EditorPage;