import { useState } from 'react';
import { Info } from 'lucide-react';
import { getProductPricingTableDisplay } from '../utils/productQuantityPricing';

const ProductPricingTableContent = ({ product, quantity = 0 }) => {
    const rows = getProductPricingTableDisplay(product, quantity);

    return (
        <div dir="rtl">
            <p className="text-xs text-gray-500 mb-3">
                המחיר ליחידה לפי <strong>כמות ההזמנה</strong> של מוצר זה.
            </p>
            <table className="w-full text-sm border-collapse">
                <thead>
                    <tr className="bg-gray-50 text-gray-600 text-xs">
                        <th className="py-2 px-2 text-right font-semibold border-b border-gray-200">
                            כמות
                        </th>
                        <th className="py-2 px-2 text-center font-semibold border-b border-gray-200">
                            מחיר ליחידה
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

const ProductPricingInfo = ({ product, quantity = 0, className = '' }) => {
    const [open, setOpen] = useState(false);

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className={`inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#f2665e] transition-colors underline-offset-2 hover:underline ${className}`}
            >
                <Info className="w-3.5 h-3.5 shrink-0" aria-hidden />
                <span>איך התמחור עובד?</span>
            </button>

            {open && (
                <div
                    className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]"
                    onClick={() => setOpen(false)}
                    role="presentation"
                >
                    <div
                        className="bg-white rounded-xl shadow-xl max-w-sm w-full p-5 text-right"
                        dir="rtl"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="product-pricing-modal-title"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-start justify-between gap-3 mb-3">
                            <h3
                                id="product-pricing-modal-title"
                                className="text-base font-bold text-gray-800"
                            >
                                איך התמחור עובד?
                            </h3>
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="text-gray-400 hover:text-gray-600 text-xl leading-none p-1"
                                aria-label="סגור"
                            >
                                ×
                            </button>
                        </div>

                        <ProductPricingTableContent product={product} quantity={quantity} />

                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            className="mt-4 w-full py-2 text-sm font-bold text-white bg-[#f2665e] hover:bg-[#d95248] rounded-lg transition-colors"
                        >
                            הבנתי, תודה
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default ProductPricingInfo;
