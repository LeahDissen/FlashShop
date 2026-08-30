import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Cropper from 'react-easy-crop';
import 'react-easy-crop/react-easy-crop.css';
import {
    DEFAULT_CROP,
    getCompactPrintSizeLabel,
    getCropWarning,
    getDefaultOrientation,
    getImageDimensions,
    resolvePrintDimensions,
} from '../utils/printSizes';
import { getPrintCropBlob } from '../utils/cropImage';

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

const PhotoPrintAdjustModal = ({
    image,
    onSave,
    onClose,
    isSaving = false,
}) => {
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

    const imageSrc = image?.originalSrc || image?.src;
    const print = resolvePrintDimensions(image?.size, orientation);
    const sizeLabel = getCompactPrintSizeLabel(image?.size, orientation);
    const aspect = print.aspect;

    const initialState = useMemo(
        () => ({
            orientation: image?.orientation ?? 'landscape',
            crop: image?.cropState?.crop ?? DEFAULT_EASY_CROP.crop,
            zoom: image?.cropState?.zoom ?? 1,
            backgroundColor: image?.cropState?.backgroundColor ?? DEFAULT_BACKGROUND,
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

    const warning = getCropWarning(dims.w, dims.h, print.aspect);

    const onCropComplete = useCallback((_croppedArea, pixels) => {
        setCroppedAreaPixels(pixels);
    }, []);

    const handleOrientationChange = (next) => {
        setOrientation(next);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
    };

    const handleReset = () => {
        setOrientation(initialState.orientation);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setBackgroundColor(DEFAULT_BACKGROUND);
        setCroppedAreaPixels(null);
        setSaveError('');
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
            });

            const cropState = { crop, zoom, croppedAreaPixels, backgroundColor };

            await onSave(image.id, {
                crop: { ...DEFAULT_CROP },
                cropState,
                orientation,
                croppedBlob,
                fileName: image?.alt || image?.file?.name || 'photo.jpg',
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
                className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[96vh] overflow-hidden flex flex-col"
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
