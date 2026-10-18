import { formatShekel, getSizePriceRows, normalizeSize } from '../utils/photoQuantityPricing';
import { formatPrintSizeCm } from '../utils/printSizes';

/**
 * מדרגות המחיר לתמונה – טבלה קטנה לכל גודל.
 * @param {{ pricing: object, printsBySize?: Record<string, number> }} props
 */
export const PhotoPricingTableContent = ({ pricing, printsBySize = {} }) => {
    if (!pricing) return null;

    return (
        <div dir="rtl" className="space-y-4">
            <p className="text-xs text-gray-500">
                המחיר לתמונה יורד לפי <strong>כמות ההדפסות מאותו גודל</strong> בהזמנה (כולל עותקים).
            </p>
            {pricing.sizes.map(({ size }) => (
                <table key={size} className="w-full table-fixed text-sm border-collapse">
                    <caption className="text-right font-bold text-gray-700 pb-1">{formatPrintSizeCm(size)} ס&quot;מ</caption>
                    <tbody>
                        {getSizePriceRows(pricing, size, printsBySize[normalizeSize(size)] || 0).map((row) => (
                            <tr key={row.key} className={row.isActive ? 'bg-[#fff5f4]' : ''}>
                                <td className="py-1.5 px-2 text-right border-b border-gray-100 text-gray-800">
                                    <bdi className="whitespace-nowrap">{row.rangeLabel}</bdi> תמונות
                                    {row.isActive && <span className="mr-1 text-[10px] font-bold text-[#f2665e]">✓</span>}
                                </td>
                                <td className={`w-20 py-1.5 px-2 text-left border-b border-gray-100 font-semibold whitespace-nowrap ${
                                    row.isActive ? 'text-[#f2665e]' : 'text-gray-700'
                                }`}>
                                    {formatShekel(row.price)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ))}
        </div>
    );
};

export default PhotoPricingTableContent;
