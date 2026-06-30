import { cmToCanvasPx, SAFE_ZONE_TRIM_CM } from './canvasDimensions';

export { SAFE_ZONE_TRIM_CM };

/** מרווח מינימלי מקצה אזור הבטוח לפני אזהרה (ס"מ) */
export const SAFE_ZONE_EDGE_BUFFER_CM = 0.4;

export function getSafeZoneInsets(canvasWidth, canvasHeight, widthCm, heightCm) {
    const safeWidthCm = Math.max(1, (widthCm || 0) - SAFE_ZONE_TRIM_CM);
    const safeHeightCm = Math.max(1, (heightCm || 0) - SAFE_ZONE_TRIM_CM);

    const safeWidthPx = cmToCanvasPx(safeWidthCm, canvasWidth, widthCm);
    const safeHeightPx = cmToCanvasPx(safeHeightCm, canvasHeight, heightCm);

    const marginX = Math.max(0, Math.round((canvasWidth - safeWidthPx) / 2));
    const marginY = Math.max(0, Math.round((canvasHeight - safeHeightPx) / 2));

    return {
        left: marginX,
        top: marginY,
        right: marginX,
        bottom: marginY,
    };
}

export function getSafeZoneRect(canvasWidth, canvasHeight, widthCm, heightCm) {
    const insets = getSafeZoneInsets(canvasWidth, canvasHeight, widthCm, heightCm);
    return {
        left: insets.left,
        top: insets.top,
        right: canvasWidth - insets.right,
        bottom: canvasHeight - insets.bottom,
    };
}

export function getElementAxisAlignedBounds(el) {
    if (el?.type === 'text') {
        return getTextElementVisualBounds(el);
    }

    const left = el.left ?? 0;
    const top = el.top ?? 0;
    const width = el.width ?? 0;
    const height = el.height ?? 0;
    const rotation = el.rotation ?? 0;

    if (!width || !height || !rotation) {
        return {
            left,
            top,
            right: left + width,
            bottom: top + height,
        };
    }

    const cx = left + width / 2;
    const cy = top + height / 2;
    const rad = (rotation * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    const corners = [
        { x: -width / 2, y: -height / 2 },
        { x: width / 2, y: -height / 2 },
        { x: width / 2, y: height / 2 },
        { x: -width / 2, y: height / 2 },
    ].map((point) => ({
        x: cx + point.x * cos - point.y * sin,
        y: cy + point.x * sin + point.y * cos,
    }));

    return {
        left: Math.min(...corners.map((c) => c.x)),
        top: Math.min(...corners.map((c) => c.y)),
        right: Math.max(...corners.map((c) => c.x)),
        bottom: Math.max(...corners.map((c) => c.y)),
    };
}

export function isElementOutsideSafeZone(el, safeRect) {
    return isElementOutsideRect(el, safeRect);
}

export function isElementOutsideRect(el, rect) {
    const bounds = getElementAxisAlignedBounds(el);
    return (
        bounds.left < rect.left - 0.5
        || bounds.top < rect.top - 0.5
        || bounds.right > rect.right + 0.5
        || bounds.bottom > rect.bottom + 0.5
    );
}

export function getComfortZoneRect(canvasWidth, canvasHeight, widthCm, heightCm) {
    const safeRect = getSafeZoneRect(canvasWidth, canvasHeight, widthCm, heightCm);
    const bufferX = cmToCanvasPx(SAFE_ZONE_EDGE_BUFFER_CM, canvasWidth, widthCm);
    const bufferY = cmToCanvasPx(SAFE_ZONE_EDGE_BUFFER_CM, canvasHeight, heightCm);
    return {
        left: safeRect.left + bufferX,
        top: safeRect.top + bufferY,
        right: safeRect.right - bufferX,
        bottom: safeRect.bottom - bufferY,
    };
}

/** גבולות משוערים לטקסט בפועל — לא לכל תיבת הטקסט הריקה */
export function getTextElementVisualBounds(el) {
    const boxLeft = el.left ?? 0;
    const boxTop = el.top ?? 0;
    const boxWidth = el.width ?? 0;
    const boxHeight = el.height ?? 0;
    const content = String(el.content ?? '').trim();

    if (!boxWidth || !boxHeight) {
        return { left: boxLeft, top: boxTop, right: boxLeft + boxWidth, bottom: boxTop + boxHeight };
    }

    if (!content) {
        return { left: boxLeft, top: boxTop, right: boxLeft + boxWidth, bottom: boxTop + boxHeight };
    }

    const fontSize = Number(el.fontSize) > 0 ? Number(el.fontSize) : 16;
    const lines = content.split('\n');
    const longestLine = lines.reduce((max, line) => Math.max(max, line.length), 0);
    const estimatedWidth = Math.min(boxWidth, Math.max(fontSize, longestLine * fontSize * 0.58 + 12));
    const estimatedHeight = Math.min(boxHeight, Math.max(fontSize * 1.2, lines.length * fontSize * 1.35 + 8));

    const align = el.textAlign || 'center';
    let textLeft = boxLeft;
    if (align === 'center') {
        textLeft = boxLeft + (boxWidth - estimatedWidth) / 2;
    } else if (align === 'right') {
        textLeft = boxLeft + boxWidth - estimatedWidth;
    }

    const textTop = boxTop + (boxHeight - estimatedHeight) / 2;

    return {
        left: textLeft,
        top: textTop,
        right: textLeft + estimatedWidth,
        bottom: textTop + estimatedHeight,
    };
}

function analyzeElementGroup(elements, safeRect, comfortRect) {
    let hasOutside = false;
    let hasNearEdge = false;

    elements.forEach((el) => {
        if (isElementOutsideRect(el, safeRect)) {
            hasOutside = true;
        } else if (isElementOutsideRect(el, comfortRect)) {
            hasNearEdge = true;
        }
    });

    return { hasOutside, hasNearEdge };
}

export function analyzeDesignSafeZone(elements, canvasWidth, canvasHeight, widthCm, heightCm) {
    if (!elements?.length) {
        return {
            hasOutside: false,
            hasNearEdge: false,
            hasTextOutside: false,
            hasTextNearEdge: false,
            hasDesignOutside: false,
            hasDesignNearEdge: false,
        };
    }

    const safeRect = getSafeZoneRect(canvasWidth, canvasHeight, widthCm, heightCm);
    const comfortRect = getComfortZoneRect(canvasWidth, canvasHeight, widthCm, heightCm);

    const textElements = elements.filter((el) => el.type === 'text');
    const designElements = elements.filter((el) => el.type !== 'text');

    const textAnalysis = analyzeElementGroup(textElements, safeRect, comfortRect);
    const designAnalysis = analyzeElementGroup(designElements, safeRect, comfortRect);

    return {
        hasOutside: textAnalysis.hasOutside || designAnalysis.hasOutside,
        hasNearEdge: textAnalysis.hasNearEdge || designAnalysis.hasNearEdge,
        hasTextOutside: textAnalysis.hasOutside,
        hasTextNearEdge: textAnalysis.hasNearEdge,
        hasDesignOutside: designAnalysis.hasOutside,
        hasDesignNearEdge: designAnalysis.hasNearEdge,
    };
}

export function getDesignZoneWarningMessage(analysis) {
    if (analysis.hasOutside) {
        if (analysis.hasTextOutside && analysis.hasDesignOutside) {
            return 'שימו לב: חלק מהעיצוב ומהכיתוב יוצאים ממשטח הבטוח (הקו המקווקו) ועלולים להיחתך בהדפסה.';
        }
        if (analysis.hasTextOutside) {
            return 'שימו לב: הכיתוב יוצא ממשטח הבטוח (הקו המקווקו) ועלול להיחתך בהדפסה.';
        }
        return 'שימו לב: חלק מהעיצוב שלכם יוצא ממשטח הבטוח (הקו המקווקו) ועלול להיחתך בהדפסה.';
    }
    if (analysis.hasTextNearEdge) {
        return 'שימו לב: הכיתוב קרוב מדי לקצה משטח הבטוח. מומלץ להזיז אותו יותר למרכז.';
    }
    if (analysis.hasDesignNearEdge) {
        return 'שימו לב: חלק מהעיצוב קרוב מדי לקצה משטח הבטוח. מומלץ להזיז אותו יותר למרכז.';
    }
    return null;
}

export function hasElementsOutsideSafeZone(elements, canvasWidth, canvasHeight, widthCm, heightCm) {
    return analyzeDesignSafeZone(elements, canvasWidth, canvasHeight, widthCm, heightCm).hasOutside;
}
