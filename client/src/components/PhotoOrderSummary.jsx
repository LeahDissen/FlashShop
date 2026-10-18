import { Link } from 'react-router-dom';
import { ALBUM_CATEGORY, formatShekel } from '../utils/photoQuantityPricing';
import { formatPrintSizeCm } from '../utils/printSizes';
import PhotoPricingInfo from './PhotoPricingInfo';

const PhotoOrderSummary = ({
    pricing,
    totalPrints,
    grandTotal,
    sizes,
    nextTierHint,
    albumDiscount,
}) => {
    if (totalPrints === 0) return null;

    return (
        <div className="mb-6 space-y-3" dir="rtl">
            <div className="bg-[#fff5f4] border border-[#f2665e]/30 rounded-xl p-4 text-center shadow-sm">
                <div className="flex items-center justify-center gap-3 mb-1 flex-wrap">
                    <p className="text-sm text-gray-600">סיכום הזמנת פיתוח תמונות</p>
                    <PhotoPricingInfo
                        pricing={pricing}
                        printsBySize={Object.fromEntries(sizes.map(({ size, count }) => [size, count]))}
                    />
                </div>
                <p className="text-lg font-bold text-gray-800">{totalPrints} הדפסות</p>
                <ul className="text-sm text-gray-600 mt-1 space-y-0.5">
                    {sizes.map(({ size, count, unitPrice }) => (
                        <li key={size}>
                            {formatPrintSizeCm(size)}: {count} × {formatShekel(unitPrice)}
                        </li>
                    ))}
                </ul>
                <p className="text-2xl font-bold text-[#f2665e] mt-2">
                    סה״כ: {grandTotal.toFixed(2)} ₪
                </p>
                {nextTierHint && (
                    <p className="text-sm text-gray-600 mt-3 bg-white/70 rounded-full py-1.5 px-4 inline-block">
                        💡 {nextTierHint}
                    </p>
                )}
            </div>

            {albumDiscount && (
                <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <p className="text-green-800 font-medium text-sm text-center sm:text-right">
                        בחרת {totalPrints} תמונות — מגיעה לך{' '}
                        <strong>{albumDiscount.percent}% הנחה</strong> על אלבומי תמונות!
                    </p>
                    <Link
                        to={`/products?category=${encodeURIComponent(ALBUM_CATEGORY)}`}
                        className="shrink-0 bg-green-600 hover:bg-green-700 text-white text-sm font-bold py-2 px-5 rounded-full transition-colors"
                    >
                        לבחירת אלבום
                    </Link>
                </div>
            )}
        </div>
    );
};

export default PhotoOrderSummary;
