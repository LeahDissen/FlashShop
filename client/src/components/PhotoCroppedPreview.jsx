import { useEffect, useState } from 'react';
import {
    DEFAULT_CROP,
    DEFAULT_PHOTO_PRINT_SIZE,
    getCropTransformStyle,
    normalizeZoomCrop,
    resolvePrintDimensions,
} from '../utils/printSizes';

/**
 * תצוגת תמונה ביחס הדפסה (cover + זום/הזזה)
 */
const PhotoCroppedPreview = ({
    src,
    alt = '',
    size = DEFAULT_PHOTO_PRINT_SIZE,
    orientation = 'portrait',
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

    const print = resolvePrintDimensions(size, orientation);
    const imageAspect = dims.w && dims.h ? dims.w / dims.h : print.aspect;
    const zoomCrop = normalizeZoomCrop(crop);
    const transformStyle = getCropTransformStyle(zoomCrop, imageAspect, print.aspect);

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
