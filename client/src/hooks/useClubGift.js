import { useEffect, useState } from 'react';
import { getShopSettings } from '../api/shopSettings';

let cachedGift = null;
let request = null;

/** The join gift settings (which product, on/off), loaded once per visit for the product cards */
export function useClubGift() {
    const [gift, setGift] = useState(cachedGift);
    useEffect(() => {
        if (cachedGift) return undefined;
        let cancelled = false;
        request = request || getShopSettings().then((data) => data.clubGift || null).catch(() => null);
        request.then((value) => {
            cachedGift = value;
            if (!cancelled) setGift(value);
        });
        return () => { cancelled = true; };
    }, []);
    return gift;
}

/** True when this product is the active join gift */
export const isGiftProduct = (gift, product) =>
    Boolean(gift?.enabled && gift.productId && String(gift.productId) === String(product?._id));
