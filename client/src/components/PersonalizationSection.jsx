import React, { useEffect, useState } from 'react';
import { SparklesIcon } from './icons';
import { getProducts } from '../api/products'; // Import API function

const PersonalizationSection = ({ onNavigateToEditor, onSelectProduct, selectedProduct }) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const data = await getProducts();
                setProducts(data);
            } catch (error) {
                console.error("Failed to load products", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    const handleStartDesigning = () => {
        if (selectedProduct) {
            onNavigateToEditor();
        }
    };

    return (
        <section className="py-16 bg-gray-50">
            <div className="container mx-auto px-6 text-center">
                <h2 className="text-3xl font-bold text-gray-800 mb-4">בחר מוצר לעיצוב</h2>
                <p className="text-gray-600 mb-12 max-w-2xl mx-auto">
                    בחר את המוצר המושלם עבור המתנה שלך והתחל לעצב אותו בעורך המתקדם שלנו.
                </p>

                {loading ? (
                    <p className="text-gray-500">טוען מוצרים...</p>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-12">
                        {products.map(product => (
                            <div
                                key={product._id}
                                // We pass product.category because that matches the keys in aiService (e.g. 'T-shirt')
                                onClick={() => onSelectProduct(product.category)}
                                className={`cursor-pointer rounded-xl overflow-hidden border-2 transition-all duration-300 transform hover:scale-105 
                                    ${selectedProduct === product.category ? 'border-red-400 ring-4 ring-red-100 shadow-xl' : 'border-transparent shadow-md hover:shadow-xl'}`}
                            >
                                <div className="h-48 bg-white flex items-center justify-center overflow-hidden">
                                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                                </div>
                                <div className={`p-3 ${selectedProduct === product.category ? 'bg-red-400 text-white' : 'bg-white'}`}>
                                    <h3 className="font-bold text-sm md:text-base">{product.name}</h3>
                                    <p className={`text-xs mt-1 ${selectedProduct === product.category ? 'text-red-100' : 'text-gray-500'}`}>₪{product.price}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <button
                    onClick={handleStartDesigning}
                    disabled={!selectedProduct}
                    className="bg-red-400 text-white font-bold py-4 px-12 rounded-full hover:bg-red-500 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed shadow-lg text-xl flex items-center justify-center mx-auto transform hover:scale-105 disabled:hover:scale-100 disabled:shadow-none"
                >
                    <SparklesIcon className="w-6 h-6 ml-2" />
                    התחל לעצב
                </button>
                {!selectedProduct && (
                    <p className="text-sm text-gray-500 mt-3">אנא בחר מוצר כדי להתחיל</p>
                )}
            </div>
        </section>
    );
};

export default PersonalizationSection;