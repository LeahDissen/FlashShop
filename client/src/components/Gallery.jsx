import React from 'react';
import ImageCard from './ImageCard';

const Gallery = ({ images, onQuantityChange, onRemove, onImageSelect, selectedImageId }) => {
  return (
    <section className="py-12 bg-white min-h-[400px]">
      <div className="container mx-auto px-6">
        
        {images.length === 0 ? (
            // המצב הריק - מלבן רחב ומקווקו
            <div className="w-full py-16 border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center bg-gray-50/50">
                <p className="text-xl text-gray-400 font-medium">
                    לא נבחרו תמונות. אנא העלה תמונות באמצעות הכפתור למעלה.
                </p>
            </div>
        ) : (
            // הגריד של התמונות - 5 עמודות במסכים גדולים
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {images.map((image) => (
                <ImageCard
                key={image.id}
                image={image}
                onQuantityChange={onQuantityChange}
                onRemove={onRemove}
                onImageSelect={onImageSelect}
                isSelected={image.id === selectedImageId}
                />
            ))}
            </div>
        )}
        
        {/* כפתור השליחה התחתון */}
        {images.length > 0 && (
            <div className="text-center mt-16">
                <button className="bg-[#f2665e] text-white font-bold py-3 px-16 rounded-full hover:bg-[#d95248] transition-all transform hover:scale-105 shadow-lg text-lg">
                    שליחת הזמנה
                </button>
            </div>
        )}
      </div>
    </section>
  );
};

export default Gallery;