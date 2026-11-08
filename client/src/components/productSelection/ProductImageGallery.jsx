import { useState } from 'react';
import { optimizeImageUrl } from '../../utils/imageUrl';

const MAIN_SIZE_PX = 448;
const THUMB_SIZE_PX = 128;

/** The product's main photo, with the extra photos as thumbnails underneath; a thumbnail shows that photo large */
export default function ProductImageGallery({ product }) {
    const images = [...new Set([product.image, ...(product.gallery || [])].filter(Boolean))];
    const [selected, setSelected] = useState(0);
    const current = images[Math.min(selected, images.length - 1)];
    if (!current) return null;

    return (
        <div className="w-full md:w-56 shrink-0 space-y-2">
            <div className="p-1 rounded-lg bg-[#fff5f4] border border-[#f2665e]/20">
                <img
                    src={optimizeImageUrl(current, { width: MAIN_SIZE_PX })}
                    alt={product.name}
                    className="w-full aspect-square max-h-72 md:max-h-none object-contain rounded-md bg-white"
                />
            </div>
            {images.length > 1 && (
                <div className="flex flex-wrap gap-1.5 justify-center md:justify-start">
                    {images.map((url, index) => (
                        <button
                            key={url}
                            type="button"
                            onClick={() => setSelected(index)}
                            aria-label={`תמונה ${index + 1}`}
                            aria-pressed={index === selected}
                            className={`w-12 h-12 rounded-md overflow-hidden border-2 bg-white ${index === selected ? 'border-[#f2665e]' : 'border-transparent hover:border-[#f2665e]/40'}`}
                        >
                            <img src={optimizeImageUrl(url, { width: THUMB_SIZE_PX })} alt="" className="w-full h-full object-cover" loading="lazy" />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
