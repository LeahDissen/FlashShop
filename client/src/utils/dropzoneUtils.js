/** ממיר אחוזים (0–100) לפיקסלים ביחס למסגרת (או לקנבס) */
export function resolveDropzones(dropzones, frameWidth, frameHeight, frameLeft = 0, frameTop = 0) {
    if (!Array.isArray(dropzones) || !frameWidth || !frameHeight) return [];

    return dropzones.map((zone) => ({
        id: zone.id,
        left: Math.round(frameLeft + (Number(zone.x) / 100) * frameWidth),
        top: Math.round(frameTop + (Number(zone.y) / 100) * frameHeight),
        width: Math.max(1, Math.round((Number(zone.width) / 100) * frameWidth)),
        height: Math.max(1, Math.round((Number(zone.height) / 100) * frameHeight)),
        clipType: zone.clipType || 'rect',
        clipPath: zone.clipPath || null,
        label: zone.label || zone.id,
    }));
}

/** התאמת תמונה לחלון (cover) – ממלא את האזור וחותך עודפים */
export function fitImageToDropzone(naturalWidth, naturalHeight, zone) {
    const nw = Number(naturalWidth) || 1;
    const nh = Number(naturalHeight) || 1;
    const zoneRatio = zone.width / zone.height;
    const imgRatio = nw / nh;

    let width;
    let height;
    if (imgRatio > zoneRatio) {
        height = zone.height;
        width = height * imgRatio;
    } else {
        width = zone.width;
        height = width / imgRatio;
    }

    return {
        width: Math.round(width),
        height: Math.round(height),
        left: Math.round(zone.left + (zone.width - width) / 2),
        top: Math.round(zone.top + (zone.height - height) / 2),
    };
}

export function isMultiDropzoneFrame(frameOrElement) {
    return frameOrElement?.layoutType === 'multi_dropzone'
        && Array.isArray(frameOrElement?.dropzones)
        && frameOrElement.dropzones.length > 0;
}

export function getClipStyle(zone) {
    if (!zone) return undefined;
    if (zone.clipType === 'circle') return { borderRadius: '50%' };
    if (zone.clipType === 'path' && zone.clipPath) return { clipPath: zone.clipPath };
    return undefined;
}

/** רשת קולאז' אחידה באחוזים */
function buildGridZones(cols, rows, { margin = 4, gap = 2, idPrefix = 'zone' } = {}) {
    const zones = [];
    const usableW = 100 - margin * 2 - gap * (cols - 1);
    const usableH = 100 - margin * 2 - gap * (rows - 1);
    const cellW = usableW / cols;
    const cellH = usableH / rows;

    for (let r = 0; r < rows; r += 1) {
        for (let c = 0; c < cols; c += 1) {
            const index = r * cols + c + 1;
            zones.push({
                id: `${idPrefix}_${index}`,
                x: Number((margin + c * (cellW + gap)).toFixed(2)),
                y: Number((margin + r * (cellH + gap)).toFixed(2)),
                width: Number(cellW.toFixed(2)),
                height: Number(cellH.toFixed(2)),
                clipType: 'rect',
                clipPath: '',
                label: `חלון ${index}`,
            });
        }
    }
    return zones;
}

/** פריסות מוכנות לקולאז' – האדמין יכול לבחור ואז לכוון */
export const DROPZONE_PRESETS = [
    {
        id: 'grid_2x3',
        label: 'קולאז׳ 2×3 (6 תמונות)',
        dropzones: buildGridZones(3, 2, { margin: 5, gap: 2.5 }),
    },
    {
        id: 'grid_2x2',
        label: 'קולאז׳ 2×2 (4 תמונות)',
        dropzones: buildGridZones(2, 2, { margin: 6, gap: 3 }),
    },
    {
        id: 'grid_1x2',
        label: 'שתי תמונות זו לצד זו',
        dropzones: buildGridZones(2, 1, { margin: 6, gap: 3 }),
    },
    {
        id: 'grid_3x3',
        label: 'קולאז׳ 3×3 (9 תמונות)',
        dropzones: buildGridZones(3, 3, { margin: 4, gap: 2 }),
    },
];

export function normalizeDropzones(dropzones) {
    if (!Array.isArray(dropzones)) return [];
    return dropzones
        .map((zone, index) => ({
            id: String(zone.id || `zone_${index + 1}`).trim(),
            x: Math.min(100, Math.max(0, Number(zone.x) || 0)),
            y: Math.min(100, Math.max(0, Number(zone.y) || 0)),
            width: Math.min(100, Math.max(1, Number(zone.width) || 10)),
            height: Math.min(100, Math.max(1, Number(zone.height) || 10)),
            clipType: zone.clipType || 'rect',
            clipPath: zone.clipPath || '',
            label: zone.label || `חלון ${index + 1}`,
        }))
        .filter((zone) => zone.id);
}
