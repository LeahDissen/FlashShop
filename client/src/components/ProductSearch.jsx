import { useId, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { useProducts } from '../hooks/useProducts';
import { searchProducts } from '../utils/productSearch';

/**
 * שורת חיפוש מוצרים עם תוצאות מיידיות. בחירה בתוצאה עוברת לעמוד המוצר.
 * @param {{ className?: string }} props
 */
export default function ProductSearch({ className = '' }) {
    const { products } = useProducts();
    const navigate = useNavigate();
    const listId = useId();
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);

    const results = useMemo(() => searchProducts(products, query), [products, query]);
    const showResults = isOpen && query.trim().length >= 2;

    const openProduct = (product) => {
        setIsOpen(false);
        setQuery('');
        navigate(`/product-selection/${product._id}`, { state: { product } });
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            setIsOpen(false);
        } else if (e.key === 'ArrowDown' && results.length) {
            e.preventDefault();
            setIsOpen(true);
            setActiveIndex((index) => (index + 1) % results.length);
        } else if (e.key === 'ArrowUp' && results.length) {
            e.preventDefault();
            setActiveIndex((index) => (index <= 0 ? results.length - 1 : index - 1));
        } else if (e.key === 'Enter' && showResults && results.length) {
            e.preventDefault();
            openProduct(results[Math.max(0, activeIndex)]);
        }
    };

    return (
        <div className={`relative w-full max-w-xl mx-auto ${className}`} dir="rtl">
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-full shadow-sm px-4 py-2.5 focus-within:border-[#f2665e] focus-within:ring-2 focus-within:ring-[#f2665e]/20">
                <Search size={18} className="text-gray-400 shrink-0" aria-hidden="true" />
                <input
                    type="search"
                    role="combobox"
                    aria-label="חיפוש מוצרים"
                    aria-expanded={showResults}
                    aria-controls={listId}
                    aria-activedescendant={activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); setIsOpen(true); setActiveIndex(-1); }}
                    onFocus={() => setIsOpen(true)}
                    onBlur={() => setTimeout(() => setIsOpen(false), 150)}
                    onKeyDown={handleKeyDown}
                    placeholder="חיפוש מוצר, למשל: מגנט, ספל, אלבום"
                    className="flex-1 min-w-0 bg-transparent outline-none text-base text-gray-800 placeholder:text-gray-400 [&::-webkit-search-cancel-button]:hidden"
                />
                {query && (
                    <button
                        type="button"
                        onClick={() => { setQuery(''); setActiveIndex(-1); }}
                        className="text-gray-400 hover:text-gray-600 p-1"
                        aria-label="ניקוי החיפוש"
                    >
                        <X size={16} />
                    </button>
                )}
            </div>

            {showResults && (
                <ul
                    id={listId}
                    role="listbox"
                    className="absolute z-30 top-full mt-2 inset-x-0 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden max-h-96 overflow-y-auto"
                >
                    {results.length === 0 ? (
                        <li className="px-4 py-3 text-sm text-gray-500">לא נמצאו מוצרים מתאימים</li>
                    ) : results.map((product, index) => (
                        <li
                            key={product._id}
                            id={`${listId}-${index}`}
                            role="option"
                            aria-selected={index === activeIndex}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => openProduct(product)}
                            className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer ${
                                index === activeIndex ? 'bg-[#fff5f4]' : 'hover:bg-gray-50'
                            }`}
                        >
                            <img src={product.image} alt="" className="w-11 h-11 rounded-lg object-cover bg-gray-100 shrink-0" />
                            <span className="flex-1 min-w-0">
                                <span className="block text-sm font-bold text-gray-800 truncate">{product.name}</span>
                                {product.category && (
                                    <span className="block text-xs text-gray-500 truncate">{product.category}</span>
                                )}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
