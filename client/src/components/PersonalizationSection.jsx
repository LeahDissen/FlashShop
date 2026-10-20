import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { useProducts } from '../hooks/useProducts';
import SalePrice from './SalePrice';
import ClubGiftBadge from './ClubGiftBadge';
import { optimizeImageUrl } from '../utils/imageUrl';

const PersonalizationSection = ({ onSelectProduct, content, initialCategory }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [, setSearchParams] = useSearchParams();
    const isAdmin = useAuthStore((state) => state.isAdmin());
    const [linkCopied, setLinkCopied] = useState(false);
    const { products, loading, error } = useProducts();
    const loadError = error ? 'לא ניתן לטעון מוצרים. נסי שוב בעוד רגע.' : null;
    const categories = useMemo(
        () => ["הכל", ...new Set(products.map((p) => p.category).filter(Boolean))],
        [products],
    );
    const [activeCategory, setActiveCategory] = useState("הכל");

    const formatPrice = (price) => {
        const num = typeof price === 'number' ? price : parseFloat(price);
        return Number.isFinite(num) ? num.toFixed(2) : null;
    };

    useEffect(() => {
        if (!initialCategory || categories.length <= 1) return;

        const exact = categories.find((c) => c === initialCategory);
        if (exact) {
            setActiveCategory(exact);
            return;
        }

        const fuzzy = categories.find(
            (c) =>
                c !== 'הכל' &&
                (c.includes(initialCategory) || initialCategory.includes(c)),
        );
        if (fuzzy) setActiveCategory(fuzzy);
    }, [initialCategory, categories]);

    const filteredProducts = products.filter(product => {
        if (activeCategory === "הכל") return true;
        return product.category === activeCategory;
    });

    const handleCategoryChange = (category) => {
        setActiveCategory(category);
        onSelectProduct(null);
        setLinkCopied(false);
        // On the products page the address follows the category, so it can be copied and sent to customers
        if (location.pathname === '/products') {
            setSearchParams((params) => {
                const next = new URLSearchParams(params);
                if (category === "הכל") next.delete('category');
                else next.set('category', category);
                return next;
            }, { replace: true });
        }
    };

    const categoryLink = `${window.location.origin}/products?category=${encodeURIComponent(activeCategory)}`;
    const copyCategoryLink = async () => {
        try {
            await navigator.clipboard.writeText(categoryLink);
            setLinkCopied(true);
        } catch {
            window.prompt('הקישור לקטגוריה:', categoryLink);
        }
    };

    const handleProductClick = (product) => {
        onSelectProduct?.(product);
        navigate(`/product-selection/${product._id}`, { state: { product } });
    };

    return (
        <section className="py-16 bg-white">
            <div className="container mx-auto px-6 text-center">
                <h2 className="text-3xl font-bold text-[#f2665e] mb-4">{content.sectionTitle}</h2>
                <p className="text-gray-600 mb-8 max-w-2xl mx-auto">{content.sectionDescription}</p>

                {/* Render Dynamic Categories */}
                <div className="flex flex-wrap justify-center gap-6 mb-10 text-sm font-medium text-gray-500">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => handleCategoryChange(cat)}
                            className={`transition-colors hover:text-[#f2665e] ${activeCategory === cat
                                    ? "text-[#f2665e] font-bold border-b-2 border-[#f2665e]"
                                    : ""
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {isAdmin && activeCategory !== "הכל" && (
                    <button
                        type="button"
                        onClick={copyCategoryLink}
                        className="-mt-6 mb-8 text-xs text-gray-500 hover:text-[#f2665e] underline underline-offset-2"
                    >
                        {linkCopied ? 'הקישור הועתק ✓' : `העתקת קישור ישיר לקטגוריה "${activeCategory}" (מנהלת)`}
                    </button>
                )}

                {loading && (
                    <p className="text-gray-500 py-12">טוען מוצרים...</p>
                )}

                {loadError && (
                    <div className="py-12 px-4 text-center">
                        <p className="text-red-600 font-medium mb-2">{loadError}</p>
                        <button type="button" onClick={() => window.location.reload()} className="text-sm font-bold text-[#f2665e] hover:underline">
                            לרענן את הדף
                        </button>
                    </div>
                )}

                {!loading && !loadError && filteredProducts.length === 0 && (
                    <p className="text-gray-500 py-12">אין מוצרים להצגה</p>
                )}

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-12">
                    {!loading && !loadError && filteredProducts.map((product) => {
                        const priceLabel = formatPrice(product.price);
                        return (
                        <div
                            key={product._id || product.name}
                            onClick={() => handleProductClick(product)}
                            className={`cursor-pointer rounded-xl overflow-hidden border-2 transition-all duration-300 transform hover:scale-105 flex flex-col bg-white border-transparent shadow-md hover:shadow-xl hover:border-red-300`}
                        >
                            <div className="relative h-48 bg-gray-50 flex items-center justify-center overflow-hidden">
                                <img src={optimizeImageUrl(product.image, { width: 500 })} alt={product.name} loading="lazy" className="w-full h-full object-cover" />
                                {product.isOnSale && (
                                    <span className="absolute top-2 right-2 text-xs font-bold px-2.5 py-1 rounded-full bg-[#f2665e] text-white shadow-md">
                                        מוצר במבצע
                                    </span>
                                )}
                            </div>

                            <div className="p-3 flex flex-col items-center gap-1 bg-white">
                                <h3 className="font-bold text-sm md:text-base text-gray-800">
                                    {product.name}
                                </h3>
                                {priceLabel && (
                                    <span className="text-xs">
                                        <SalePrice product={product} priceClassName="text-gray-500" />
                                    </span>
                                )}
                                <ClubGiftBadge product={product} className="mt-1" />
                                {product.size && (
                                    <span className="text-gray-400 text-xs">
                                        {product.size}
                                    </span>
                                )}
                            </div>
                        </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default PersonalizationSection;