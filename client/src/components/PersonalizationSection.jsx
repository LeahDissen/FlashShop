import { useEffect, useState } from 'react';
import { SparklesIcon } from './icons';
import { getProducts } from '../api/products';

const PersonalizationSection = ({ onNavigateToEditor, onSelectProduct, selectedProduct, content }) => {
    const navigate = useNavigate(); // 2. שימוש ב-hook
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState(["הכל"]);
    const [activeCategory, setActiveCategory] = useState("הכל");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const data = await getProducts();
                setProducts(data);
                const uniqueCategories = [...new Set(data.map(p => p.category).filter(c => c))];
                setCategories(["הכל", ...uniqueCategories]);

            } catch (error) {
                console.error("Failed to load products", error);
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

    // 3. פונקציה חדשה לטיפול בלחיצה על מוצר
    const handleProductClick = (product) => {
        // ניווט לעמוד הביניים עם העברת אובייקט המוצר
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
                            className={`transition-colors hover:text-[#f2665e] ${
                                activeCategory === cat 
                                ? "text-[#f2665e] font-bold border-b-2 border-[#f2665e]" 
                                : ""
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-12">
                    {filteredProducts.map(product => (
                        <div
                            key={product._id || product.name}
                            // 4. שינוי ה-onClick כאן לניווט ישיר
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
                                {product.price && (
                                    <span className="text-gray-500 text-xs">
                                        ₪{product.price.toFixed(2)}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* הכפתור הישן הוסתר כי הלחיצה על המוצר עצמו מעבירה הלאה */}
                {/* <button
                    disabled={!selectedProduct}
                    className="..."
                >
                    <SparklesIcon className="w-6 h-6 ml-2" /> {content.buttonText}
                </button> 
                */}
            </div>
        </section>
    );
};

export default PersonalizationSection;