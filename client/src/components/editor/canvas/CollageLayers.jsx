import { useCallback, useRef } from 'react';
import { PlusIcon } from '../../icons';
import { getDropzoneImageForSlot } from '../../../utils/editorLayering';
import { getClipStyle } from '../../../utils/dropzoneUtils';
import ElementContent from './ElementContent';

const PHOTOS_Z_INDEX = 400;
const WINDOWS_Z_INDEX = 550;
const SELECTED_WINDOW_Z_INDEX = 560;

const zoneBoxStyle = (zone) => ({
    position: 'absolute',
    left: `${zone.left}px`,
    top: `${zone.top}px`,
    width: `${zone.width}px`,
    height: `${zone.height}px`,
    overflow: 'hidden',
    ...getClipStyle(zone),
});

/** The photos of a collage frame, each clipped to its window (drawn below the frame) */
export function CollagePhotos({ zones, elements, editing }) {
    return (
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: PHOTOS_Z_INDEX }} aria-hidden="true">
            {zones.map((zone) => {
                const imageEl = getDropzoneImageForSlot(elements, zone.id);
                if (!imageEl) return null;
                return (
                    <div key={`visual-${zone.id}`} style={zoneBoxStyle(zone)}>
                        <div
                            style={{
                                position: 'absolute',
                                left: `${(imageEl.left ?? 0) - zone.left}px`,
                                top: `${(imageEl.top ?? 0) - zone.top}px`,
                                width: `${imageEl.width}px`,
                                height: `${imageEl.height}px`,
                            }}
                        >
                            <ElementContent element={imageEl} editing={editing} />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

/** Reads a chosen photo file as a data URL with its natural size */
function readPhotoFile(file, onRead) {
    const reader = new FileReader();
    reader.onload = (event) => {
        const result = event.target?.result;
        if (!result) return;
        const img = new Image();
        img.onload = () => onRead(result, img.naturalWidth, img.naturalHeight);
        img.src = result;
    };
    reader.readAsDataURL(file);
}

/**
 * The collage windows above the frame: an empty window offers to upload a photo, a filled one is
 * pressed to select and move its photo (double-click replaces it).
 */
export function CollageWindows({ zones, elements, latestElementsRef, selectedElementId, onSelect, startDrag, onAddImageToDropzone }) {
    const fileInputRef = useRef(null);
    const pendingZoneIdRef = useRef(null);

    const chooseFileForZone = useCallback((zoneId) => {
        if (!onAddImageToDropzone || !zoneId) return;
        pendingZoneIdRef.current = zoneId;
        fileInputRef.current?.click();
    }, [onAddImageToDropzone]);

    const handleFileChange = useCallback((event) => {
        const file = event.target.files?.[0];
        const zoneId = pendingZoneIdRef.current;
        pendingZoneIdRef.current = null;
        if (event.target) event.target.value = '';
        if (!file || !zoneId || !onAddImageToDropzone) return;
        readPhotoFile(file, (src, width, height) => onAddImageToDropzone(zoneId, src, width, height));
    }, [onAddImageToDropzone]);

    return (
        <div className="absolute inset-0" style={{ zIndex: WINDOWS_Z_INDEX }} aria-label="חלונות תמונה לקולאז׳">
            <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/gif,image/webp"
                className="hidden"
                onChange={handleFileChange}
            />
            {zones.map((zone) => {
                const imageEl = getDropzoneImageForSlot(elements, zone.id);
                const isSelected = imageEl && selectedElementId === imageEl.id;
                return (
                    <div key={`hit-${zone.id}`} style={{ ...zoneBoxStyle(zone), zIndex: isSelected ? SELECTED_WINDOW_Z_INDEX : WINDOWS_Z_INDEX }}>
                        {imageEl ? (
                            <div
                                role="button"
                                tabIndex={0}
                                aria-label={zone.label || 'תמונת קולאז׳'}
                                aria-pressed={isSelected}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    cursor: 'move',
                                    background: 'transparent',
                                    boxShadow: isSelected ? 'inset 0 0 0 2px #3B82F6' : 'none',
                                }}
                                onPointerDown={(e) => {
                                    if (e.pointerType === 'mouse' && e.button !== 0) return;
                                    e.stopPropagation();
                                    // The latest version of the photo, so dragging stays smooth
                                    const latest = latestElementsRef.current.find((item) => item.id === imageEl.id) || imageEl;
                                    startDrag(e, latest);
                                }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onSelect(imageEl.id);
                                }}
                                onDoubleClick={(e) => {
                                    e.stopPropagation();
                                    chooseFileForZone(zone.id);
                                }}
                            />
                        ) : (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    chooseFileForZone(zone.id);
                                }}
                                className="w-full h-full flex flex-col items-center justify-center gap-1 bg-white/70 hover:bg-white/90 border-2 border-dashed border-red-300 text-red-500 transition-colors"
                                aria-label={`העלה תמונה ל${zone.label || 'חלון'}`}
                            >
                                <PlusIcon className="w-6 h-6" />
                                <span className="text-[10px] sm:text-xs font-bold px-1 text-center leading-tight">
                                    {zone.label || 'העלה תמונה'}
                                </span>
                            </button>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
