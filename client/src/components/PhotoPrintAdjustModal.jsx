import { useEffect, useRef, useState } from 'react';
import {
    DEFAULT_CROP,
    getCropWarning,
    getPrintSizeLabel,
    parsePrintSize,
} from '../utils/printSizes';
import PhotoCroppedPreview from './PhotoCroppedPreview';

const PhotoPrintAdjustModal = ({
    image,
    availableSizes = [],
    onSave,
    onClose,
}) => {
    const [crop, setCrop] = useState(image?.crop ?? DEFAULT_CROP);
    const [dims, setDims] = useState({ w: 0, h: 0 });
    const dragRef = useRef({ active: false, startX: 0, startY: 0, startOx: 0, startOy: 0 });

    const print = parsePrintSize(image?.size);
    const sizeLabel = getPrintSizeLabel(image?.size, availableSizes);

    useEffect(() => {
        setCrop(image?.crop ?? DEFAULT_CROP);
    }, [image?.id, image?.size, image?.crop]);

    useEffect(() => {
        if (!image?.src) return;
        const img = new Image();
        img.onload = () => setDims({ w: img.naturalWidth, h: img.naturalHeight });
        img.src = image.src;
    }, [image?.src]);

    const warning = getCropWarning(dims.w, dims.h, print.aspect);

    const handlePointerDown = (e) => {
        if ((crop.scale ?? 1) <= 1) return;
        dragRef.current = {
            active: true,
            startX: e.clientX,
            startY: e.clientY,
            startOx: crop.offsetX ?? 0,
            startOy: crop.offsetY ?? 0,
        };
        e.currentTarget.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e) => {
        if (!dragRef.current.active) return;
        const dx = (e.clientX - dragRef.current.startX) / 120;
        const dy = (e.clientY - dragRef.current.startY) / 120;
        setCrop((prev) => ({
            ...prev,
            offsetX: Math.max(-1, Math.min(1, dragRef.current.startOx + dx)),
            offsetY: Math.max(-1, Math.min(1, dragRef.current.startOy + dy)),
        }));
    };

    const handlePointerUp = (e) => {
        dragRef.current.active = false;
        try {
            e.currentTarget.releasePointerCapture(e.pointerId);
        } catch {
            /* ignore */
        }
    };

    const handleSave = () => {
        onSave(image.id, crop);
        onClose();
    };

    const handleReset = () => setCrop(DEFAULT_CROP);

    if (!image) return null;

    return (
        <div
            className="fixed inset-0 z-[180] flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm"
            onClick={onClose}
            role="presentation"
        >
            <div
                className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-5"
                dir="rtl"
                role="dialog"
                aria-modal="true"
                aria-labelledby="print-adjust-title"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                        <h2 id="print-adjust-title" className="text-lg font-bold text-gray-800">
                            תצוגה מקדימה להדפסה
                        </h2>
                        <p className="text-sm text-gray-500">גודל: {sizeLabel}</p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 text-2xl leading-none p-1"
                        aria-label="סגור"
                    >
                        ×
                    </button>
                </div>

                {warning && (
                    <div className="mb-3 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                        {warning}
                    </div>
                )}

                <p className="text-xs text-gray-500 mb-2">
                    כך תיראה התמונה בהדפסה. גררי את התמונה לאחר הגדלה כדי למקם אותה.
                </p>

                <div
                    className="mx-auto max-w-sm touch-none cursor-grab active:cursor-grabbing"
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerLeave={handlePointerUp}
                >
                    <PhotoCroppedPreview
                        src={image.src}
                        alt={image.alt}
                        size={image.size}
                        crop={crop}
                        frameClassName="rounded-lg border-2 border-[#f2665e]/40 shadow-md"
                    />
                </div>

                <div className="mt-5 space-y-3">
                    <label className="block text-sm font-medium text-gray-700">
                        זום: {Math.round((crop.scale ?? 1) * 100)}%
                        <input
                            type="range"
                            min={100}
                            max={300}
                            step={5}
                            value={Math.round((crop.scale ?? 1) * 100)}
                            onChange={(e) =>
                                setCrop((prev) => ({
                                    ...prev,
                                    scale: Number(e.target.value) / 100,
                                }))
                            }
                            className="w-full mt-1 accent-[#f2665e]"
                        />
                    </label>
                    <p className="text-xs text-gray-400">
                        100% = התאמה מלאה לגודל. הגדלה מעל 100% מאפשרת למקם את התמונה ולמנוע חיתוך לא רצוי.
                    </p>
                </div>

                <div className="flex flex-wrap gap-2 mt-5 justify-end">
                    <button
                        type="button"
                        onClick={handleReset}
                        className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                        איפוס
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                        ביטול
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        className="px-5 py-2 text-sm font-bold text-white bg-[#f2665e] hover:bg-[#d95248] rounded-lg"
                    >
                        שמור
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PhotoPrintAdjustModal;
