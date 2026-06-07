/** פרסור גודל הדפסה (למשל "10x15") ליחס רוחב/גובה */
export function parsePrintSize(sizeStr) {
    if (!sizeStr || typeof sizeStr !== 'string') {
        return { width: 10, height: 15, aspect: 10 / 15, label: '10×15 ס"מ' };
    }

    const parts = sizeStr.toLowerCase().split(/x/);
    const width = parseFloat(parts[0]) || 10;
    const height = parseFloat(parts[1]) || 15;

    return {
        width,
        height,
        aspect: width / height,
        label: `${width}×${height} ס"מ`,
    };
}

export function getPrintSizeLabel(sizeStr, availableSizes = []) {
    const found = availableSizes.find((s) => s.size === sizeStr);
    if (found?.label) return found.label;
    return parsePrintSize(sizeStr).label;
}

export const DEFAULT_CROP = { scale: 1, offsetX: 0, offsetY: 0 };

/** האם יחס התמונה שונה מיחס ההדפסה (עלול להיחתך) */
export function getCropWarning(imageWidth, imageHeight, printAspect) {
    if (!imageWidth || !imageHeight || !printAspect) return null;

    const imageAspect = imageWidth / imageHeight;
    const ratioDiff = Math.abs(imageAspect - printAspect) / printAspect;

    if (ratioDiff < 0.08) return null;

    const isSquareish = Math.abs(imageAspect - 1) < 0.12;
    const isPortrait = imageAspect < printAspect * 0.85;
    const isLandscape = imageAspect > printAspect * 1.15;

    if (isSquareish) {
        return 'תמונה ריבועית עלולה להיחתך בצדדים או למעלה/למטה — ניתן להתאים בזום.';
    }
    if (isPortrait && printAspect < 1) {
        return 'תמונה צרה עלולה להיחתך — ניתן להקטין או להזיז כדי לראות יותר מהתמונה.';
    }
    if (isLandscape && printAspect > 1) {
        return 'תמונה רחבה עלולה להיחתך — ניתן להתאים בזום.';
    }

    return 'יחס התמונה שונה מגודל ההדפסה — חלק מהתמונה עלול להיחתך. ניתן להתאים בזום.';
}

/** CSS transform לתצוגת cover עם זום וגרירה */
export function getCropTransformStyle(crop = DEFAULT_CROP, imageAspect, frameAspect) {
    const scale = Math.max(1, crop.scale ?? 1);
    const offsetX = crop.offsetX ?? 0;
    const offsetY = crop.offsetY ?? 0;

    // cover base: image must fill frame
    const coverScale =
        imageAspect > frameAspect
            ? imageAspect / frameAspect
            : frameAspect / imageAspect;

    const totalScale = coverScale * scale;
    const maxPanX = scale > 1 ? ((totalScale - 1) / totalScale) * 50 : 0;
    const maxPanY = scale > 1 ? ((totalScale - 1) / totalScale) * 50 : 0;

    return {
        transform: `translate(${offsetX * maxPanX}%, ${offsetY * maxPanY}%) scale(${totalScale})`,
        transformOrigin: 'center center',
    };
}
