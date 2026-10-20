import { useEffect, useMemo, useState } from 'react';
import { useProductStore } from '../../store/productStore';

const UNLIMITED_STOCK = 9999;

/**
 * The quantity on the product page: typed or stepped, kept between 1 and the stock, and shared with
 * the editor through the product store. A new product starts again from 1.
 */
export function useProductQuantity({ productId, stock }) {
    const setOrderQuantity = useProductStore((state) => state.setOrderQuantity);
    const [quantityInput, setQuantityInput] = useState('1');
    const maxQuantity = stock > 0 ? stock : UNLIMITED_STOCK;

    useEffect(() => {
        setQuantityInput('1');
        setOrderQuantity(1);
    }, [productId, setOrderQuantity]);

    const parse = (raw) => {
        const parsed = parseInt(raw, 10);
        if (!Number.isFinite(parsed) || parsed < 1) return 1;
        return Math.min(maxQuantity, parsed);
    };

    /** The quantity as it will be ordered (a half-typed value counts as at least 1) */
    const getQuantity = () => parse(quantityInput);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- parse depends only on maxQuantity
    const currentQuantity = useMemo(() => parse(quantityInput), [quantityInput, maxQuantity]);

    const applyQuantity = (next) => {
        const clamped = Math.min(maxQuantity, Math.max(1, next));
        setQuantityInput(String(clamped));
        setOrderQuantity(clamped);
        return clamped;
    };

    /** Typing keeps only digits; a valid number updates the order quantity right away */
    const changeInput = (rawValue) => {
        const raw = rawValue.replace(/\D/g, '');
        setQuantityInput(raw);
        if (raw !== '') {
            const parsed = parseInt(raw, 10);
            if (Number.isFinite(parsed) && parsed >= 1) setOrderQuantity(Math.min(maxQuantity, parsed));
        }
    };

    return {
        quantityInput,
        maxQuantity,
        currentQuantity,
        getQuantity,
        applyQuantity,
        changeInput,
        decrease: () => applyQuantity(getQuantity() - 1),
        increase: () => applyQuantity(getQuantity() + 1),
        commitInput: () => applyQuantity(getQuantity()),
    };
}
