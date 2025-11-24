import React from 'react';
import PersonalizationSection from '../components/PersonalizationSection';


const ProductsPage = ({ onNavigate, onSelectProduct, selectedProduct }) => {
    return (
        <div className="min-h-screen bg-white">
            <div className="pt-8 min-h-[60vh]">
                <PersonalizationSection 
                    onNavigateToEditor={() => onNavigate('/editor')}
                    onSelectProduct={onSelectProduct}
                    selectedProduct={selectedProduct}
                />
            </div>
          
        </div>
    );
};

export default ProductsPage;