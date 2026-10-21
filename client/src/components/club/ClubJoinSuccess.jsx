/** After joining: the success text, the gift email notice or the benefit code, and a close button */
export default function ClubJoinSuccess({ successText, result, onClose }) {
    return (
        <div className="w-full max-w-xs flex flex-col items-center gap-3 z-20" role="status">
            <p className="text-xl font-bold whitespace-pre-line drop-shadow-md">
                {successText || "הצטרפת בהצלחה למועדון!"}
            </p>
            {result.pendingGift && (
                <p className="text-sm font-light">
                    שלחנו לך מייל לאישור הכתובת 🎁 אחרי האישור יישלח אלייך קוד מתנת ההצטרפות.
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
