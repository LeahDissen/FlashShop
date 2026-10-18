import { getSaleInfo } from '../utils/salePrice';

const formatShekel = (value) => {
    const num = Number(value);
    return Number.isFinite(num) ? `₪${Number.isInteger(num) ? num : num.toFixed(2)}` : '';
};

/**
 * Product price. On sale: the previous price struck through next to the new price, plus a discount percent badge.
 * @param {{ product: object, priceClassName?: string }} props
 */
export default function SalePrice({ product, priceClassName = 'font-semibold text-gray-900' }) {
    const sale = getSaleInfo(product);

    if (!sale) {
        return <span className={priceClassName}>{formatShekel(product?.price)}</span>;
    }

    return (
        <span className="inline-flex flex-wrap items-baseline justify-center gap-x-2 gap-y-0.5">
            <span className={`${priceClassName} text-[#f2665e]`}>{formatShekel(product.price)}</span>
            <del className="text-gray-400 text-[0.85em]" aria-label={`במקום ${formatShekel(sale.originalPrice)}`}>
                {formatShekel(sale.originalPrice)}
            </del>
            <span className="text-[0.75em] font-bold text-white bg-[#f2665e] rounded-full px-2 py-0.5">
                {sale.percentOff}%-
            </span>
        </span>
    );
}
