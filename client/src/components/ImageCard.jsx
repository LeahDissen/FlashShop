import { useState } from 'react';
import { RotateCw } from 'lucide-react';
import { XIcon } from './icons';
import PhotoCroppedPreview from './PhotoCroppedPreview';
import {
    DEFAULT_CROP,
    DEFAULT_PHOTO_PRINT_SIZE,
    getCompactPrintSizeLabel,
    mergePhotoPricesWithCatalog,
} from '../utils/printSizes';

const ImageCard = ({
    image,
    onQuantityChange,
    onRemove,
    onImageSelect,
    isSelected,
    onSizeChange,
    onAdjustPrint,
    onToggleOrientation,
    availableSizes,
}) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const cardClasses = `relative group overflow-hidden rounded-xl shadow-lg w-full aspect-square transition-all duration-300 ${onImageSelect ? 'cursor-pointer' : ''} ${isSelected ? 'ring-4 ring-offset-2 ring-[#f2665e]' : ''}`;

    const sizes = (availableSizes && availableSizes.length > 0)
        ? availableSizes.map((s) => ({ value: s.size, label: s.label }))
        : mergePhotoPricesWithCatalog([]).map((s) => ({ value: s.size, label: s.label }));

    const currentSize = image.size || DEFAULT_PHOTO_PRINT_SIZE;
    const orientation = image.orientation ?? 'landscape';
    const currentSizeLabel = getCompactPrintSizeLabel(currentSize, orientation);

    const handleSelectSize = (value) => {
        if (onSizeChange) {
            onSizeChange(image.id, value);
        }
        setIsDropdownOpen(false);
    };

    return (
        <div className={cardClasses} onClick={() => onImageSelect && onImageSelect(image)}>
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900/10">
                <PhotoCroppedPreview
                    src={image.src}
                    alt={image.alt}
                    size={currentSize}
                    orientation={orientation}
                    crop={image.crop ?? DEFAULT_CROP}
                    frameClassName="w-full h-auto max-h-full shadow-inner"
                    className="transition-transform duration-300 group-hover:scale-[1.02]"
                />
            </div>
            <div className="absolute inset-0 bg-black/20 pointer-events-none" />

            {image.quantity > 0 && (
                <button
                    onClick={(e) => { e.stopPropagation(); onRemove(image.id); }}
                    className="absolute top-2 left-2 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center text-gray-700 hover:bg-[#f2665e] hover:text-white transition-all duration-200 z-10"
                    aria-label="הסר תמונה"
                >
                    <XIcon className="w-5 h-5" />
                </button>
            )}

            {onAdjustPrint && (
                <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onAdjustPrint(image.id); }}
                    className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 invisible opacity-0 group-hover:visible group-hover:opacity-100 focus:visible focus:opacity-100 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto focus:pointer-events-auto bg-white/95 text-[10px] font-bold text-[#f2665e] px-3 py-1 rounded-full shadow-sm border border-[#f2665e]/30"
                >
                    תצוגה / חיתוך
                </button>
            )}

            <div className="absolute top-2 right-2 z-20 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                {onToggleOrientation && (
                    <button
                        type="button"
                        onClick={() => onToggleOrientation(image.id)}
                        className="w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center text-gray-700 hover:bg-[#f2665e] hover:text-white transition-colors"
                        title={orientation === 'landscape' ? 'החלף לאורך' : 'החלף לרוחב'}
                        aria-label="החלף כיוון הדפסה"
                    >
                        <RotateCw className="w-4 h-4" />
                    </button>
                )}
                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="bg-white pl-8 pr-3 py-1.5 rounded-full shadow-md text-xs font-bold text-gray-700 flex items-center justify-center hover:bg-gray-50 transition-colors"
                    >
                        {currentSizeLabel}
                        <div className="absolute inset-y-0 left-0 flex items-center pl-2 text-gray-500 pointer-events-none">
                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                            </svg>
                        </div>
                    </button>

                    {isDropdownOpen && (
                        <>
                            <div
                                className="fixed inset-0 z-10 cursor-default"
                                onClick={() => setIsDropdownOpen(false)}
                            />
                            <div className="absolute top-full right-0 mt-1 min-w-[14rem] max-w-[18rem] bg-white rounded-md shadow-xl border border-gray-100 overflow-hidden z-20 flex flex-col">
                                {sizes.map((size) => (
                                    <button
                                        key={size.value}
                                        type="button"
                                        onClick={() => handleSelectSize(size.value)}
                                        className={`w-full px-3 py-2 text-xs text-right leading-snug transition-colors
                                            ${image.size === size.value
                                                ? 'bg-[#f2665e] text-white'
                                                : 'text-gray-700 hover:bg-[#f2665e] hover:text-white'
                                            }`}
                                    >
                                        {size.label}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            <div className="absolute bottom-2 left-2 right-2 flex justify-center z-10">
                <div className="bg-white/80 backdrop-blur-sm rounded-full p-1 flex items-center shadow-md">
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onQuantityChange(image.id, -1); }}
                        className="text-gray-700 hover:text-[#f2665e] text-2xl font-light px-2 disabled:text-gray-300 transition-colors"
                        disabled={image.quantity <= 1}
                        aria-label="הפחת כמות"
                    >
                        −
                    </button>
                    <span className="text-gray-800 font-semibold w-6 text-center">{image.quantity}</span>
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onQuantityChange(image.id, 1); }}
                        className="text-gray-700 hover:text-[#f2665e] text-2xl font-light px-2 transition-colors"
                        aria-label="הוסף כמות"
                    >
                        +
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ImageCard;
