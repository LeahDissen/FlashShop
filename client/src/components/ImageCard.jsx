import React, { useState } from 'react';
import { XIcon } from './icons';

const ImageCard = ({ 
    image, 
    onQuantityChange, 
    onRemove, 
    onImageSelect, 
    isSelected, 
    onSizeChange, 
    availableSizes
}) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    
    const cardClasses = `relative group overflow-hidden rounded-xl shadow-lg w-full aspect-square transition-all duration-300 ${onImageSelect ? 'cursor-pointer' : ''} ${isSelected ? 'ring-4 ring-offset-2 ring-[#f2665e]' : ''}`;

    const sizes = (availableSizes && availableSizes.length > 0) 
        ? availableSizes.map(s => ({ value: s.size, label: s.label })) 
        : [
            { value: '10x15', label: '10x15 cm' },
            { value: '13x18', label: '13x18 cm' },
            { value: '20x30', label: '20x30 cm' }
        ];

    const currentSizeLabel = sizes.find(s => s.value === (image.size || sizes[0].value))?.label || sizes[0].label;

    const handleSelectSize = (value) => {
        if (onSizeChange) {
            onSizeChange(image.id, value);
        }
        setIsDropdownOpen(false);
    };

    return (
        <div className={cardClasses} onClick={() => onImageSelect && onImageSelect(image)}>
            <img
                src={image.src}
                alt={image.alt}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-black/20"></div>

            {image.quantity > 0 && (
                <button
                    onClick={(e) => { e.stopPropagation(); onRemove(image.id); }}
                    className="absolute top-2 left-2 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center text-gray-700 hover:bg-[#f2665e] hover:text-white transition-all duration-200 z-10 transform group-hover:scale-110"
                    aria-label="Remove image from order"
                >
                    <XIcon className="w-5 h-5" />
                </button>
            )}

            <div className="absolute top-2 right-2 z-20" onClick={(e) => e.stopPropagation()}>
                <div className="relative">
                    <button
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
                            ></div>
                            
                            <div className="absolute top-full right-0 mt-1 w-32 bg-white rounded-md shadow-xl border border-gray-100 overflow-hidden z-20 flex flex-col animate-fade-in">
                                {sizes.map((size) => (
                                    <button
                                        key={size.value}
                                        onClick={() => handleSelectSize(size.value)}
                                        className={`w-full px-4 py-2 text-sm text-center transition-colors
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

            <div className="absolute bottom-2 left-2 right-2 flex justify-center">
                <div className="bg-white/80 backdrop-blur-sm rounded-full p-1 flex items-center shadow-md">
                    <div className="flex items-center">
                        <button
                            onClick={(e) => { e.stopPropagation(); onQuantityChange(image.id, -1); }}
                            className="text-gray-700 hover:text-[#f2665e] text-2xl font-light px-2 disabled:text-gray-300 transition-colors"
                            disabled={image.quantity === 0}
                            aria-label="Decrease quantity"
                        >
                            -
                        </button>
                        <span className="text-gray-800 font-semibold w-6 text-center">{image.quantity}</span>
                        <button
                            onClick={(e) => { e.stopPropagation(); onQuantityChange(image.id, 1); }}
                            className="text-gray-700 hover:text-[#f2665e] text-2xl font-light px-2 transition-colors"
                            aria-label="Increase quantity"
                        >
                            +
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImageCard;