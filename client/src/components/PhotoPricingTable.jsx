import { getPricingTableDisplay } from '../utils/photoQuantityPricing';

/** תוכן הטבלה בלבד — לשימוש במודאל או בתצוגה מקומית */
export const PhotoPricingTableContent = ({ totalPrints = 0 }) => {
    const rows = getPricingTableDisplay(totalPrints);

    return (
        <div dir="rtl">
            <p className="text-xs text-gray-500 mb-3">
                המחיר לתמונה לפי <strong>סך כל ההדפסות</strong> (כולל עותקים).
            </p>
            <table className="w-full text-sm border-collapse">
                <thead>
                    <tr className="bg-gray-50 text-gray-600 text-xs">
                        <th className="py-2 px-2 text-right font-semibold border-b border-gray-200">
                            כמות
                        </th>
                        <th className="py-2 px-2 text-center font-semibold border-b border-gray-200">
                            מחיר
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row) => (
                        <tr
                            key={row.min}
                            className={row.isActive ? 'bg-[#fff5f4]' : ''}
                        >
                            <td className="py-2 px-2 text-right border-b border-gray-100 text-gray-800">
                                {row.rangeLabel}
                                {row.isActive && (
                                    <span className="mr-1 text-[10px] font-bold text-[#f2665e]">
                                        ✓
                                    </span>
                                )}
                            </td>
                            <td
                                className={`py-2 px-2 text-center border-b border-gray-100 font-semibold ${
                                    row.isActive ? 'text-[#f2665e]' : 'text-gray-700'
                                }`}
                            >
                                {row.priceLabel}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default PhotoPricingTableContent;
