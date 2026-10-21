import { DEFAULT_PENDING_GIFT_TEXT, DEFAULT_SUCCESS_TEXT } from './clubTexts';

/**
 * After joining: the success text, the gift email notice or the benefit code, and a close button.
 * `texts` holds the admin's successText and pendingGiftText (empty = the defaults).
 */
export default function ClubJoinSuccess({ texts, result, onClose }) {
    return (
        <div className="w-full max-w-xs flex flex-col items-center gap-3 z-20" role="status">
            <p className="text-xl font-bold whitespace-pre-line drop-shadow-md">
                {texts.successText || DEFAULT_SUCCESS_TEXT}
            </p>
            {result.pendingGift && (
                <p className="text-sm font-light whitespace-pre-line">
                    {texts.pendingGiftText || DEFAULT_PENDING_GIFT_TEXT}
                </p>
            )}
            {result.code && (
                <p className="text-sm font-light">
                    קוד ההטבה שלך: <span className="font-mono font-bold tracking-wider" dir="ltr">{result.code}</span>
                </p>
            )}
            <button
                type="button"
                onClick={onClose}
                className="bg-white text-[#f0645a] font-bold py-2 px-6 rounded-full mt-2 hover:bg-gray-100 transition-colors shadow-lg"
            >
                סגירה
            </button>
        </div>
    );
}
