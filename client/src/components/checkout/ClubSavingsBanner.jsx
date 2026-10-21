/** For a non-member whose order has member discounts: how much joining the club saves, and a join button */
export default function ClubSavingsBanner({ quote, onJoin }) {
    if (!quote || quote.isMember || !(quote.potentialMemberSavings > 0)) return null;

    return (
        <div className="bg-[#fff5f4] border border-[#f2665e]/30 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-sm text-gray-800">
                {quote.notMemberText || 'את עדיין לא חברת מועדון. ההצטרפות בחינם, וחברות מועדון נהנות מהמבצעים באתר.'}
                <span className="block font-bold text-[#f2665e] mt-1">
                    בהזמנה הזו תחסכי ₪{Number(quote.potentialMemberSavings).toFixed(2)}
                </span>
            </p>
            <button
                type="button"
                onClick={onJoin}
                className="shrink-0 bg-[#f2665e] text-white font-bold px-5 py-2.5 rounded-full hover:bg-[#d95248]"
            >
                הצטרפות למועדון
            </button>
        </div>
    );
}
