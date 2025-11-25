import React from 'react';
import PersonalizationSection from '../components/PersonalizationSection';
import { useProductStore } from '../store/productStore';


const ProductsPage = ({ onNavigate }) => {
    const { selectedProduct, setSelectedProduct } = useProductStore();
    return (
        <div className="min-h-screen bg-white">
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