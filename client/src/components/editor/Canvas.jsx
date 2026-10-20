import { useCallback, useMemo, useRef } from 'react';
import { FlipHorizontalIcon } from '../icons';
import { partitionElementsByLayer } from '../../utils/editorLayering';
import { isMultiDropzoneFrame, resolveDropzones } from '../../utils/dropzoneUtils';
import { shapeMaskStyle } from '../../utils/productShapes';
import CanvasElement from './canvas/CanvasElement';
import { GridOverlay, SafeZoneFrame, ShapeOutline, ZoneWarningToast } from './canvas/CanvasOverlays';
import { CollagePhotos, CollageWindows } from './canvas/CollageLayers';
import FrameLayer from './canvas/FrameLayer';
import SelectionOverlay from './canvas/SelectionOverlay';
import { useCanvasInteractions } from './canvas/useCanvasInteractions';
import { useCanvasKeyboard } from './canvas/useCanvasKeyboard';
import { useImageCrop } from './canvas/useImageCrop';
import { useSafeZoneWarning } from './canvas/useSafeZoneWarning';
import { useTextEditing } from './canvas/useTextEditing';

/** Text boxes are layered above the photos and shapes */
const TEXT_LAYER_Z_BASE = 1000;

/** The canvas background: a color, or an image with its size/position/repeat */
const backgroundStyleOf = (background) => (background.type === 'color'
    ? { backgroundColor: background.value }
    : {
        backgroundImage: `url(${background.value})`,
        backgroundSize: background.size || 'cover',
        backgroundPosition: background.position || 'center',
        backgroundRepeat: background.repeat || 'no-repeat',
    });

/**
 * The design canvas: the elements in their layers (photos and shapes, collage photos, the frame,
 * texts), the selected element's controls, cropping, text editing, keyboard shortcuts and the print
 * safe zone. The interaction logic lives in the hooks under ./canvas.
 */
const Canvas = ({
    shape,
    elements,
    selectedElementId,
    setSelectedElementId,
    updateElement,
    croppingElementId,
    onSaveCrop,
    onCancelCrop,
    onDelete,
    onDuplicate,
    onToggleLock,
    canvasBackground,
    showGrid,
    gridSize,
    zoom,
    canvasWidth = 350,
    canvasHeight = 525,
    printWidthCm,
    printHeightCm,
    showOrientationToggle = false,
    onToggleOrientation,
    onAddImageToDropzone,
}) => {
    const scale = zoom / 100;
    const elementsRef = useRef(elements);
    elementsRef.current = elements;

    const safeZone = useSafeZoneWarning({ elements, canvasWidth, canvasHeight, printWidthCm, printHeightCm });
    const { warnIfOutsideSafeZone } = safeZone;
    const warnAfterChange = useCallback(() => warnIfOutsideSafeZone(), [warnIfOutsideSafeZone]);
    const editing = useTextEditing({ elements, setSelectedElementId, updateElement, onEditEnd: warnAfterChange });
    const crop = useImageCrop({ elements, croppingElementId, onSaveCrop, onCancelCrop });
    useCanvasKeyboard({
        elements,
        selectedElementId,
        setSelectedElementId,
        editingElementId: editing.editingElementId,
        croppingElementId,
        updateElement,
        onDelete,
        onDuplicate,
        onCancelCrop,
        warnIfOutsideSafeZone,
    });
    const interactions = useCanvasInteractions({
        scale,
        updateElement,
        selectedElementId,
        setSelectedElementId,
        croppingElementId,
        editingElementId: editing.editingElementId,
        onInteractionEnd: warnAfterChange,
    });

    const selectedElement = elements.find((el) => el.id === selectedElementId);
    const layers = useMemo(() => partitionElementsByLayer(elements), [elements]);
    const activeFrame = layers.frames[0] || null;
    const collageZones = useMemo(() => {
        if (!activeFrame || !isMultiDropzoneFrame(activeFrame)) return [];
        return resolveDropzones(
            activeFrame.dropzones,
            activeFrame.width || canvasWidth,
            activeFrame.height || canvasHeight,
            activeFrame.left ?? 0,
            activeFrame.top ?? 0,
        );
    }, [activeFrame, canvasWidth, canvasHeight]);

    const isEditingSelectedText = selectedElement?.type === 'text' && editing.editingElementId === selectedElement.id;
    const layeredElements = [
        ...layers.bottom.map((el, index) => ({ el, zIndex: index })),
        ...layers.texts.map((el, index) => ({ el, zIndex: TEXT_LAYER_Z_BASE + index })),
    ];

    /** A click on an empty area deselects – not while cropping/typing, nor right after pressing an element */
    const deselectOnEmptyClick = (isEmptyArea) => (event) => {
        if (croppingElementId || editing.editingElementId || interactions.isDeselectGuarded()) return;
        if (isEmptyArea(event)) setSelectedElementId(null);
    };
    const isOwnTarget = (event) => event.target === event.currentTarget;

    return (
        <section className="flex-1 min-h-0 min-w-0 w-full bg-gray-200 relative overflow-hidden">
            {safeZone.zoneWarning && <ZoneWarningToast warning={safeZone.zoneWarning} onDismiss={safeZone.dismissZoneWarning} />}
            <div
                className="absolute inset-0 overflow-auto"
                // Clicks from inside the design canvas are handled there
                onClick={deselectOnEmptyClick((event) => !event.target.closest?.('#canvas-container'))}
            >
                <div
                    className="flex min-h-full w-full items-center justify-center p-3 sm:p-6 md:p-8 box-border canvas-deselect-area"
                    onClick={deselectOnEmptyClick(isOwnTarget)}
                >
                    <div className="flex flex-col items-center gap-4 shrink-0">
                        {showOrientationToggle && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleOrientation?.();
                                }}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#f2665e] text-white font-semibold text-sm shadow-lg shadow-[#f2665e]/25 hover:bg-[#d95248] active:bg-[#c44840] transition-colors duration-200 pointer-events-auto"
                                aria-label="הפוך כיוון משטח"
                                title="הפוך כיוון משטח"
                            >
                                <FlipHorizontalIcon className="w-5 h-5 shrink-0" />
                                <span>הפוך כיוון משטח</span>
                            </button>
                        )}
                        <div
                            id="canvas-container"
                            className="shrink-0 shadow-lg relative transition-transform duration-200 ease-in-out origin-center"
                            style={{
                                width: `${canvasWidth}px`,
                                height: `${canvasHeight}px`,
                                outline: '1px solid #fecaca',
                                outlineOffset: '4px',
                                transform: `scale(${scale})`,
                                isolation: 'isolate',
                                ...backgroundStyleOf(canvasBackground),
                                // A shaped product (heart, circle...): only the inside of the shape is shown and printed
                                ...shapeMaskStyle(shape),
                            }}
                            onClick={deselectOnEmptyClick(isOwnTarget)}
                        >
                            {showGrid && <GridOverlay cellSize={canvasWidth / gridSize} />}
                            <ShapeOutline shape={shape} />
                            <SafeZoneFrame insets={safeZone.safeZoneInsets} />

                            {layeredElements.map(({ el, zIndex }) => (
                                <CanvasElement
                                    key={el.id}
                                    element={el}
                                    zIndex={zIndex}
                                    isSelected={selectedElementId === el.id}
                                    croppingElementId={croppingElementId}
                                    editing={editing}
                                    interactions={interactions}
                                    crop={crop}
                                    onSelect={setSelectedElementId}
                                    onCancelCrop={onCancelCrop}
                                />
                            ))}

                            {collageZones.length > 0 && <CollagePhotos zones={collageZones} elements={elements} editing={editing} />}

                            {layers.frames.length > 0 && (
                                <FrameLayer
                                    frames={layers.frames}
                                    selectedElementId={selectedElementId}
                                    onSelect={setSelectedElementId}
                                    startDrag={interactions.startDrag}
                                    editing={editing}
                                />
                            )}

                            {collageZones.length > 0 && (
                                <CollageWindows
                                    zones={collageZones}
                                    elements={elements}
                                    latestElementsRef={elementsRef}
                                    selectedElementId={selectedElementId}
                                    onSelect={setSelectedElementId}
                                    startDrag={interactions.startDrag}
                                    onAddImageToDropzone={onAddImageToDropzone}
                                />
                            )}

                            {selectedElement && !croppingElementId && !isEditingSelectedText && (
                                <SelectionOverlay
                                    element={selectedElement}
                                    editing={editing}
                                    interactions={interactions}
                                    onToggleLock={onToggleLock}
                                    onDuplicate={onDuplicate}
                                    onDelete={onDelete}
                                />
                            )}

                            {croppingElementId && (
                                <div className="absolute inset-0 bg-black bg-opacity-50 z-40" onClick={onCancelCrop} />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Canvas;
