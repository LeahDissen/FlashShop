import ImageCard from './ImageCard';
import PhotoOrderSummary from './PhotoOrderSummary';
import PhotoPricingInfo from './PhotoPricingInfo';

const Gallery = ({
    images,
    onSetQuantity,
    onRemove,
    onClearAll,
    onImageSelect,
    selectedImageId,
    onSendOrder,
    onSizeChange,
    onAdjustPrint,
    onToggleOrientation,
    availableSizes,
    orderPricing,
    nextTierHint,
    albumDiscount,
}) => {
    return (
        <section className="py-12 bg-white min-h-[400px]">
            <div className="container mx-auto px-6">
                {images.length === 0 ? (
                    <div className="w-full py-16 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-3 bg-gray-50/50">
                        <p className="text-xl text-gray-400 font-medium text-center px-4">
                            לא נבחרו תמונות. אנא העלה תמונות באמצעות הכפתור למעלה.
                        </p>
                        <PhotoPricingInfo totalPrints={0} />
                    </div>
                ) : (
                    <>
                        <PhotoOrderSummary
                            totalPrints={orderPricing?.totalPrints ?? 0}
                            unitPrice={orderPricing?.unitPrice ?? 0}
                            grandTotal={orderPricing?.grandTotal ?? 0}
                            tierLabel={orderPricing?.tier?.label ?? ''}
                            nextTierHint={nextTierHint}
                            albumDiscount={albumDiscount}
                        />
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                            {images.map((image) => (
                                <ImageCard
                                    key={image.id}
                                    image={image}
                                    onSetQuantity={onSetQuantity}
                                    onRemove={onRemove}
                                    onImageSelect={onImageSelect}
                                    onSizeChange={onSizeChange}
                                    onAdjustPrint={onAdjustPrint}
                                    onToggleOrientation={onToggleOrientation}
                                    isSelected={image.id === selectedImageId}
                                    availableSizes={availableSizes}
                                />
                            ))}
                        </div>
                    </>
                )}
                {images.length > 0 && (
                    <div className="text-center mt-12">
                        <button
                            onClick={onClearAll}
                            className="bg-gray-200 text-gray-800 font-bold py-3 px-8 rounded-full hover:bg-gray-300 transition-all ml-3"
                        >
                            מחק את כל התמונות
                        </button>
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