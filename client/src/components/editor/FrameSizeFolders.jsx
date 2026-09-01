import { useMemo, useState } from 'react';
import { ChevronLeftIcon, GridIcon } from '../icons';
import { ORIENTATION, getFrameOrientation } from '../../utils/orientationMatching';

const ORIENTATION_TABS = [ORIENTATION.LANDSCAPE, ORIENTATION.PORTRAIT];

const matchesOrientation = (frame, orientation) => {
    const frameOrientation = getFrameOrientation(frame);
    return !frameOrientation
        || frameOrientation === ORIENTATION.SQUARE
        || frameOrientation === orientation;
};

/**
 * בורר מסגרות בנוי כתיקיות לפי מידות הדפסה (10×15, 13×18, 15×20 ...),
 * וכל תיקייה מחולקת למסגרות לרוחב ולאורך.
 * מידות התיקיות והתוויות מנוהלות מלוח הבקרה ולא מקובעות בקוד.
 */
const FrameSizeFolders = ({
    frames,
    printSizes,
    orientationLabels,
    folderTexts,
    loading,
    activeGlobalFrameId,
    onApplyFrame,
    onSelectFrame,
}) => {
    const [openSizeKey, setOpenSizeKey] = useState(null);
    const [orientationFilter, setOrientationFilter] = useState(ORIENTATION.LANDSCAPE);

    /** מסגרות בלי מידה משויכת זמינות בכל התיקיות */
    const framesForSize = useMemo(() => {
        const bySize = new Map();
        printSizes.forEach((size) => bySize.set(size.key, []));

        frames.forEach((frame) => {
            const key = frame.printSizeKey;
            if (!key) {
                printSizes.forEach((size) => bySize.get(size.key)?.push(frame));
                return;
            }
            bySize.get(key)?.push(frame);
        });

        return bySize;
    }, [frames, printSizes]);

    const openSize = printSizes.find((size) => size.key === openSizeKey) || null;

    const visibleFrames = useMemo(() => {
        if (!openSize) return [];
        return (framesForSize.get(openSize.key) || [])
            .filter((frame) => matchesOrientation(frame, orientationFilter));
    }, [framesForSize, openSize, orientationFilter]);

    if (loading) {
        return <p className="text-sm text-gray-400 px-2">טוען מסגרות...</p>;
    }

    if (!openSize) {
        return (
            <div className="space-y-2 px-1">
                <p className="text-xs text-gray-500 px-1 mb-1">{folderTexts.subtitle}</p>
                {printSizes.map((size) => {
                    const count = (framesForSize.get(size.key) || []).length;
                    return (
                        <button
                            key={size.key}
                            type="button"
                            onClick={() => setOpenSizeKey(size.key)}
                            className="w-full flex items-center justify-between gap-3 p-3 rounded-xl border border-gray-200 bg-white shadow-sm hover:border-red-300 hover:shadow-md transition-all text-right group"
                        >
                            <span className="flex items-center gap-3 min-w-0">
                                <span className="w-10 h-10 rounded-lg bg-red-50 text-red-500 flex items-center justify-center shrink-0 group-hover:bg-red-100 transition-colors">
                                    <GridIcon className="w-5 h-5" />
                                </span>
                                <span className="min-w-0">
                                    <span className="block font-bold text-gray-800 text-sm truncate">
                                        {size.label}
                                    </span>
                                    <span className="block text-xs text-gray-400">
                                        {count} מסגרות
                                    </span>
                                </span>
                            </span>
                            <ChevronLeftIcon className="w-4 h-4 text-gray-400 group-hover:text-red-500 transition-colors shrink-0" />
                        </button>
                    );
                })}
            </div>
        );
    }

    return (
        <div className="px-1">
            <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-gray-800 text-sm">{openSize.label}</span>
                <button
                    type="button"
                    onClick={() => setOpenSizeKey(null)}
                    className="text-xs font-medium text-gray-500 hover:text-red-500 transition-colors flex items-center gap-1 px-2 py-1 rounded hover:bg-red-50"
                >
                    <span>כל המידות</span>
                    <ChevronLeftIcon className="w-3 h-3 rotate-180" />
                </button>
            </div>

            <div className="flex gap-1 mb-3 p-1 rounded-xl bg-gray-100">
                {ORIENTATION_TABS.map((orientation) => (
                    <button
                        key={orientation}
                        type="button"
                        onClick={() => setOrientationFilter(orientation)}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${
                            orientationFilter === orientation
                                ? 'bg-white text-red-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        {orientation === ORIENTATION.LANDSCAPE
                            ? orientationLabels.landscape
                            : orientationLabels.portrait}
                    </button>
                ))}
            </div>

            {visibleFrames.length === 0 ? (
                <p className="text-sm text-gray-400 px-2 py-4 text-center">{folderTexts.emptyText}</p>
            ) : (
                <div className="grid grid-cols-3 gap-2">
                    {visibleFrames.map((frame) => {
                        const isActive = activeGlobalFrameId === frame._id;
                        return (
                            <button
                                key={frame._id}
                                type="button"
                                onClick={() => (isActive ? onSelectFrame?.(frame) : onApplyFrame(frame, openSize, orientationFilter))}
                                className={`relative aspect-square bg-white rounded-xl border shadow-sm hover:shadow-md transition-all p-1.5 flex items-center justify-center group ${
                                    isActive
                                        ? 'border-red-500 ring-2 ring-red-200'
                                        : 'border-gray-200 hover:border-red-300'
                                }`}
                                title={frame.title}
                            >
                                {frame.layoutType === 'multi_dropzone' && (
                                    <span className="absolute top-1 right-1 z-10 text-[9px] font-bold bg-red-500 text-white px-1 py-0.5 rounded">
                                        קולאז׳
                                    </span>
                                )}
                                <img
                                    src={frame.thumbnailUrl || frame.imageUrl}
                                    alt={frame.title}
                                    className="max-w-full max-h-full object-contain transition-transform duration-300 group-hover:scale-105"
                                />
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default FrameSizeFolders;
