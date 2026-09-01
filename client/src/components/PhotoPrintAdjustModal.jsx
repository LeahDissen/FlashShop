import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Cropper from 'react-easy-crop';
import 'react-easy-crop/react-easy-crop.css';
import { getDesignFrames } from '../api/designFrames';
import { DEFAULT_EDITOR_SETTINGS } from '../constants/editorSettingsDefaults';
import { useEditorSettings } from '../hooks/useEditorSettings';
import { getFrameOrientation } from '../utils/orientationMatching';
import { prepareFrameImageSrc } from '../utils/frameImageProcessing';
import { getPrintCropBlob } from '../utils/cropImage';
import {
    DEFAULT_CROP,
    getCompactPrintSizeLabel,
    getCropWarning,
    getDefaultOrientation,
    getImageDimensions,
    resolvePrintDimensions,
} from '../utils/printSizes';
import FrameSizeFolders from './editor/FrameSizeFolders.jsx';

const DEFAULT_EASY_CROP = {
    crop: { x: 0, y: 0 },
    zoom: 1,
    croppedAreaPixels: null,
};

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 3;
const DEFAULT_BACKGROUND = '#FFFFFF';

const BACKGROUND_PRESETS = [
    '#FFFFFF',
    '#000000',
    '#F3F4F6',
    '#FEF3C7',
    '#DBEAFE',
    '#FCE7F3',
    '#D1FAE5',
];

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
    content: captionDefaults.placeholder || 'כתובית לתמונה',
    fontFamily: captionDefaults.fontFamily || 'Rubik',
    fontSize: Number(captionDefaults.fontSize) || 24,
    color: captionDefaults.color || '#FFFFFF',
    x: 0.5,
    y: 0.92,
});

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
                rows={2}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-right resize-none focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400"
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
}) => {
    const { settings: editorSettings } = useEditorSettings();
    const [orientation, setOrientation] = useState(image?.orientation ?? 'landscape');
    const [crop, setCrop] = useState(image?.cropState?.crop ?? DEFAULT_EASY_CROP.crop);
    const [zoom, setZoom] = useState(image?.cropState?.zoom ?? 1);
    const [backgroundColor, setBackgroundColor] = useState(
        image?.cropState?.backgroundColor ?? DEFAULT_BACKGROUND,
    );
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(
        image?.cropState?.croppedAreaPixels ?? null,
    );
    const [mediaSize, setMediaSize] = useState(null);
    const [cropSize, setCropSize] = useState(null);
    const [dims, setDims] = useState({ w: 0, h: 0 });
    const [saveError, setSaveError] = useState('');
    const colorInputRef = useRef(null);

    const [showFramePanel, setShowFramePanel] = useState(false);
    const [frames, setFrames] = useState([]);
    const [framesLoading, setFramesLoading] = useState(false);
    const [frameSelection, setFrameSelection] = useState(image?.frameSelection ?? null);
    const [frameOverlaySrc, setFrameOverlaySrc] = useState(image?.frameOverlaySrc || image?.frameSelection?.frameImageUrl || '');
    const [captions, setCaptions] = useState(Array.isArray(image?.captions) ? image.captions : []);
    const [selectedCaptionId, setSelectedCaptionId] = useState(image?.captions?.[0]?.id ?? null);

    const imageSrc = image?.originalSrc || image?.src;
    const print = resolvePrintDimensions(image?.size, orientation);
    const sizeLabel = getCompactPrintSizeLabel(image?.size, orientation);
    const aspect = print.aspect;
    const selectedCaption = captions.find((caption) => caption.id === selectedCaptionId) || null;

    const initialState = useMemo(
        () => ({
            orientation: image?.orientation ?? 'landscape',
            crop: image?.cropState?.crop ?? DEFAULT_EASY_CROP.crop,
            zoom: image?.cropState?.zoom ?? 1,
            backgroundColor: image?.cropState?.backgroundColor ?? DEFAULT_BACKGROUND,
            frameSelection: image?.frameSelection ?? null,
            frameOverlaySrc: image?.frameOverlaySrc || image?.frameSelection?.frameImageUrl || '',
            captions: Array.isArray(image?.captions) ? image.captions : [],
        }),
        [image?.id, image?.size],
    );

    useEffect(() => {
        setOrientation(initialState.orientation);
        setCrop(initialState.crop);
        setZoom(initialState.zoom);
        setBackgroundColor(initialState.backgroundColor);
        setCroppedAreaPixels(image?.cropState?.croppedAreaPixels ?? null);
        setMediaSize(null);
        setCropSize(null);
        setSaveError('');
        setFrameSelection(initialState.frameSelection);
        setFrameOverlaySrc(initialState.frameOverlaySrc);
        setCaptions(initialState.captions);
        setSelectedCaptionId(initialState.captions[0]?.id ?? null);
        setShowFramePanel(false);
    }, [image?.id, image?.size, image?.cropState, initialState]);

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

    const onCropComplete = useCallback((_croppedArea, pixels) => {
        setCroppedAreaPixels(pixels);
    }, []);

    const handleOrientationChange = (next) => {
        setOrientation(next);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
    };

    const handleApplyFrame = async (frame, printSize, requestedOrientation) => {
        const processed = await prepareFrameImageSrc(frame.imageUrl);
        setFrameOverlaySrc(processed);
        setFrameSelection(buildFrameSelection(frame, printSize, requestedOrientation));
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
    };

    const handleUpdateCaption = (patch) => {
        if (!selectedCaptionId) return;
        setCaptions((prev) => prev.map((caption) => (
            caption.id === selectedCaptionId ? { ...caption, ...patch } : caption
        )));
    };

    const handleRemoveCaption = () => {
        setCaptions((prev) => prev.filter((caption) => caption.id !== selectedCaptionId));
        setSelectedCaptionId(null);
    };

    const handleReset = () => {
        setOrientation(initialState.orientation);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setBackgroundColor(DEFAULT_BACKGROUND);
        setCroppedAreaPixels(null);
        setSaveError('');
        setFrameSelection(null);
        setFrameOverlaySrc('');
        setCaptions([]);
        setSelectedCaptionId(null);
    };

    const handleSave = async () => {
        if (!croppedAreaPixels || !mediaSize || !cropSize) {
            setSaveError('יש להמתין לטעינת התמונה לפני שמירה');
            return;
        }

        setSaveError('');
        try {
            const croppedBlob = await getPrintCropBlob({
                imageSrc,
                crop,
                zoom,
                mediaSize,
                cropSize,
                aspect,
                backgroundColor,
                file: image?.file ?? null,
                frameSrc: frameOverlaySrc || null,
                captions,
            });

            const cropState = { crop, zoom, croppedAreaPixels, backgroundColor };

            await onSave(image.id, {
                crop: { ...DEFAULT_CROP },
                cropState,
                orientation,
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
                                style={{ height: 'min(52vh, 480px)', backgroundColor }}
                            >
                                {imageSrc ? (
                                    <>
                                        <Cropper
                                            image={imageSrc}
                                            crop={crop}
                                            zoom={zoom}
                                            aspect={aspect}
                                            minZoom={MIN_ZOOM}
                                            maxZoom={MAX_ZOOM}
                                            onCropChange={setCrop}
                                            onZoomChange={setZoom}
                                            onCropComplete={onCropComplete}
                                            onMediaLoaded={setMediaSize}
                                            onCropSizeChange={setCropSize}
                                            zoomWithScroll
                                            restrictPosition={false}
                                            objectFit="contain"
                                            style={{
                                                containerStyle: { backgroundColor },
                                            }}
                                            classes={{
                                                containerClassName: 'rounded-xl',
                                                cropAreaClassName: 'border-2 border-white/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]',
                                            }}
                                        />
                                        {cropSize && (frameOverlaySrc || captions.length > 0) && (
                                            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                                                <div
                                                    className="relative overflow-hidden"
                                                    style={{ width: cropSize.width, height: cropSize.height }}
                                                >
                                                    {frameOverlaySrc && (
                                                        <img
                                                            src={frameOverlaySrc}
                                                            alt=""
                                                            className="absolute inset-0 w-full h-full object-fill"
                                                        />
                                                    )}
                                                    {captions.map((caption) => (
                                                        <button
                                                            key={caption.id}
                                                            type="button"
                                                            className={`absolute max-w-[90%] px-1 pointer-events-auto ${
                                                                selectedCaptionId === caption.id
                                                                    ? 'ring-1 ring-white/80'
                                                                    : ''
                                                            }`}
                                                            style={{
                                                                left: `${(caption.x ?? 0.5) * 100}%`,
                                                                top: `${(caption.y ?? 0.92) * 100}%`,
                                                                transform: 'translate(-50%, -100%)',
                                                                color: caption.color,
                                                                fontFamily: caption.fontFamily,
                                                                fontSize: `${caption.fontSize}px`,
                                                                textShadow: '0 1px 4px rgba(0,0,0,0.65)',
                                                                whiteSpace: 'pre-wrap',
                                                                textAlign: 'center',
                                                            }}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedCaptionId(caption.id);
                                                            }}
                                                        >
                                                            {caption.content}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                                        טוען תמונה...
                                    </div>
                                )}
                            </div>

                            <p className="px-5 pt-3 text-xs text-gray-500">
                                גררו את התמונה, השתמשו בגלגלת העכבר או בסליידר לזום — ניתן גם להקטין ולהשאיר רקע. התצוגה משקפת את ההדפסה הסופית.
                            </p>

                            <div className="px-5 py-3 space-y-4">
                                <label className="block text-sm font-medium text-gray-700">
                                    זום: {Math.round(zoom * 100)}%
                                    <input
                                        type="range"
                                        min={MIN_ZOOM}
                                        max={MAX_ZOOM}
                                        step={0.05}
                                        value={zoom}
                                        onChange={(e) => setZoom(Number(e.target.value))}
                                        disabled={isSaving}
                                        className="w-full mt-1 accent-[#f2665e]"
                                    />
                                </label>

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
                                    <PhotoCaptionToolbar
                                        caption={selectedCaption}
                                        textOptions={editorSettings.textToolbar}
                                        onChange={handleUpdateCaption}
                                        onRemove={handleRemoveCaption}
                                        disabled={isSaving}
                                    />
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
