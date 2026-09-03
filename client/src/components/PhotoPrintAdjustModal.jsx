import { useEffect, useMemo, useRef, useState } from 'react';
import { getDesignFrames } from '../api/designFrames';
import { DEFAULT_EDITOR_SETTINGS } from '../constants/editorSettingsDefaults';
import { useEditorSettings } from '../hooks/useEditorSettings';
import { getFrameOrientation } from '../utils/orientationMatching';
import { prepareFrameImageSrc } from '../utils/frameImageProcessing';
import { detectTextDirection, getPrintCropBlob } from '../utils/cropImage';
import {
    DEFAULT_CROP,
    DEFAULT_PHOTO_PRINT_SIZE,
    getCompactPrintSizeLabel,
    getCropWarning,
    getDefaultOrientation,
    getImageDimensions,
    mergePhotoPricesWithCatalog,
    resolvePrintDimensions,
} from '../utils/printSizes';
import FrameSizeFolders from './editor/FrameSizeFolders.jsx';

const DEFAULT_BACKGROUND = '#FFFFFF';
const MIN_IMAGE_SIZE = 0.12;
const HANDLE_ORDS = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];

const isPlacement = (value) => (
    value
    && Number(value.w) > 0
    && Number(value.h) > 0
);

const containPlacement = (imageAspect, frameAspect) => {
    if (!imageAspect || !frameAspect) return { x: 0, y: 0, w: 1, h: 1 };
    if (imageAspect > frameAspect) {
        const h = frameAspect / imageAspect;
        return { x: 0, y: (1 - h) / 2, w: 1, h };
    }
    const w = imageAspect / frameAspect;
    return { x: (1 - w) / 2, y: 0, w, h: 1 };
};

const scalePlacement = (box, factor, minSize = MIN_IMAGE_SIZE) => {
    const cx = box.x + box.w / 2;
    const cy = box.y + box.h / 2;
    const nextFactor = box.w * factor < minSize ? minSize / box.w : factor;
    const w = box.w * nextFactor;
    const h = box.h * nextFactor;
    return { x: cx - w / 2, y: cy - h / 2, w, h };
};

const HANDLE_STYLE = {
    nw: { left: 0, top: 0, cursor: 'nwse-resize' },
    n: { left: '50%', top: 0, cursor: 'ns-resize' },
    ne: { left: '100%', top: 0, cursor: 'nesw-resize' },
    e: { left: '100%', top: '50%', cursor: 'ew-resize' },
    se: { left: '100%', top: '100%', cursor: 'nwse-resize' },
    s: { left: '50%', top: '100%', cursor: 'ns-resize' },
    sw: { left: 0, top: '100%', cursor: 'nesw-resize' },
    w: { left: 0, top: '50%', cursor: 'ew-resize' },
};

const resizePlacement = (start, ord, dx, dy, imageAspect, frameW, frameH) => {
    const ratio = imageAspect;
    let { x, y, w, h } = start;
    const px = { x: x * frameW, y: y * frameH, w: w * frameW, h: h * frameH };
    const minW = MIN_IMAGE_SIZE * Math.min(frameW, frameH);

    const applySize = (nextW, anchorX, anchorY) => {
        const width = Math.max(minW, nextW);
        const height = width / ratio;
        const next = { w: width, h: height, x: px.x, y: px.y };
        if (anchorX === 'right') next.x = px.x + px.w - width;
        if (anchorX === 'center') next.x = px.x + px.w / 2 - width / 2;
        if (anchorY === 'bottom') next.y = px.y + px.h - height;
        if (anchorY === 'center') next.y = px.y + px.h / 2 - height / 2;
        return next;
    };

    let nextPx = px;
    if (ord === 'se') nextPx = applySize(px.w + dx, 'left', 'top');
    else if (ord === 'nw') nextPx = applySize(px.w - dx, 'right', 'bottom');
    else if (ord === 'ne') nextPx = applySize(px.w + dx, 'left', 'bottom');
    else if (ord === 'sw') nextPx = applySize(px.w - dx, 'right', 'top');
    else if (ord === 'e') nextPx = applySize(px.w + dx, 'left', 'center');
    else if (ord === 'w') nextPx = applySize(px.w - dx, 'right', 'center');
    else if (ord === 's') nextPx = applySize((px.h + dy) * ratio, 'center', 'top');
    else if (ord === 'n') nextPx = applySize((px.h - dy) * ratio, 'center', 'bottom');

    return {
        x: nextPx.x / frameW,
        y: nextPx.y / frameH,
        w: nextPx.w / frameW,
        h: nextPx.h / frameH,
    };
};

const PrintImageEditor = ({
    imageSrc,
    aspect,
    placement,
    onChange,
    backgroundColor,
    disabled,
    children,
    onFrameSize,
}) => {
    const stageRef = useRef(null);
    const dragRef = useRef(null);
    const [frameSize, setFrameSize] = useState({ width: 0, height: 0 });

    useEffect(() => {
        const stage = stageRef.current;
        if (!stage) return undefined;

        const update = () => {
            const maxW = Math.max(80, stage.clientWidth - 16);
            const maxH = Math.max(80, stage.clientHeight - 16);
            let width = maxW;
            let height = width / aspect;
            if (height > maxH) {
                height = maxH;
                width = height * aspect;
            }
            const next = { width, height };
            setFrameSize(next);
            onFrameSize?.(next);
        };

        update();
        const observer = new ResizeObserver(update);
        observer.observe(stage);
        return () => observer.disconnect();
    }, [aspect, onFrameSize]);

    useEffect(() => {
        const stage = stageRef.current;
        if (!stage) return undefined;
        const onWheel = (event) => {
            if (disabled || !placement) return;
            event.preventDefault();
            event.stopPropagation();
            const factor = event.deltaY > 0 ? 0.94 : 1.06;
            onChange(scalePlacement(placement, factor));
        };
        stage.addEventListener('wheel', onWheel, { passive: false });
        return () => stage.removeEventListener('wheel', onWheel);
    }, [disabled, placement, onChange]);

    const stop = (event) => event.stopPropagation();

    const handlePointerDown = (event, ord = null) => {
        if (disabled || !placement) return;
        stop(event);
        event.currentTarget.setPointerCapture?.(event.pointerId);
        dragRef.current = {
            pointerId: event.pointerId,
            ord,
            startX: event.clientX,
            startY: event.clientY,
            box: { ...placement },
        };
    };

    const handlePointerMove = (event) => {
        const drag = dragRef.current;
        if (!drag || event.pointerId !== drag.pointerId || !frameSize.width) return;
        stop(event);
        const dx = event.clientX - drag.startX;
        const dy = event.clientY - drag.startY;
        if (drag.ord) {
            onChange(resizePlacement(
                drag.box,
                drag.ord,
                dx,
                dy,
                (drag.box.w * frameSize.width) / (drag.box.h * frameSize.height),
                frameSize.width,
                frameSize.height,
            ));
            return;
        }
        onChange({
            ...drag.box,
            x: drag.box.x + dx / frameSize.width,
            y: drag.box.y + dy / frameSize.height,
        });
    };

    const handlePointerUp = (event) => {
        if (dragRef.current?.pointerId !== event.pointerId) return;
        dragRef.current = null;
    };

    return (
        <div
            ref={stageRef}
            className="relative w-full h-full flex items-center justify-center"
        >
            <div
                className="relative overflow-visible"
                style={{
                    width: frameSize.width,
                    height: frameSize.height,
                    backgroundColor,
                    boxShadow: '0 0 0 9999px rgba(0,0,0,0.55)',
                }}
            >
                <div className="absolute inset-0 overflow-hidden">
                    {placement && (
                        <img
                            src={imageSrc}
                            alt=""
                            draggable={false}
                            className={`absolute max-w-none select-none ${disabled ? '' : 'cursor-move'}`}
                            style={{
                                left: `${placement.x * 100}%`,
                                top: `${placement.y * 100}%`,
                                width: `${placement.w * 100}%`,
                                height: `${placement.h * 100}%`,
                            }}
                            onPointerDown={(event) => handlePointerDown(event, null)}
                            onPointerMove={handlePointerMove}
                            onPointerUp={handlePointerUp}
                            onPointerCancel={handlePointerUp}
                        />
                    )}
                </div>

                <div className="absolute inset-0 pointer-events-none border-2 border-white/90">
                    <div className="absolute inset-0 opacity-40">
                        <div className="absolute top-1/3 right-0 left-0 border-t border-white" />
                        <div className="absolute top-2/3 right-0 left-0 border-t border-white" />
                        <div className="absolute left-1/3 top-0 bottom-0 border-l border-white" />
                        <div className="absolute left-2/3 top-0 bottom-0 border-l border-white" />
                    </div>
                </div>

                {placement && !disabled && (
                    <div
                        className="absolute pointer-events-none"
                        style={{
                            left: `${placement.x * 100}%`,
                            top: `${placement.y * 100}%`,
                            width: `${placement.w * 100}%`,
                            height: `${placement.h * 100}%`,
                        }}
                    >
                        {HANDLE_ORDS.map((ord) => (
                            <button
                                key={ord}
                                type="button"
                                aria-label={`שנה גודל ${ord}`}
                                className="absolute z-20 w-3 h-3 bg-white border border-gray-700 rounded-[2px] p-0 pointer-events-auto"
                                style={{
                                    ...HANDLE_STYLE[ord],
                                    transform: 'translate(-50%, -50%)',
                                }}
                                onPointerDown={(event) => handlePointerDown(event, ord)}
                                onPointerMove={handlePointerMove}
                                onPointerUp={handlePointerUp}
                                onPointerCancel={handlePointerUp}
                            />
                        ))}
                    </div>
                )}

                {children}
            </div>
        </div>
    );
};

const BACKGROUND_PRESETS = [
    '#FFFFFF',
    '#000000',
    '#F3F4F6',
    '#FEF3C7',
    '#DBEAFE',
    '#FCE7F3',
    '#D1FAE5',
];

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));


const buildFrameSelection = (frame, printSize, requestedOrientation) => ({
    frameId: frame._id,
    frameTitle: frame.title,
    frameImageUrl: frame.imageUrl,
    frameCategory: frame.category,
    aspectRatio: frame.aspectRatio,
    printSizeKey: frame.printSizeKey || printSize?.key || '',
    printSizeLabel: printSize?.label || '',
    frameOrientation: getFrameOrientation(frame) || requestedOrientation || null,
    requestedOrientation: requestedOrientation || null,
    isFixedOverlay: true,
    selectedAt: new Date().toISOString(),
});

const createCaption = (captionDefaults = {}) => ({
    id: `caption_${Date.now()}`,
    content: '',
    fontFamily: captionDefaults.fontFamily || 'Rubik',
    fontSize: Number(captionDefaults.fontSize) || 24,
    color: captionDefaults.color || '#FFFFFF',
    x: 0.5,
    y: 0.92,
});

const DraggableCaption = ({
    caption,
    selected,
    editing,
    cropSize,
    disabled,
    placeholder,
    onSelect,
    onChange,
    onStartEdit,
    onEndEdit,
}) => {
    const editorRef = useRef(null);
    const dragRef = useRef(null);
    const dir = detectTextDirection(caption.content);

    useEffect(() => {
        const node = editorRef.current;
        if (!node || document.activeElement === node) return;
        const next = caption.content || '';
        if (node.innerText !== next) node.innerText = next;
    }, [caption.content, caption.fontFamily, caption.fontSize, caption.color, editing, placeholder]);

    useEffect(() => {
        if (!editing || !editorRef.current) return;
        const node = editorRef.current;
        node.focus();
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(node);
        range.collapse(caption.content ? false : true);
        selection?.removeAllRanges();
        selection?.addRange(range);
        // Focus once when edit mode starts.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editing]);

    const stopCropper = (event) => {
        event.stopPropagation();
    };

    const handlePointerDown = (event) => {
        if (disabled) return;
        stopCropper(event);
        onSelect();
        if (editing && event.target === editorRef.current) return;

        dragRef.current = {
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            origX: Number.isFinite(Number(caption.x)) ? Number(caption.x) : 0.5,
            origY: Number.isFinite(Number(caption.y)) ? Number(caption.y) : 0.92,
            moved: false,
        };
        event.currentTarget.setPointerCapture(event.pointerId);
    };

    const handlePointerMove = (event) => {
        const drag = dragRef.current;
        if (!drag || event.pointerId !== drag.pointerId) return;
        stopCropper(event);
        const dx = event.clientX - drag.startX;
        const dy = event.clientY - drag.startY;
        if (!drag.moved && Math.abs(dx) < 4 && Math.abs(dy) < 4) return;
        drag.moved = true;
        if (editing) onEndEdit();
        if (!cropSize?.width || !cropSize?.height) return;
        onChange({
            x: clamp(drag.origX + dx / cropSize.width, 0.04, 0.96),
            y: clamp(drag.origY + dy / cropSize.height, 0.08, 0.98),
        });
    };

    const handlePointerUp = (event) => {
        const drag = dragRef.current;
        if (!drag || event.pointerId !== drag.pointerId) return;
        stopCropper(event);
        dragRef.current = null;
        if (!drag.moved) onStartEdit();
    };

    return (
        <div
            className={`absolute z-30 max-w-[90%] px-1 pointer-events-auto ${
                selected ? 'ring-1 ring-white/90 rounded-sm' : ''
            } ${editing ? 'cursor-text' : 'cursor-grab active:cursor-grabbing'}`}
            style={{
                left: `${(caption.x ?? 0.5) * 100}%`,
                top: `${(caption.y ?? 0.92) * 100}%`,
                transform: 'translate(-50%, -100%)',
                touchAction: 'none',
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onWheel={stopCropper}
            onTouchStart={stopCropper}
        >
            <div
                ref={editorRef}
                role="textbox"
                aria-multiline="true"
                aria-label="כתובית"
                contentEditable={!disabled && editing}
                suppressContentEditableWarning
                dir={dir}
                className="min-w-[3rem] outline-none whitespace-pre-wrap text-center bg-transparent empty:before:content-[attr(data-placeholder)] empty:before:opacity-50"
                data-placeholder={placeholder || 'כתובית לתמונה'}
                style={{
                    color: caption.color,
                    fontFamily: caption.fontFamily,
                    fontSize: `${caption.fontSize}px`,
                    textShadow: '0 1px 4px rgba(0,0,0,0.65)',
                    caretColor: caption.color,
                    unicodeBidi: 'plaintext',
                }}
                onInput={(event) => onChange({ content: event.currentTarget.innerText })}
                onBlur={onEndEdit}
            />
        </div>
    );
};

const PhotoCaptionToolbar = ({
    caption,
    textOptions = DEFAULT_EDITOR_SETTINGS.textToolbar,
    onChange,
    onRemove,
    disabled,
}) => {
    if (!caption) return null;

    const fonts = textOptions?.fonts?.length
        ? textOptions.fonts
        : DEFAULT_EDITOR_SETTINGS.textToolbar.fonts;
    const colorPresets = textOptions?.colorPresets?.length
        ? textOptions.colorPresets
        : DEFAULT_EDITOR_SETTINGS.textToolbar.colorPresets;
    const minFontSize = Number(textOptions?.minFontSize) || 8;
    const maxFontSize = Number(textOptions?.maxFontSize) || 200;
    const dir = detectTextDirection(caption.content);

    return (
        <div className="rounded-xl border border-gray-200 bg-white p-3 space-y-3">
            <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-100 px-2.5 py-1 rounded-full">
                    כתובית
                </span>
                <button
                    type="button"
                    onClick={onRemove}
                    disabled={disabled}
                    className="text-xs font-bold text-gray-500 hover:text-red-600 disabled:opacity-50"
                >
                    מחק כתובית
                </button>
            </div>
            <textarea
                value={caption.content}
                onChange={(e) => onChange({ content: e.target.value })}
                disabled={disabled}
                dir={dir}
                rows={2}
                placeholder="כתובית לתמונה"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400"
                style={{
                    fontFamily: caption.fontFamily,
                    color: caption.color,
                    backgroundColor: '#111827',
                }}
            />
            <div className="flex flex-wrap items-center gap-2">
                <select
                    value={caption.fontFamily}
                    onChange={(e) => onChange({ fontFamily: e.target.value })}
                    disabled={disabled}
                    className="h-9 pl-2 pr-8 border border-gray-300 rounded-lg text-sm bg-white text-gray-700 min-w-[8rem]"
                >
                    {fonts.map((font) => (
                        <option key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                            {font.label}
                        </option>
                    ))}
                </select>
                <input
                    type="number"
                    min={minFontSize}
                    max={maxFontSize}
                    value={caption.fontSize}
                    onChange={(e) => onChange({
                        fontSize: Math.max(minFontSize, Math.min(maxFontSize, Number(e.target.value) || minFontSize)),
                    })}
                    disabled={disabled}
                    className="w-16 h-9 border border-gray-300 rounded-lg text-sm text-center"
                    aria-label="גודל גופן"
                />
                <div className="flex flex-wrap items-center gap-1.5">
                    {colorPresets.slice(0, 12).map((color) => (
                        <button
                            key={color}
                            type="button"
                            onClick={() => onChange({ color })}
                            disabled={disabled}
                            className={`w-6 h-6 rounded-full border border-gray-200 ${
                                caption.color === color ? 'ring-2 ring-[#f2665e] ring-offset-1' : ''
                            }`}
                            style={{ backgroundColor: color }}
                            aria-label={`צבע ${color}`}
                        />
                    ))}
                    <input
                        type="color"
                        value={caption.color || '#FFFFFF'}
                        onChange={(e) => onChange({ color: e.target.value })}
                        disabled={disabled}
                        className="w-8 h-8 rounded cursor-pointer border border-gray-200 p-0"
                        aria-label="צבע מותאם"
                    />
                </div>
            </div>
        </div>
    );
};

const PhotoPrintAdjustModal = ({
    image,
    onSave,
    onClose,
    isSaving = false,
    availableSizes = [],
}) => {
    const { settings: editorSettings } = useEditorSettings();
    const [orientation, setOrientation] = useState(image?.orientation ?? 'landscape');
    const [printSize, setPrintSize] = useState(image?.size ?? DEFAULT_PHOTO_PRINT_SIZE);
    const [placement, setPlacement] = useState(
        isPlacement(image?.cropState?.placement) ? image.cropState.placement : null,
    );
    const [backgroundColor, setBackgroundColor] = useState(
        image?.cropState?.backgroundColor ?? DEFAULT_BACKGROUND,
    );
    const [dims, setDims] = useState({ w: 0, h: 0 });
    const [saveError, setSaveError] = useState('');
    const [frameSize, setFrameSize] = useState(null);
    const colorInputRef = useRef(null);
    const captionToolbarRef = useRef(null);

    const [showFramePanel, setShowFramePanel] = useState(false);
    const [frames, setFrames] = useState([]);
    const [framesLoading, setFramesLoading] = useState(false);
    const [frameSelection, setFrameSelection] = useState(image?.frameSelection ?? null);
    const [frameOverlaySrc, setFrameOverlaySrc] = useState(image?.frameOverlaySrc || image?.frameSelection?.frameImageUrl || '');
    const [captions, setCaptions] = useState(Array.isArray(image?.captions) ? image.captions : []);
    const [selectedCaptionId, setSelectedCaptionId] = useState(image?.captions?.[0]?.id ?? null);
    const [editingCaptionId, setEditingCaptionId] = useState(null);

    const imageSrc = image?.originalSrc || image?.src;
    const print = resolvePrintDimensions(printSize, orientation);
    const aspect = print.aspect;
    const sizeLabel = getCompactPrintSizeLabel(printSize, orientation);
    const selectedCaption = captions.find((caption) => caption.id === selectedCaptionId) || null;
    const cropSize = frameSize;
    const imageAspect = dims.w && dims.h ? dims.w / dims.h : null;

    const sizeOptions = useMemo(() => {
        if (Array.isArray(availableSizes) && availableSizes.length > 0) {
            return availableSizes.map((entry) => ({
                value: entry.size,
                label: entry.label,
            }));
        }
        return mergePhotoPricesWithCatalog([]).map((entry) => ({
            value: entry.size,
            label: entry.label,
        }));
    }, [availableSizes]);

    const initialState = useMemo(
        () => ({
            orientation: image?.orientation ?? 'landscape',
            printSize: image?.size ?? DEFAULT_PHOTO_PRINT_SIZE,
            placement: isPlacement(image?.cropState?.placement) ? image.cropState.placement : null,
            backgroundColor: image?.cropState?.backgroundColor ?? DEFAULT_BACKGROUND,
            frameSelection: image?.frameSelection ?? null,
            frameOverlaySrc: image?.frameOverlaySrc || image?.frameSelection?.frameImageUrl || '',
            captions: Array.isArray(image?.captions) ? image.captions : [],
        }),
        [image?.id],
    );

    useEffect(() => {
        setOrientation(initialState.orientation);
        setPrintSize(initialState.printSize);
        setPlacement(initialState.placement);
        setBackgroundColor(initialState.backgroundColor);
        setSaveError('');
        setFrameSelection(initialState.frameSelection);
        setFrameOverlaySrc(initialState.frameOverlaySrc);
        setCaptions(initialState.captions);
        setSelectedCaptionId(initialState.captions[0]?.id ?? null);
        setEditingCaptionId(null);
        setShowFramePanel(false);
    }, [image?.id, image?.cropState, initialState]);

    useEffect(() => {
        if (!imageSrc) return;
        getImageDimensions(imageSrc).then(({ w, h }) => {
            setDims({ w, h });
            if (!image?.orientation && w && h) {
                setOrientation(getDefaultOrientation(w, h));
            }
        });
    }, [imageSrc, image?.orientation]);

    useEffect(() => {
        if (!showFramePanel) return undefined;
        let cancelled = false;
        setFramesLoading(true);
        getDesignFrames()
            .then((data) => {
                if (!cancelled) setFrames(Array.isArray(data) ? data : []);
            })
            .catch((err) => {
                console.error('Failed to load design frames', err);
                if (!cancelled) setFrames([]);
            })
            .finally(() => {
                if (!cancelled) setFramesLoading(false);
            });
        return () => { cancelled = true; };
    }, [showFramePanel]);

    const warning = getCropWarning(dims.w, dims.h, print.aspect);

    useEffect(() => {
        if (!imageAspect) return;
        setPlacement((current) => {
            if (isPlacement(current)) return current;
            return containPlacement(imageAspect, aspect);
        });
    }, [imageAspect, aspect]);

    const prevAspectRef = useRef(aspect);

    useEffect(() => {
        if (prevAspectRef.current === aspect) return;
        const previousAspect = prevAspectRef.current;
        prevAspectRef.current = aspect;
        if (!imageAspect) return;
        setPlacement((current) => {
            const nextCover = containPlacement(imageAspect, aspect);
            if (!isPlacement(current)) return nextCover;
            const prevCover = containPlacement(imageAspect, previousAspect);
            const scale = prevCover.w ? current.w / prevCover.w : 1;
            return scalePlacement(nextCover, scale);
        });
    }, [aspect, imageAspect]);

    const handleOrientationChange = (next) => {
        setOrientation(next);
    };

    const handlePrintSizeChange = (nextSize) => {
        setPrintSize(nextSize);
    };

    const handleApplyFrame = async (frame, framePrintSize, requestedOrientation) => {
        const processed = await prepareFrameImageSrc(frame.imageUrl);
        setFrameOverlaySrc(processed);
        setFrameSelection(buildFrameSelection(frame, framePrintSize, requestedOrientation));
        if (requestedOrientation && requestedOrientation !== orientation) {
            handleOrientationChange(requestedOrientation);
        }
    };

    const handleRemoveFrame = () => {
        setFrameSelection(null);
        setFrameOverlaySrc('');
    };

    const handleAddCaption = () => {
        const caption = createCaption(editorSettings.captionDefaults);
        setCaptions((prev) => [...prev, caption]);
        setSelectedCaptionId(caption.id);
        setEditingCaptionId(caption.id);
        window.setTimeout(() => {
            captionToolbarRef.current?.scrollIntoView({
                behavior: 'smooth',
                block: 'end',
            });
        }, 50);
    };

    const handleUpdateCaption = (id, patch) => {
        setCaptions((prev) => prev.map((caption) => (
            caption.id === id ? { ...caption, ...patch } : caption
        )));
    };

    const handleRemoveCaption = () => {
        setCaptions((prev) => prev.filter((caption) => caption.id !== selectedCaptionId));
        setSelectedCaptionId(null);
        setEditingCaptionId(null);
    };

    const handleReset = () => {
        setOrientation(initialState.orientation);
        setPrintSize(initialState.printSize);
        setPlacement(imageAspect
            ? containPlacement(imageAspect, resolvePrintDimensions(initialState.printSize, initialState.orientation).aspect)
            : null);
        setBackgroundColor(DEFAULT_BACKGROUND);
        setSaveError('');
        setFrameSelection(null);
        setFrameOverlaySrc('');
        setCaptions([]);
        setSelectedCaptionId(null);
        setEditingCaptionId(null);
    };

    const handleSave = async () => {
        if (!isPlacement(placement) || !imageSrc) {
            setSaveError('יש להמתין לטעינת התמונה לפני שמירה');
            return;
        }

        setSaveError('');
        try {
            const croppedBlob = await getPrintCropBlob({
                imageSrc,
                placement,
                aspect,
                backgroundColor,
                file: image?.file ?? null,
                frameSrc: frameOverlaySrc || null,
                captions,
                previewCropWidth: frameSize?.width,
            });

            const cropState = { placement, backgroundColor };

            await onSave(image.id, {
                crop: { ...DEFAULT_CROP },
                cropState,
                orientation,
                size: printSize,
                croppedBlob,
                fileName: image?.alt || image?.file?.name || 'photo.jpg',
                frameSelection,
                frameOverlaySrc,
                captions,
            });
        } catch (err) {
            console.error('Crop save failed:', err);
            setSaveError('שגיאה ביצירת התמונה החתוכה. נסו שוב.');
        }
    };

    if (!image) return null;

    return (
        <div
            className="fixed inset-0 z-[180] flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
            role="presentation"
        >
            <div
                className={`bg-white rounded-2xl shadow-2xl w-full max-h-[96vh] overflow-hidden flex flex-col ${
                    showFramePanel ? 'max-w-6xl' : 'max-w-3xl'
                }`}
                dir="rtl"
                role="dialog"
                aria-modal="true"
                aria-labelledby="print-adjust-title"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3 border-b border-gray-100">
                    <div>
                        <h2 id="print-adjust-title" className="text-lg font-bold text-gray-800">
                            חיתוך והתאמה להדפסה
                        </h2>
                        <p className="text-sm text-gray-500">גודל: {sizeLabel}</p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSaving}
                        className="text-gray-400 hover:text-gray-600 text-2xl leading-none p-1 disabled:opacity-50"
                        aria-label="סגור"
                    >
                        ×
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto min-h-0">
                    <div className={`flex flex-col ${showFramePanel ? 'lg:flex-row' : ''}`}>
                        <div className="flex-1 min-w-0">
                            <div className="px-5 py-3 space-y-3">
                                <label className="block text-sm font-medium text-gray-700">
                                    גודל הדפסה
                                    <select
                                        value={printSize}
                                        onChange={(e) => handlePrintSizeChange(e.target.value)}
                                        disabled={isSaving}
                                        className="mt-1 w-full h-10 border border-gray-300 rounded-lg px-3 text-sm bg-white text-gray-800"
                                    >
                                        {sizeOptions.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <div className="flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() => handleOrientationChange('portrait')}
                                        disabled={isSaving}
                                        className={`flex-1 min-w-[7rem] py-2 px-3 rounded-lg text-sm font-bold border transition-colors ${
                                            orientation === 'portrait'
                                                ? 'bg-[#f2665e] text-white border-[#f2665e]'
                                                : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                                        }`}
                                    >
                                        אורך ↕
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleOrientationChange('landscape')}
                                        disabled={isSaving}
                                        className={`flex-1 min-w-[7rem] py-2 px-3 rounded-lg text-sm font-bold border transition-colors ${
                                            orientation === 'landscape'
                                                ? 'bg-[#f2665e] text-white border-[#f2665e]'
                                                : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                                        }`}
                                    >
                                        רוחב ↔
                                    </button>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowFramePanel((open) => !open)}
                                        disabled={isSaving}
                                        className={`flex-1 min-w-[8rem] py-2 px-3 rounded-lg text-sm font-bold border transition-colors ${
                                            showFramePanel
                                                ? 'bg-[#f2665e] text-white border-[#f2665e]'
                                                : 'bg-white text-gray-700 border-gray-200 hover:border-[#f2665e]/40'
                                        }`}
                                    >
                                        הוספת מסגרת
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleAddCaption}
                                        disabled={isSaving}
                                        className="flex-1 min-w-[8rem] py-2 px-3 rounded-lg text-sm font-bold border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50"
                                    >
                                        {editorSettings.captionDefaults?.buttonLabel || 'הוסף כתובית לתמונה'}
                                    </button>
                                </div>

                                {warning && (
                                    <div className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                                        {warning}
                                    </div>
                                )}
                            </div>

                            <div
                                className="relative mx-5 rounded-xl overflow-hidden"
                                style={{ height: 'min(52vh, 480px)', backgroundColor: '#111827' }}
                            >
                                {imageSrc ? (
                                    <PrintImageEditor
                                        imageSrc={imageSrc}
                                        aspect={aspect}
                                        placement={placement}
                                        onChange={setPlacement}
                                        backgroundColor={backgroundColor}
                                        disabled={isSaving}
                                        onFrameSize={setFrameSize}
                                    >
                                        {(frameOverlaySrc || captions.length > 0) && (
                                            <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
                                                {frameOverlaySrc && (
                                                    <img
                                                        src={frameOverlaySrc}
                                                        alt=""
                                                        className="absolute inset-0 w-full h-full object-fill pointer-events-none"
                                                    />
                                                )}
                                                {cropSize && captions.map((caption) => (
                                                    <DraggableCaption
                                                        key={caption.id}
                                                        caption={caption}
                                                        selected={selectedCaptionId === caption.id}
                                                        editing={editingCaptionId === caption.id}
                                                        cropSize={cropSize}
                                                        disabled={isSaving}
                                                        placeholder={editorSettings.captionDefaults?.placeholder}
                                                        onSelect={() => setSelectedCaptionId(caption.id)}
                                                        onChange={(patch) => handleUpdateCaption(caption.id, patch)}
                                                        onStartEdit={() => {
                                                            setSelectedCaptionId(caption.id);
                                                            setEditingCaptionId(caption.id);
                                                        }}
                                                        onEndEdit={() => {
                                                            setEditingCaptionId((current) => (
                                                                current === caption.id ? null : current
                                                            ));
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </PrintImageEditor>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                                        טוען תמונה...
                                    </div>
                                )}
                            </div>

                            <p className="px-5 pt-3 text-xs text-gray-500">
                                גררו את התמונה להזזה, ואת הידיות בפינות להגדלה או הקטנה. אפשר להקטין את התמונה כדי לחשוף את צבע הרקע בתוך מסגרת ההדפסה. המסגרת הקבועה מראה בדיוק מה ייכנס להדפסה.
                            </p>

                            <div className="px-5 py-3 space-y-4">
                                <div>
                                    <span className="block text-sm font-medium text-gray-700 mb-2">צבע רקע</span>
                                    <div className="flex flex-wrap items-center gap-2">
                                        {BACKGROUND_PRESETS.map((color) => (
                                            <button
                                                key={color}
                                                type="button"
                                                onClick={() => setBackgroundColor(color)}
                                                disabled={isSaving}
                                                className={`w-8 h-8 rounded-md border border-gray-200 transition-all ${
                                                    backgroundColor === color
                                                        ? 'ring-2 ring-[#f2665e] ring-offset-1'
                                                        : 'hover:scale-105'
                                                }`}
                                                style={{ backgroundColor: color }}
                                                aria-label={`רקע ${color}`}
                                                aria-pressed={backgroundColor === color}
                                            />
                                        ))}
                                        <button
                                            type="button"
                                            onClick={() => colorInputRef.current?.click()}
                                            disabled={isSaving}
                                            className={`w-8 h-8 rounded-md border border-gray-200 flex items-center justify-center ${
                                                !BACKGROUND_PRESETS.includes(backgroundColor)
                                                    ? 'ring-2 ring-[#f2665e] ring-offset-1'
                                                    : ''
                                            }`}
                                            aria-label="בחר צבע מותאם"
                                        >
                                            {!BACKGROUND_PRESETS.includes(backgroundColor) ? (
                                                <span
                                                    className="w-full h-full rounded-md"
                                                    style={{ backgroundColor }}
                                                />
                                            ) : (
                                                <span className="w-full h-full rounded-md bg-gradient-to-br from-red-500 via-yellow-300 to-blue-500" />
                                            )}
                                        </button>
                                        <input
                                            ref={colorInputRef}
                                            type="color"
                                            value={backgroundColor}
                                            onChange={(e) => setBackgroundColor(e.target.value)}
                                            disabled={isSaving}
                                            className="sr-only"
                                        />
                                    </div>
                                </div>

                                {selectedCaption && (
                                    <div ref={captionToolbarRef}>
                                        <PhotoCaptionToolbar
                                            caption={selectedCaption}
                                            textOptions={editorSettings.textToolbar}
                                            onChange={(patch) => handleUpdateCaption(selectedCaption.id, patch)}
                                            onRemove={handleRemoveCaption}
                                            disabled={isSaving}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {showFramePanel && (
                            <aside className="w-full lg:w-80 shrink-0 border-t lg:border-t-0 lg:border-r border-gray-100 bg-gray-50/70 p-4">
                                <div className="flex items-center justify-between gap-2 mb-3">
                                    <h3 className="font-bold text-gray-800">
                                        {editorSettings.frameFolders?.title || 'מסגרות עיצוב'}
                                    </h3>
                                    <button
                                        type="button"
                                        onClick={handleRemoveFrame}
                                        disabled={!frameSelection || isSaving}
                                        className="text-xs font-bold text-gray-500 hover:text-red-600 disabled:opacity-40"
                                    >
                                        הסר מסגרת
                                    </button>
                                </div>
                                <FrameSizeFolders
                                    frames={frames}
                                    printSizes={editorSettings.framePrintSizes}
                                    orientationLabels={editorSettings.orientationLabels}
                                    folderTexts={editorSettings.frameFolders}
                                    loading={framesLoading}
                                    activeGlobalFrameId={frameSelection?.frameId}
                                    onApplyFrame={handleApplyFrame}
                                />
                            </aside>
                        )}
                    </div>
                </div>

                {saveError && (
                    <p className="px-5 pb-2 text-sm text-red-600">{saveError}</p>
                )}

                <div className="flex flex-wrap gap-2 px-5 py-4 border-t border-gray-100 justify-end bg-gray-50/80">
                    <button
                        type="button"
                        onClick={handleReset}
                        disabled={isSaving}
                        className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-white disabled:opacity-50"
                    >
                        איפוס
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSaving}
                        className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-white disabled:opacity-50"
                    >
                        ביטול
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={isSaving || !imageSrc}
                        className="px-5 py-2 text-sm font-bold text-white bg-[#f2665e] hover:bg-[#d95248] rounded-lg disabled:opacity-50 flex items-center gap-2"
                    >
                        {isSaving ? (
                            <>
                                <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                שומר...
                            </>
                        ) : (
                            'שמור'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PhotoPrintAdjustModal;
