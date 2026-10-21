import { useCallback, useEffect, useRef, useState } from 'react';

/** A new crop starts with a 5% margin on every side */
const DEFAULT_CROP = { unit: '%', x: 5, y: 5, width: 90, height: 90 };

/**
 * Cropping a photo on the canvas with react-image-crop. The crop is shown in screen pixels and saved
 * in the photo's natural pixels.
 */
export function useImageCrop({ elements, croppingElementId, onSaveCrop, onCancelCrop }) {
    const [crop, setCrop] = useState();
    const [completedCrop, setCompletedCrop] = useState();
    const cropImageRef = useRef(null);

    useEffect(() => {
        if (!croppingElementId) {
            setCrop(undefined);
            setCompletedCrop(undefined);
        }
    }, [croppingElementId]);

    /** Shows the photo's current crop (or the default) once the image is on screen */
    const handleCropImageLoad = useCallback((event) => {
        const { width, height } = event.currentTarget;
        const element = elements.find((el) => el.id === croppingElementId);
        if (!element || element.type !== 'image') {
            onCancelCrop();
            return;
        }
        if (element.crop && element.naturalWidth && element.naturalHeight) {
            const current = element.crop;
            setCrop({
                unit: 'px',
                x: (current.x / element.naturalWidth) * width,
                y: (current.y / element.naturalHeight) * height,
                width: (current.width / element.naturalWidth) * width,
                height: (current.height / element.naturalHeight) * height,
            });
        } else {
            setCrop({ ...DEFAULT_CROP });
        }
    }, [elements, croppingElementId, onCancelCrop]);

    const saveCurrentCrop = useCallback((elementId) => {
        const image = cropImageRef.current;
        if (!completedCrop || !image || completedCrop.width === 0 || completedCrop.height === 0) {
            onCancelCrop();
            return;
        }
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;
        onSaveCrop(elementId, {
            x: completedCrop.x * scaleX,
            y: completedCrop.y * scaleY,
            width: completedCrop.width * scaleX,
            height: completedCrop.height * scaleY,
            unit: 'px',
        });
    }, [completedCrop, onSaveCrop, onCancelCrop]);

    return { crop, setCrop, setCompletedCrop, cropImageRef, handleCropImageLoad, saveCurrentCrop };
}
