import useAppStore from '../store/appStore';
import { isGiftProduct, useClubGift } from '../hooks/useClubGift';

/** On the join gift product: "מוצר מתנה לחברי מועדון חדשים" with a join button that opens the club popup */
export default function ClubGiftBadge({ product, className = '' }) {
    const gift = useClubGift();
    const openClubWithEmail = useAppStore((state) => state.openClubWithEmail);
    if (!isGiftProduct(gift, product)) return null;
    return (
        <div className={`flex flex-wrap items-center justify-center gap-2 text-xs ${className}`}>
            <span className="font-bold text-[#f2665e]">🎁 מוצר מתנה לחברי מועדון חדשים</span>
            <button
                type="button"
                onClick={(e) => { e.stopPropagation(); openClubWithEmail(''); }}
                className="font-bold text-white bg-[#f2665e] rounded-full px-3 py-1 hover:bg-[#d95248]"
            >
                הצטרף עכשיו
            </button>
        </div>
    );
}
