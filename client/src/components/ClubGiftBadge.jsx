import useAppStore from '../store/appStore';
import { isGiftProduct, useClubGift } from '../hooks/useClubGift';
import { useClubStatus } from '../hooks/useClubStatus';

/**
 * On the join gift product: "מוצר מתנה לחברי מועדון חדשים" with a join button that opens the club popup.
 * A member whose gift is waiting (or who just joined) sees "מגיע לך מתנה, הזמן עכשיו" instead of the
 * join button; a member who already used her gift sees only the label.
 */
export default function ClubGiftBadge({ product, className = '' }) {
    const gift = useClubGift();
    const club = useClubStatus();
    const openClubWithEmail = useAppStore((state) => state.openClubWithEmail);
    if (!isGiftProduct(gift, product)) return null;
    const giftWaiting = club.giftAvailable || club.giftPending;
    return (
        <div className={`flex flex-wrap items-center justify-center gap-2 text-xs ${className}`}>
            {giftWaiting ? (
                <span className="font-bold text-white bg-[#f2665e] rounded-full px-3 py-1">🎁 מגיע לך מתנה, הזמן עכשיו</span>
            ) : (
                <>
                    <span className="font-bold text-[#f2665e]">🎁 מוצר מתנה לחברי מועדון חדשים</span>
                    {!club.isMember && (
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); openClubWithEmail(''); }}
                            className="font-bold text-white bg-[#f2665e] rounded-full px-3 py-1 hover:bg-[#d95248]"
                        >
                            הצטרף עכשיו
                        </button>
                    )}
                </>
            )}
        </div>
    );
}
