import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * A photo the customer uploaded on the product page before choosing "עיצוב עצמי" is placed on the
 * canvas, fitted inside it and behind the other elements, so she designs around it instead of
 * uploading it again.
 */
export function useInitialImage({ selectedProduct, canvasDimensions, addImageElement }) {
    const location = useLocation();
    const navigate = useNavigate();
    const initialImageRef = useRef(location.state?.initialImage || null);
    const [pendingImage, setPendingImage] = useState(null);

    // Measured once the product's canvas size is known
    useEffect(() => {
        const src = initialImageRef.current;
        if (!src || !selectedProduct || !canvasDimensions.width || !canvasDimensions.height) return;
        initialImageRef.current = null;
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            const scale = Math.min(canvasDimensions.width / img.naturalWidth, canvasDimensions.height / img.naturalHeight);
            setPendingImage({
                src,
                width: img.naturalWidth * scale,
                height: img.naturalHeight * scale,
                naturalWidth: img.naturalWidth,
                naturalHeight: img.naturalHeight,
            });
        };
        img.src = src;
    }, [selectedProduct, canvasDimensions.width, canvasDimensions.height]);

    // Added in its own render, after the draft was restored, so it is not overwritten
    useEffect(() => {
        if (!pendingImage) return;
        const { src, width, height, naturalWidth, naturalHeight } = pendingImage;
        setPendingImage(null);
        addImageElement(src, width, height, naturalWidth, naturalHeight, { atBack: true });
        // Off the history entry, so a refresh (which restores the draft) does not add it a second time
        navigate(location.pathname, { replace: true, state: { ...location.state, initialImage: undefined } });
    }, [pendingImage, addImageElement, navigate, location.pathname, location.state]);
}
