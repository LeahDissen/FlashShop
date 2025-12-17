import React, { useEffect, useState } from 'react';
import { SparklesIcon } from './icons';
import { getProducts } from '../api/products';

const PersonalizationSection = ({ onNavigateToEditor, onSelectProduct, selectedProduct, content }) => {
    const [products, setProducts] = useState([]);
    // 1. Initialize categories state with just "All" (Hebrew: הכל)
    const [categories, setCategories] = useState(["הכל"]);
    const [activeCategory, setActiveCategory] = useState("הכל");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const data = await getProducts();
                setProducts(data);

                // 2. Dynamically extract unique categories from the fetched products
                // We filter out any empty categories just in case
                const uniqueCategories = [...new Set(data.map(p => p.category).filter(c => c))];
                
                // 3. Update the categories list (Starting with "הכל")
                setCategories(["הכל", ...uniqueCategories]);

            } catch (error) {
                console.error("Failed to load products", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    // Filter logic based on the active dynamic category
    const filteredProducts = products.filter(product => {
        if (activeCategory === "הכל") return true;
        return product.category === activeCategory; 
    });

    const handleCategoryChange = (category) => {
        setActiveCategory(category);
        onSelectProduct(null); // Clear selection when switching categories
    };

    const handleStartDesigning = () => {
        if (selectedProduct) {
            onNavigateToEditor();
        }
    };

    return (
        <section className="py-16 bg-white">
            <div className="container mx-auto px-6 text-center">
                <h2 className="text-3xl font-bold text-[#f2665e] mb-4">{content.sectionTitle}</h2>
                <p className="text-gray-600 mb-8 max-w-2xl mx-auto">{content.sectionDescription}</p>

                {/* 4. Render Dynamic Categories */}
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
                            onClick={() => onSelectProduct(product.name)}
                            className={`cursor-pointer rounded-xl overflow-hidden border-2 transition-all duration-300 transform hover:scale-105 flex flex-col bg-white
                                ${selectedProduct === product.name 
                                    ? 'border-red-400 ring-4 ring-red-100 shadow-xl' 
                                    : 'border-transparent shadow-md hover:shadow-xl'
                                }`}
                        >
                            <div className="h-48 bg-gray-50 flex items-center justify-center overflow-hidden">
                                <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                            </div>
                            
                            <div className={`p-3 flex flex-col items-center gap-1 ${selectedProduct === product.name ? 'bg-red-50' : 'bg-white'}`}>
                                <h3 className={`font-bold text-sm md:text-base ${selectedProduct === product.name ? 'text-[#f2665e]' : 'text-gray-800'}`}>
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

                <button
                    onClick={handleStartDesigning}
                    disabled={!selectedProduct}
                    className="bg-red-400 text-white font-bold py-4 px-12 rounded-full hover:bg-red-500 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed shadow-lg text-xl flex items-center justify-center mx-auto transform hover:scale-105 disabled:hover:scale-100 disabled:shadow-none"
                >
                    <SparklesIcon className="w-6 h-6 ml-2" /> {content.buttonText}
                </button>
                
                {!selectedProduct && (
                    <p className="text-sm text-gray-500 mt-3">{content.msg}</p>
                )}
            </div>
        </section>
    );
};

export default PersonalizationSection;