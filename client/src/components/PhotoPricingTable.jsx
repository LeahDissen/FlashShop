import { formatShekel, getPricingTableDisplay } from '../utils/photoQuantityPricing';
import { getPhotoSizeCatalogEntry } from '../utils/printSizes';

const sizeHeader = (size) => {
    const entry = getPhotoSizeCatalogEntry(size);
    return `${entry.widthCm}×${entry.heightCm}`;
};

/** טבלת המחיר לתמונה לפי כמות וגודל — לשימוש במודאל או בתצוגה מקומית */
export const PhotoPricingTableContent = ({ pricing, totalPrints = 0 }) => {
    if (!pricing) return null;
    const rows = getPricingTableDisplay(pricing, totalPrints);

    return (
        <div dir="rtl">
            <p className="text-xs text-gray-500 mb-3">
                המחיר לתמונה לפי <strong>סך כל ההדפסות</strong> בהזמנה (כולל עותקים) ולפי הגודל.
            </p>
            <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                    <thead>
                        <tr className="bg-gray-50 text-gray-600 text-xs">
                            <th className="py-2 px-2 text-right font-semibold border-b border-gray-200">כמות</th>
                            {pricing.sizes.map((s) => (
                                <th key={s.size} className="py-2 px-2 text-center font-semibold border-b border-gray-200 whitespace-nowrap">
                                    {sizeHeader(s.size)}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row) => (
                            <tr key={row.key} className={row.isActive ? 'bg-[#fff5f4]' : ''}>
                                <td className="py-2 px-2 text-right border-b border-gray-100 text-gray-800 whitespace-nowrap">
                                    {row.rangeLabel}
                                    {row.isActive && <span className="mr-1 text-[10px] font-bold text-[#f2665e]">✓</span>}
                                </td>
                                {row.prices.map(({ size, price }) => (
                                    <td
                                        key={size}
                                        className={`py-2 px-2 text-center border-b border-gray-100 font-semibold whitespace-nowrap ${
                                            row.isActive ? 'text-[#f2665e]' : 'text-gray-700'
                                        }`}
                                    >
                                        {formatShekel(price)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PhotoPricingTableContent;
