import { useEffect, useRef, useState } from 'react';

/** A number with − / + buttons; the number can also be typed (clamped to min–max) */
const NumericStepper = ({ value, onChange, min = 0, max = 200, step = 1, label }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [draftValue, setDraftValue] = useState(String(value));
    const inputRef = useRef(null);

    useEffect(() => {
        if (!isEditing) {
            setDraftValue(String(value));
        }
    }, [value, isEditing]);

    const commitValue = (raw) => {
        const parsed = parseInt(String(raw).trim(), 10);
        if (!Number.isNaN(parsed)) {
            onChange(Math.max(min, Math.min(max, parsed)));
            return;
        }
        setDraftValue(String(value));
    };

    const handleDecrement = () => onChange(Math.max(min, value - step));
    const handleIncrement = () => onChange(Math.min(max, value + step));

    const handleInputChange = (e) => {
        const next = e.target.value.replace(/[^\d]/g, '');
        setDraftValue(next);
        if (next === '') return;
        const parsed = parseInt(next, 10);
        if (!Number.isNaN(parsed)) {
            onChange(Math.max(min, Math.min(max, parsed)));
        }
    };

    const handleFocus = (e) => {
        setIsEditing(true);
        window.setTimeout(() => e.target.select(), 0);
    };

    const handleBlur = () => {
        setIsEditing(false);
        commitValue(draftValue);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            commitValue(draftValue);
            inputRef.current?.blur();
        }
        if (e.key === 'Escape') {
            e.preventDefault();
            setDraftValue(String(value));
            inputRef.current?.blur();
        }
    };

    return (
        <div className="flex items-center gap-2">
            {label && <span className="text-xs text-gray-500 font-medium">{label}</span>}
            <div className="flex items-center border border-gray-300 rounded-lg h-9 bg-white overflow-hidden shadow-sm" dir="ltr">
                <button
                    type="button"
                    onClick={handleDecrement}
                    className="px-3 h-full hover:bg-gray-50 active:bg-gray-100 border-r border-gray-300 text-gray-600 transition-colors flex items-center justify-center"
                >
                    -
                </button>
                <input
                    ref={inputRef}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={isEditing ? draftValue : String(value)}
                    onChange={handleInputChange}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    aria-label={label || 'ערך מספרי'}
                    className="w-14 text-center h-full border-none focus:ring-0 focus:outline-none text-gray-800 font-semibold bg-white text-sm cursor-text hover:bg-gray-50 focus:bg-white"
                />
                <button
                    type="button"
                    onClick={handleIncrement}
                    className="px-3 h-full hover:bg-gray-50 active:bg-gray-100 border-l border-gray-300 text-gray-600 transition-colors flex items-center justify-center"
                >
                    +
                </button>
            </div>
        </div>
    );
};

export default NumericStepper;
