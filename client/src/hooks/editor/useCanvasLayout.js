import { useEffect, useMemo, useState } from 'react';
import { formatPrintSizeLabel, getCanvasDimensions } from '../../utils/canvasDimensions';

/**
 * The canvas size: the product's print size, shaped by the chosen frame's aspect ratio and by the
 * customer turning the canvas (products that allow it).
 */
export function useCanvasLayout(selectedProduct) {
    const [activeFrameAspectRatio, setActiveFrameAspectRatio] = useState(null);
    const [orientationFlipped, setOrientationFlipped] = useState(false);

    const canvasDimensions = useMemo(
        () => getCanvasDimensions(selectedProduct, activeFrameAspectRatio, orientationFlipped),
        [selectedProduct, activeFrameAspectRatio, orientationFlipped],
    );
    const printSizeLabel = formatPrintSizeLabel(canvasDimensions.widthCm, canvasDimensions.heightCm);

    // Another product opens in its own orientation
    useEffect(() => {
        setOrientationFlipped(false);
    }, [selectedProduct?._id, selectedProduct?.id]);

    return {
        activeFrameAspectRatio,
        setActiveFrameAspectRatio,
        orientationFlipped,
        setOrientationFlipped,
        canvasDimensions,
        printSizeLabel,
    };
}
