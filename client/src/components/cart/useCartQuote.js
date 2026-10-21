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
 * @returns {{ quote: object|null, error: string }}
 */
export function useCartQuote(cartItems, couponCode) {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const clubJoinedAt = useAppStore((state) => state.clubJoinedAt);
    const [result, setResult] = useState({ quote: null, error: '' });

    useEffect(() => {
        if (!cartItems.length) {
            setResult({ quote: null, error: '' });
            return undefined;
        }
        let cancelled = false;
        // Quantity steppers fire on every click: one request after the changes settle
        const timer = setTimeout(() => {
            quoteOrder(cartItems.map(toCheckoutItem), couponCode || undefined)
                .then((quote) => { if (!cancelled) setResult({ quote, error: '' }); })
                .catch((err) => { if (!cancelled) setResult({ quote: null, error: err.response?.data?.msg || '' }); });
        }, QUOTE_DELAY_MS);
        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [cartItems, couponCode, isAuthenticated, clubJoinedAt]);

    return result;
}
