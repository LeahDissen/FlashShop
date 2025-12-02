import React from 'react';
import PersonalizationSection from '../components/PersonalizationSection';
import { useProductStore } from '../store/productStore';


const ProductsPage = ({ onNavigate }) => {
    const { selectedProduct, setSelectedProduct } = useProductStore();
    const headerImage = "https://res.cloudinary.com/dwqywo11u/image/upload/v1764666507/f6801575-ae0f-4bb9-a601-6dae3d03c3bc.png";

    return (
        <div className="min-h-screen bg-white">
            {/* Header Section - כמו בעמוד הטיפים */}
            <div className="w-full relative">
                <div
                    className="relative h-[240px] sm:h-[320px] bg-cover bg-center flex items-center justify-center text-white"
                    style={{ backgroundImage: `url(${headerImage})` }}
                >
                    {/* שכבת הצללה כדי שהטקסט יבלוט */}
                    <div className="absolute inset-0 bg-black/20"></div>

                    <h1 className="relative z-10 text-5xl sm:text-6xl font-bold text-center drop-shadow-lg tracking-wide">
                        המוצרים שלנו
                    </h1>

                    {/* הגל הלבן בתחתית */}
                    <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0] rotate-180">
                        <svg
                            className="relative block w-[calc(100%+1.3px)] h-[50px] md:h-[70px]"
                            data-name="Layer 1"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 1200 120"
                            preserveAspectRatio="none"
                        >
                            <path
                                d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
                                fill="#ffffff"
                            ></path>
                        </svg>
                    </div>
                </div>
            </div>

            <div className="pt-8 min-h-[60vh]">
                <PersonalizationSection
                    onNavigateToEditor={() => onNavigate('/editor')}
                    onSelectProduct={setSelectedProduct}
                    selectedProduct={selectedProduct}
                />
            </div>

        </div>
    );
};

export default ProductsPage;