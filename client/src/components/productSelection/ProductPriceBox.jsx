import { Minus, Plus } from 'lucide-react';
import ClubGiftBadge from '../ClubGiftBadge';
import ProductPricingInfo from '../ProductPricingInfo';
import SalePrice from '../SalePrice';
import { formatPrice } from '../../utils/productQuantityPricing';

function QuantityStepper({ quantity }) {
    return (
        <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-[#f2665e]/80">כמות</span>
            <div className="inline-flex items-center border border-[#f2665e]/30 rounded-lg overflow-hidden bg-white">
                <button
                    type="button"
                    onClick={quantity.decrease}
                    disabled={quantity.getQuantity() <= 1}
                    className="px-2.5 py-1.5 text-[#f2665e] hover:bg-[#fff5f4] disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                    aria-label="הפחת כמות"
                >
                    <Minus size={16} />
                </button>
                <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={quantity.quantityInput}
                    onChange={(e) => quantity.changeInput(e.target.value)}
                    onBlur={quantity.commitInput}
                    className="w-11 py-1.5 text-center text-sm font-semibold text-gray-900 border-x border-[#f2665e]/20 outline-none"
                    aria-label="כמות"
                />
                <button
                    type="button"
                    onClick={quantity.increase}
                    disabled={quantity.getQuantity() >= quantity.maxQuantity}
                    className="px-2.5 py-1.5 text-[#f2665e] hover:bg-[#fff5f4] disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                    aria-label="הוסף כמות"
                >
                    <Plus size={16} />
                </button>
            </div>
        </div>
    );
}

/** The price (per unit and total with quantity tiers, or the sale price), badges, print size, quantity and stock */
export default function ProductPriceBox({ product, quantity, pricing, showTieredPricing, isMagnet, isSimple }) {
    return (
        <div className="rounded-xl bg-[#fff5f4]/60 border border-[#f2665e]/15 px-4 py-3 space-y-2">
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                {isMagnet ? (
                    <>
                        <SalePrice product={product} priceClassName="text-xl font-semibold text-gray-900" />
                        {product.size && <span className="text-xs text-[#f2665e]/80">גודל {product.size} ס&quot;מ</span>}
                    </>
                ) : showTieredPricing ? (
                    <>
                        <span className="text-xl font-semibold text-gray-900">
                            {formatPrice(pricing.unitPrice)}
                            <span className="text-xs font-normal text-gray-500 mr-1">ליחידה</span>
                        </span>
                        <span className="text-sm font-semibold text-[#f2665e]">
                            סה&quot;כ {formatPrice(pricing.grandTotal)}
                        </span>
                    </>
                ) : (
                    <SalePrice product={product} priceClassName="text-xl font-semibold text-gray-900" />
                )}
            </div>

            <ClubGiftBadge product={product} className="!justify-start" />
            {product.isOnSale && showTieredPricing && (
                <p className="text-xs font-bold text-[#f2665e]">מוצר במבצע: חברות מועדון מקבלות הנחה בתשלום</p>
            )}
            {!isSimple && !isMagnet && (product.printWidth || product.printHeight) && (
                <p className="text-xs text-[#f2665e]/70">
                    משטח הדפסה: {product.printWidth ?? 12} × {product.printHeight ?? 18} ס&quot;מ
                </p>
            )}

            <div className="flex flex-wrap items-center gap-4 pt-1">
                <QuantityStepper quantity={quantity} />
                {showTieredPricing && <ProductPricingInfo product={product} quantity={quantity.currentQuantity} />}
                {product.stock > 0 && product.stock < 9999 && (
                    <span className="text-xs text-gray-500 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-full">
                        במלאי {product.stock}
                    </span>
                )}
            </div>
        </div>
    );
}
