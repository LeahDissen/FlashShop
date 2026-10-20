import { getSaleInfo } from '../utils/salePrice';

const formatShekel = (value) => {
    const num = Number(value);
    return Number.isFinite(num) ? `₪${Number.isInteger(num) ? num : num.toFixed(2)}` : '';
};

/**
 * Product price. A members-only sale shows the regular price and, under it, the club members' price
 * (bold, with the percent off) – the discount is given at checkout to members.
 * @param {{ product: object, priceClassName?: string }} props
 */
export default function SalePrice({ product, priceClassName = 'font-semibold text-gray-900' }) {
    const sale = getSaleInfo(product);

    if (!sale) {
        return <span className={priceClassName}>{formatShekel(product?.price)}</span>;
    }

    return (
        <span className="inline-flex flex-col items-center gap-0.5">
            <span className={priceClassName}>{formatShekel(product.price)}</span>
            <span className="inline-flex items-baseline gap-1.5 text-[#f2665e]">
                <span className="text-[0.8em]">לחברות מועדון:</span>
                <span className="font-bold text-[1.1em]">{formatShekel(sale.memberPrice)}</span>
                <span className="text-[0.7em] font-bold text-white bg-[#f2665e] rounded-full px-2 py-0.5">{sale.percentOff}%-</span>
            </span>
        </span>
    );
}
