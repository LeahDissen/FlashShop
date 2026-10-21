import { useEffect, useState } from 'react';
import { quoteOrder } from '../../api/orders';
import useAppStore from '../../store/appStore';
import useAuthStore from '../../store/authStore';
import { toCheckoutItem } from '../../utils/cartItem';

const QUOTE_DELAY_MS = 400;

/**
 * The server's price for the cart – the same calculation as checkout and the order: club discounts for
 * a member (a guest is priced as a non-member, with how much she would save), album discount, join
 * gift and the coupon. Asked again when the cart, the coupon, the login or a club signup changes.
 * A code the server refuses (e.g. already used by this customer) is dropped: the cart is priced
 * without it, and `couponRefusal` ({ msg }, a new object each time) says why.
 * @returns {{ quote: object|null, error: string, couponRefusal: { msg: string }|null }}
 */
export function useCartQuote(cartItems, couponCode) {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const clubJoinedAt = useAppStore((state) => state.clubJoinedAt);
    const [result, setResult] = useState({ quote: null, error: '', couponRefusal: null });

    useEffect(() => {
        if (!cartItems.length) {
            setResult({ quote: null, error: '', couponRefusal: null });
            return undefined;
        }
        let cancelled = false;
        // Quantity steppers fire on every click: one request after the changes settle
        const items = cartItems.map(toCheckoutItem);
        const timer = setTimeout(async () => {
            let couponRefusal = null;
            try {
                let quote;
                try {
                    quote = await quoteOrder(items, couponCode || undefined);
                } catch (err) {
                    if (!couponCode || err.response?.status !== 400) throw err;
                    couponRefusal = { msg: err.response?.data?.msg || 'הקוד אינו תקין' };
                    quote = await quoteOrder(items, undefined);
                }
                if (!cancelled) setResult({ quote, error: '', couponRefusal });
            } catch (err) {
                if (!cancelled) setResult({ quote: null, error: err.response?.data?.msg || '', couponRefusal });
            }
        }, QUOTE_DELAY_MS);
        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [cartItems, couponCode, isAuthenticated, clubJoinedAt]);

    return result;
}
