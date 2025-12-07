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
        <section className="py-16 bg-white">
            <div className="container mx-auto px-6 text-center">
                <h2 className="text-3xl font-bold text-[#f2665e] mb-4">{content.sectionTitle}</h2>
                <p className="text-gray-600 mb-12 max-w-2xl mx-auto">{content.sectionDescription}</p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-12">
                    {products.map(product => (
                        <div
                            key={product.name}
                            onClick={() => onSelectProduct(product.name)}
                            className={`cursor-pointer rounded-xl overflow-hidden border-2 transition-all duration-300 transform hover:scale-105 ${selectedProduct === product.name ? 'border-red-400 ring-4 ring-red-100 shadow-xl' : 'border-transparent shadow-md hover:shadow-xl'}`}
                        >
                            <div className="h-48 bg-white flex items-center justify-center overflow-hidden">
                                <img src={product.image} alt={product.hebrew} className="w-full h-full object-cover" />
                            </div>
                            <div className={`p-3 ${selectedProduct === product.name ? 'bg-red-400 text-white' : 'bg-white text-[#f0645a]'}`}>
                                <h3 className="font-bold text-sm md:text-base">{product.hebrew}</h3>
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