import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { analyzeDesignSafeZone, getDesignZoneWarningMessage, getSafeZoneInsets } from '../../../utils/safeZone';

/**
 * The print safe zone: its frame on the canvas, and a warning when the customer finishes moving an
 * element outside it or too close to the edge. The warning shows once until the design is back inside.
 */
export function useSafeZoneWarning({ elements, canvasWidth, canvasHeight, printWidthCm, printHeightCm }) {
    const [zoneWarning, setZoneWarning] = useState(null);
    const warningShownRef = useRef(false);
    // The latest values, for checks that run after a drag (outside React's render)
    const latestRef = useRef({ elements, canvasWidth, canvasHeight, printWidthCm, printHeightCm });
    latestRef.current = { elements, canvasWidth, canvasHeight, printWidthCm, printHeightCm };

    const safeZoneInsets = useMemo(
        () => getSafeZoneInsets(canvasWidth, canvasHeight, printWidthCm, printHeightCm),
        [canvasWidth, canvasHeight, printWidthCm, printHeightCm],
    );
    const designAnalysis = useMemo(
        () => analyzeDesignSafeZone(elements, canvasWidth, canvasHeight, printWidthCm, printHeightCm),
        [elements, canvasWidth, canvasHeight, printWidthCm, printHeightCm],
    );

    // Back inside the safe zone: the warning goes away and may show again next time
    useEffect(() => {
        if (!designAnalysis.hasOutside && !designAnalysis.hasNearEdge) {
            warningShownRef.current = false;
            setZoneWarning(null);
        }
    }, [designAnalysis.hasOutside, designAnalysis.hasNearEdge]);

    /** Checks the design (by default the current one) and shows the warning if needed */
    const warnIfOutsideSafeZone = useCallback((items) => {
        const latest = latestRef.current;
        const analysis = analyzeDesignSafeZone(
            items || latest.elements,
            latest.canvasWidth,
            latest.canvasHeight,
            latest.printWidthCm,
            latest.printHeightCm,
        );
        const message = getDesignZoneWarningMessage(analysis);
        if (!message || warningShownRef.current) return;
        warningShownRef.current = true;
        setZoneWarning({ message, type: analysis.hasOutside ? 'error' : 'warning' });
    }, []);

    const dismissZoneWarning = useCallback(() => setZoneWarning(null), []);

    return { safeZoneInsets, zoneWarning, warnIfOutsideSafeZone, dismissZoneWarning };
}
