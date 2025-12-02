import React from 'react';
import ImageCard from './ImageCard';

const Gallery = ({ 
    images, 
    onQuantityChange, 
    onRemove, 
    onImageSelect, 
    selectedImageId, 
    onSendOrder, 
    onSizeChange, 
    availableSizes // NEW: Receive sizes from the page
}) => {
  return (
    <section className="py-16 bg-white min-h-[400px]">
      <div className="container mx-auto px-6">
        {images.length === 0 ? (
            <div className="text-center text-gray-400 py-12 border-2 border-dashed border-gray-200 rounded-xl">
                <p className="text-xl">לא נבחרו תמונות. אנא העלה תמונות באמצעות הכפתור למעלה.</p>
            </div>
        ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
            {images.map((image) => (
                <ImageCard
                    key={image.id}
                    image={image}
                    onQuantityChange={onQuantityChange}
                    onRemove={onRemove}
                    onImageSelect={onImageSelect}
                    onSizeChange={onSizeChange}
                    isSelected={image.id === selectedImageId}
                    availableSizes={availableSizes} // NEW: Pass it down to the card
                />
            ))}
            </div>
        )}
        
        {images.length > 0 && (
            <div className="text-center mt-12">
                <button 
                    onClick={onSendOrder}
                    className="bg-red-400 text-white font-bold py-3 px-10 rounded-full hover:bg-red-500 transition-all transform hover:scale-105 shadow-lg text-xl"
                >
                    הוסף לסל
                </button>
            </div>
        )}
      </div>
    </section>
  );
};

export default Gallery;