import ImageCard from './ImageCard';

const Gallery = ({ 
    images, 
    onQuantityChange, 
    onRemove, 
    onImageSelect, 
    selectedImageId, 
    onSendOrder, 
    onSizeChange, 
    availableSizes
}) => {
  return (
    <section className="py-12 bg-white min-h-[400px]">
      <div className="container mx-auto px-6">
        
        {images.length === 0 ? (
            <div className="w-full py-16 border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center bg-gray-50/50">
                <p className="text-xl text-gray-400 font-medium">
                    לא נבחרו תמונות. אנא העלה תמונות באמצעות הכפתור למעלה.
                </p>
            </div>
        ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {images.map((image) => (
                <ImageCard
                    key={image.id}
                    image={image}
                    onQuantityChange={onQuantityChange}
                    onRemove={onRemove}
                    onImageSelect={onImageSelect}
                    onSizeChange={onSizeChange}
                    isSelected={image.id === selectedImageId}
                    availableSizes={availableSizes}
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