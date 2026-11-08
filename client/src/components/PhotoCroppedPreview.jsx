import { DEFAULT_PHOTO_PRINT_SIZE, resolvePrintDimensions } from '../utils/printSizes';

/**
 * Photo preview at the print ratio, exactly as it prints: the whole photo on white, with white margins
 * where its proportions differ from the print (the print file is made the same way, see paddedPrintUrl).
 * A photo adjusted in the print editor is already rendered at the print ratio, so it fills the frame.
 */
const PhotoCroppedPreview = ({
    src,
    alt = '',
    size = DEFAULT_PHOTO_PRINT_SIZE,
    orientation = 'portrait',
    className = '',
    frameClassName = '',
}) => {
    const print = resolvePrintDimensions(size, orientation);

    return (
        <div
            className={`relative overflow-hidden bg-white ${frameClassName}`}
            style={{ aspectRatio: `${print.width} / ${print.height}` }}
        >
            {src && (
                <img
                    src={src}
                    alt={alt}
                    className={`absolute inset-0 w-full h-full max-w-none object-contain ${className}`}
                    draggable={false}
                />
            )}
        </div>
    );
};

export default PhotoCroppedPreview;
