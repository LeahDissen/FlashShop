import React from 'react';
import { SparklesIcon } from './icons';

// These URLs strictly match the PRODUCT_BASE_IMAGES in geminiService.js to ensure WYSIWYG consistency
const products = [
    {
        name: 'T-shirt',
        hebrew: 'חולצת טי',
        image: 'https://plus.unsplash.com/premium_photo-1718913931807-4da5b5dd27fa?q=80&w=872&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
    },
    {
        name: 'Hoodie',
        hebrew: 'סווטשירט',
        image: 'https://res.cloudinary.com/dwqywo11u/image/upload/v1764665297/46b286ce-72e3-41cf-a944-aee7b2d7a6cf.png'
    },
    {
        name: 'Baseball Cap',
        hebrew: 'כובע בייסבול',
        image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?q=80&w=600&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
    },
    {
        name: 'Coffee Mug',
        hebrew: 'ספל קפה',
        image: 'https://images.unsplash.com/photo-1650959858546-d09833d5317b?q=80&w=600&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
    },
    {
        name: 'Travel Tumbler',
        hebrew: 'כוס נסיעה',
        image: 'https://res.cloudinary.com/dwqywo11u/image/upload/v1764664548/c78a3697-1a3f-4dbe-a1fd-7313906d7acc.png'
    },
    {
        name: 'Tote Bag',
        hebrew: 'תיק בד',
        image: 'https://res.cloudinary.com/dwqywo11u/image/upload/v1764665384/0a2a71bd-9b22-40ca-b51d-a3618e1aeac2.png'
    },
    {
        name: 'Phone Case',
        hebrew: 'מגן סיליקון לטלפון',
        image: 'https://res.cloudinary.com/dwqywo11u/image/upload/v1764664147/79cbbfc1-c774-4f4e-ba40-f3556189c42d.png'
    },
    {
        name: 'Notebook',
        hebrew: 'מחברת',
        image: 'https://res.cloudinary.com/dwqywo11u/image/upload/v1764664450/b7972b7a-bcd6-42a7-abff-5d8d78020380.png'
    },
    {
        name: 'Jigsaw Puzzle',
        hebrew: 'פאזל',
        image: 'https://res.cloudinary.com/dwqywo11u/image/upload/v1764660525/%D7%A6%D7%99%D7%9C%D7%95%D7%9D_%D7%9E%D7%A1%D7%9A_2025-12-02_092438_onulbc.png'
    },
    {
        name: 'Heart Puzzle',
        hebrew: 'פאזל לב',
        image: 'https://res.cloudinary.com/dwqywo11u/image/upload/v1764660525/%D7%A6%D7%99%D7%9C%D7%95%D7%9D_%D7%9E%D7%A1%D7%9A_2025-12-02_092545_lspvtv.png'
    }
];

const PersonalizationSection = ({ onNavigateToEditor, onSelectProduct, selectedProduct }) => {

    const handleStartDesigning = () => {
        if (selectedProduct) {
            onNavigateToEditor();
        }
    };

    return (
        <section className="py-16 bg-white">
            <div className="container mx-auto px-6 text-center">
                <h2 className="text-3xl font-bold text-[#f2665e] mb-4">בחר מוצר לעיצוב</h2>
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