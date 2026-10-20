import { useState } from 'react';
import { Info } from 'lucide-react';

/**
 * Print option button with a hint: the hint shows on mouse hover or focus,
 * and on touch screens when tapping the "i" icon in the button's corner.
 * @param {{ hint?: string, className: string, children: React.ReactNode } & React.ButtonHTMLAttributes} props
 */
export default function PrintOptionButton({ hint, className, children, ...buttonProps }) {
    const [hintOpen, setHintOpen] = useState(false);

    return (
        <div className="relative group">
            <button type="button" className={`w-full ${className}`} {...buttonProps}>
                {children}
            </button>
            {hint && (
                <>
                    <button
                        type="button"
                        aria-label="הסבר על האפשרות"
                        aria-expanded={hintOpen}
                        onClick={() => setHintOpen((open) => !open)}
                        className="absolute top-1/2 -translate-y-1/2 left-2 p-1 text-current opacity-70 hover:opacity-100 cursor-pointer"
                    >
                        <Info size={14} />
                    </button>
                    <div
                        role="tooltip"
                        className={`absolute z-20 top-full mt-1.5 inset-x-0 rounded-lg bg-gray-900 text-white text-xs leading-relaxed p-2.5 shadow-lg text-right ${
                            hintOpen ? 'block' : 'hidden group-hover:block group-focus-within:block'
                        }`}
                    >
                        {hint}
                    </div>
                </>
            )}
        </div>
    );
}
