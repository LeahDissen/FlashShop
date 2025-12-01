import React from 'react';
import { XIcon } from './icons';

const ImageCard = ({ image, onQuantityChange, onRemove, onImageSelect, isSelected, onSizeChange }) => {
    const cardClasses = `relative group overflow-hidden rounded-xl shadow-lg w-full aspect-square transition-all duration-300 ${onImageSelect ? 'cursor-pointer' : ''} ${isSelected ? 'ring-4 ring-offset-2 ring-red-400' : ''}`;

    return (
        <div className={cardClasses} onClick={() => onImageSelect && onImageSelect(image)}>
            <img
                src={image.src}
                alt={image.alt}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-black/20"></div>

            {/* Remove Button */}
            {image.quantity > 0 && (
                <button
                    onClick={(e) => { e.stopPropagation(); onRemove(image.id); }}
                    className="absolute top-2 left-2 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center text-gray-700 hover:bg-red-500 hover:text-white transition-all duration-200 z-10 transform group-hover:scale-110"
                    aria-label="Remove image from order"
                >
                    <XIcon className="w-5 h-5" />
                </button>
            )}

            {/* Size Selector - Added Here */}
            <div className="absolute bottom-14 left-0 right-0 flex justify-center z-10 px-2">
                <select
                    value={image.size || '10x15'}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => onSizeChange && onSizeChange(image.id, e.target.value)}
                    className="bg-white/90 backdrop-blur-sm text-gray-800 text-xs font-medium py-1 px-2 rounded-md border border-gray-200 shadow-sm outline-none focus:ring-1 focus:ring-red-400"
                >
                    <option value="10x15">10x15 cm</option>
                    <option value="13x18">13x18 cm</option>
                    <option value="20x30">20x30 cm</option>
                </select>
            </div>

            {/* Quantity Controls */}
            <div className="absolute bottom-2 left-2 right-2 flex justify-center">
                <div className="bg-white/80 backdrop-blur-sm rounded-full p-1 flex items-center shadow-md">
                    <div className="flex items-center">
                        <button
                            onClick={(e) => { e.stopPropagation(); onQuantityChange(image.id, -1); }}
                            className="text-gray-700 hover:text-red-500 text-2xl font-light px-2 disabled:text-gray-300"
                            disabled={image.quantity === 0}
                            aria-label="Decrease quantity"
                        >
                            -
                        </button>
                        <span className="text-gray-800 font-semibold w-6 text-center">{image.quantity}</span>
                        <button
                            onClick={(e) => { e.stopPropagation(); onQuantityChange(image.id, 1); }}
                            className="text-gray-700 hover:text-red-500 text-2xl font-light px-2"
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