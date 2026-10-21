const DEFAULT_NOT_MEMBER_TEXT = 'ההנחה היא לחברי המועדון שלנו. הצטרפו עכשיו וקבלו את ההנחה';

/**
 * Above the cart's pay bar: the regular price and each discount as its own line (club members, album,
 * join gift, coupon), as the server priced them. A non-member whose cart has member discounts sees
 * how much she would save and a join button.
 */
export default function CartPriceSummary({ quote, onJoinClub }) {
    if (!quote) return null;
    const showsDiscounts = quote.discounts?.length > 0;
    const canSave = !quote.isMember && quote.potentialMemberSavings > 0;
    if (!showsDiscounts && !canSave) return null;

    return (
        <div className="bg-white border border-[#f2665e]/20 rounded-2xl px-4 py-3 mb-2 text-sm space-y-1.5" dir="rtl">
            {showsDiscounts && (
                <>
                    <div className="flex justify-between text-gray-700">
                        <span>מחיר רגיל</span>
                        <span>{Number(quote.subtotal).toFixed(2)} ₪</span>
                    </div>
                    {quote.discounts.map((line) => (
                        <div key={line.kind} className="flex justify-between font-semibold text-green-700">
                            <span>{line.label}</span>
                            <span dir="ltr">-{Number(line.amount).toFixed(2)} ₪</span>
                        </div>
                    ))}
                </>
            )}
            {canSave && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#fff5f4] rounded-xl px-3 py-2">
                    <p className="text-gray-800">
                        {quote.notMemberText || DEFAULT_NOT_MEMBER_TEXT}
                        <span className="block font-bold text-[#f2665e]">
                            בהזמנה הזו תחסכו {Number(quote.potentialMemberSavings).toFixed(2)} ₪
                        </span>
                    </p>
                    <button
                        type="button"
                        onClick={onJoinClub}
                        className="shrink-0 bg-[#f2665e] text-white font-bold px-4 py-2 rounded-full hover:bg-[#d95248]"
                    >
                        הצטרפות למועדון
                    </button>
                </div>
            )}
        </div>
    );
}
