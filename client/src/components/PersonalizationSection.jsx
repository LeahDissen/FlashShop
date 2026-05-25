import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProducts } from '../api/products';

const PersonalizationSection = ({ onSelectProduct, content }) => {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState(["הכל"]);
    const [activeCategory, setActiveCategory] = useState("הכל");
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);

    const formatPrice = (price) => {
        const num = typeof price === 'number' ? price : parseFloat(price);
        return Number.isFinite(num) ? num.toFixed(2) : null;
    };

    useEffect(() => {
        const fetchProducts = async () => {
            setLoadError(null);
            try {
                const data = await getProducts();
                const list = Array.isArray(data) ? data : [];
                setProducts(list);
                const uniqueCategories = [...new Set(list.map(p => p.category).filter(c => c))];
                setCategories(["הכל", ...uniqueCategories]);
            } catch (error) {
                console.error("Failed to load products", error);
                setLoadError('לא ניתן לטעון מוצרים. ודא שהשרת (פורט 5000) פועל.');
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    const filteredProducts = products.filter(product => {
        if (activeCategory === "הכל") return true;
        return product.category === activeCategory;
    });

    const handleCategoryChange = (category) => {
        setActiveCategory(category);
        onSelectProduct(null);
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

                {loading && (
                    <p className="text-gray-500 py-12">טוען מוצרים...</p>
                )}

                {loadError && (
                    <div className="py-12 px-4 text-center">
                        <p className="text-red-600 font-medium mb-2">{loadError}</p>
                        <p className="text-gray-500 text-sm">הרץ בטרמינל: <code className="bg-gray-100 px-2 py-1 rounded">cd FlashShop/Server &amp;&amp; npm run dev</code></p>
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
                            <div className="h-48 bg-gray-50 flex items-center justify-center overflow-hidden">
                                <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                            </div>

                            <div className="p-3 flex flex-col items-center gap-1 bg-white">
                                <h3 className="font-bold text-sm md:text-base text-gray-800">
                                    {product.name}
                                </h3>
                                {priceLabel && (
                                    <span className="text-gray-500 text-xs">
                                        ₪{priceLabel}
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