import { FlipHorizontalIcon, XIcon } from '../icons';
import { orientationLabel } from '../../utils/orientationMatching';

/**
 * הודעה לא חוסמת שמופיעה כשכיוון התמונה שהועלתה לא תואם לכיוון המסגרת,
 * ומציעה סיבוב אוטומטי ב-90°. הטקסטים נערכים מלוח הבקרה.
 */
const OrientationMismatchNotice = ({
    notice,
    prompt,
    orientationLabels,
    onRotate,
    onDismiss,
}) => {
    if (!notice) return null;

    const imageText = orientationLabel(notice.imageOrientation, orientationLabels);
    const targetText = orientationLabel(notice.targetOrientation, orientationLabels);

    return (
        <div className="absolute bottom-4 right-4 left-4 z-40 flex justify-center pointer-events-none">
            <div className="pointer-events-auto max-w-md w-full rounded-2xl border border-red-100 bg-white/95 backdrop-blur-sm shadow-xl p-4 text-right">
                <div className="flex items-start justify-between gap-3 mb-1">
                    <h4 className="font-bold text-gray-800 text-sm">{prompt.title}</h4>
                    <button
                        type="button"
                        onClick={onDismiss}
                        className="p-1 rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors shrink-0"
                        aria-label={prompt.dismissLabel}
                    >
                        <XIcon className="w-4 h-4" />
                    </button>
                </div>

                <p className="text-xs text-gray-600 mb-1">{prompt.body}</p>
                <p className="text-xs text-gray-400 mb-3">
                    התמונה {imageText} · המסגרת {targetText}
                </p>

                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={onRotate}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-[#f2665e] text-white text-sm font-bold shadow-lg shadow-[#f2665e]/25 hover:bg-[#d95248] active:bg-[#c44840] transition-colors"
                    >
                        <FlipHorizontalIcon className="w-4 h-4 shrink-0" />
                        <span>{prompt.rotateLabel}</span>
                    </button>
                    <button
                        type="button"
                        onClick={onDismiss}
                        className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-bold hover:bg-gray-50 transition-colors"
                    >
                        {prompt.dismissLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OrientationMismatchNotice;
