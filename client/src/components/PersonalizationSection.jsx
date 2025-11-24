import React from 'react';
import { SparklesIcon } from './icons';

// These URLs strictly match the PRODUCT_BASE_IMAGES in geminiService.js to ensure WYSIWYG consistency
const products = [
    { 
        name: 'Coffee Mug', 
        hebrew: 'ספל קפה', 
        image: 'https://images.unsplash.com/photo-1517260739337-6799d2df8a12?w=600&q=80' 
    },
    { 
        name: 'T-shirt', 
        hebrew: 'חולצת טי', 
        image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80' 
    },
    { 
        name: 'Jigsaw Puzzle', 
        hebrew: 'פאזל', 
        image: 'https://plus.unsplash.com/premium_photo-1664113038676-e41c46342894?w=600&q=80' 
    },
    { 
        name: 'Phone Case', 
        hebrew: 'כיסוי לטלפון', 
        image: 'https://images.unsplash.com/photo-1586105251261-72a756497a11?w=600&q=80' 
    },
    { 
        name: 'Tote Bag', 
        hebrew: 'תיק בד', 
        image: 'https://images.unsplash.com/photo-1622560417282-3f66d0d21d66?w=600&q=80' 
    }
];

const PersonalizationSection = ({ onNavigateToEditor, onSelectProduct, selectedProduct }) => {
    
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
                            <div className={`p-3 ${selectedProduct === product.name ? 'bg-red-400 text-white' : 'bg-white'}`}>
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