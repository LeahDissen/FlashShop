import { useEffect, useState } from 'react';
import { DEFAULT_CROP, getCropTransformStyle, parsePrintSize } from '../utils/printSizes';

/**
 * תצוגת תמונה ביחס הדפסה (cover + crop/zoom)
 */
const PhotoCroppedPreview = ({
    src,
    alt = '',
    size = '10x15',
    crop = DEFAULT_CROP,
    className = '',
    frameClassName = '',
}) => {
    const [dims, setDims] = useState({ w: 0, h: 0 });

    useEffect(() => {
        if (!src) return;
        const img = new Image();
        img.onload = () => setDims({ w: img.naturalWidth, h: img.naturalHeight });
        img.src = src;
    }, [src]);

    const print = parsePrintSize(size);
    const imageAspect = dims.w && dims.h ? dims.w / dims.h : print.aspect;
    const transformStyle = getCropTransformStyle(crop, imageAspect, print.aspect);

    return (
        <div
            className={`relative overflow-hidden bg-gray-100 ${frameClassName}`}
            style={{ aspectRatio: `${print.width} / ${print.height}` }}
        >
            {src && (
                <img
                    src={src}
                    alt={alt}
                    className={`absolute inset-0 w-full h-full max-w-none ${className}`}
                    style={{ objectFit: 'cover', ...transformStyle }}
                    draggable={false}
                />
            )}
        </div>
    );
};

export default PhotoCroppedPreview;
