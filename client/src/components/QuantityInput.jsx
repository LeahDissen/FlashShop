import { useEffect, useState } from 'react';

const VARIANTS = {
    cart: {
        wrapper: 'inline-flex items-center border border-gray-300 rounded-md overflow-hidden bg-white shrink-0',
        button: 'min-w-[36px] h-9 px-2.5 text-lg leading-none text-gray-700 hover:bg-gray-100 disabled:opacity-40 touch-manipulation select-none',
        input: 'w-11 h-9 py-0 text-center font-medium border-x border-gray-300 outline-none focus:bg-gray-50',
    },
    photo: {
        wrapper: 'bg-white/80 backdrop-blur-sm rounded-full p-1 flex items-center shadow-md',
        button: 'text-gray-700 hover:text-[#f2665e] text-2xl font-light px-2 disabled:text-gray-300 transition-colors',
        input: 'w-8 text-center font-semibold text-gray-800 bg-transparent outline-none',
    },
    compact: {
        wrapper: 'inline-flex items-center border border-gray-200 rounded-md overflow-hidden bg-white text-xs',
        button: 'px-1.5 py-0.5 hover:text-[#f2665e] disabled:opacity-40',
        input: 'w-8 py-0.5 text-center font-semibold text-gray-800 border-x border-gray-200 outline-none focus:bg-gray-50',
    },
};

export default function QuantityInput({
    quantity,
    onQuantityChange,
    min = 1,
    max = 9999,
    variant = 'cart',
    className = '',
    stopPropagation = false,
}) {
    const styles = VARIANTS[variant] || VARIANTS.cart;
    const [inputValue, setInputValue] = useState(String(quantity));

    useEffect(() => {
        setInputValue(String(quantity));
    }, [quantity]);

    const clamp = (value) => Math.min(max, Math.max(min, value));

    const applyQuantity = (next) => {
        const clamped = clamp(next);
        setInputValue(String(clamped));
        onQuantityChange(clamped);
    };

    const handleDecrease = (e) => {
        if (stopPropagation) e.stopPropagation();
        applyQuantity(quantity - 1);
    };

    const handleIncrease = (e) => {
        if (stopPropagation) e.stopPropagation();
        applyQuantity(quantity + 1);
    };

    const handleInputChange = (e) => {
        if (stopPropagation) e.stopPropagation();
        const raw = e.target.value.replace(/\D/g, '');
        setInputValue(raw);
        if (raw !== '') {
            const parsed = parseInt(raw, 10);
            if (Number.isFinite(parsed)) {
                onQuantityChange(clamp(parsed));
            }
        }
    };

    const handleInputBlur = () => {
        const parsed = parseInt(inputValue, 10);
        applyQuantity(Number.isFinite(parsed) ? parsed : min);
    };

    const handleInputKeyDown = (e) => {
        if (stopPropagation) e.stopPropagation();
        if (e.key === 'Enter') {
            e.currentTarget.blur();
        }
    };

    return (
        <div className={`${styles.wrapper} ${className}`.trim()}>
            <button
                type="button"
                onClick={handleDecrease}
                disabled={quantity <= min}
                className={styles.button}
                aria-label="הפחת כמות"
            >
                −
            </button>
            <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={inputValue}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                onKeyDown={handleInputKeyDown}
                onClick={stopPropagation ? (e) => e.stopPropagation() : undefined}
                className={styles.input}
                aria-label="כמות"
            />
            <button
                type="button"
                onClick={handleIncrease}
                disabled={quantity >= max}
                className={styles.button}
                aria-label="הוסף כמות"
            >
                +
            </button>
        </div>
    );
}
