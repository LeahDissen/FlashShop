/** The design frame form: its options, a frame loaded for editing, and the form turned into what the server gets */
import { normalizeDropzones } from '../../utils/dropzoneUtils';

export const ASPECT_RATIO_PRESETS = ['1:1', '4:3', '3:4', '16:9', '9:16', '3:1', '2:1'];

export const ORIENTATION_OPTIONS = [
    { value: 'any', label: 'מתאים לשניהם' },
    { value: 'landscape', label: 'לרוחב' },
    { value: 'portrait', label: 'לאורך' },
];

export const MULTI_DROPZONE = 'multi_dropzone';
export const SINGLE_OVERLAY = 'single_overlay';
const DEFAULT_CATEGORY = 'כללי';

export const EMPTY_FRAME_FORM = {
    title: '',
    imageUrl: '',
    thumbnailUrl: '',
    category: DEFAULT_CATEGORY,
    aspectRatio: '1:1',
    printSizeKey: '',
    orientation: 'any',
    isFixedOverlay: false,
    layoutType: SINGLE_OVERLAY,
    dropzones: [],
    isActive: true,
    sortOrder: 0,
};

export function orientationFromDimensions(width, height) {
    if (!(width > 0) || !(height > 0)) return 'any';
    if (width > height) return 'landscape';
    if (height > width) return 'portrait';
    return 'any';
}

const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));

/** 1200×900 → "4:3" */
export function ratioFromDimensions(width, height) {
    const w = Math.round(width);
    const h = Math.round(height);
    if (!w || !h) return '1:1';
    const divisor = gcd(w, h);
    return `${w / divisor}:${h / divisor}`;
}

export const loadImageDimensions = (url) => new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = reject;
    img.src = url;
});

/** A new photo window, in percent of the frame */
export const createEmptyZone = (index) => ({
    id: `zone_${index + 1}`,
    x: 5,
    y: 5,
    width: 40,
    height: 40,
    clipType: 'rect',
    clipPath: '',
    label: `חלון ${index + 1}`,
});

/** The text fields of a window stay strings; its position and size are numbers */
const ZONE_TEXT_FIELDS = ['label', 'id', 'clipType', 'clipPath'];
export const zoneFieldValue = (field, value) => (ZONE_TEXT_FIELDS.includes(field) ? value : Number(value));

export const frameToForm = (frame) => ({
    title: frame.title || '',
    imageUrl: frame.imageUrl || '',
    thumbnailUrl: frame.thumbnailUrl || frame.imageUrl || '',
    category: frame.category || DEFAULT_CATEGORY,
    aspectRatio: frame.aspectRatio || '1:1',
    printSizeKey: frame.printSizeKey || '',
    orientation: frame.orientation || 'any',
    isFixedOverlay: frame.isFixedOverlay !== false,
    layoutType: frame.layoutType === MULTI_DROPZONE ? MULTI_DROPZONE : SINGLE_OVERLAY,
    dropzones: normalizeDropzones(frame.dropzones || []),
    isActive: frame.isActive !== false,
    sortOrder: frame.sortOrder || 0,
});

/** @returns {{ payload: object } | { error: string }} */
export function buildFramePayload(form) {
    if (!form.title.trim() || !form.imageUrl.trim() || !form.aspectRatio.trim()) {
        return { error: 'יש למלא שם, תמונה ויחס גובה-רוחב' };
    }
    const layoutType = form.layoutType === MULTI_DROPZONE ? MULTI_DROPZONE : SINGLE_OVERLAY;
    const dropzones = layoutType === MULTI_DROPZONE ? normalizeDropzones(form.dropzones) : [];
    if (layoutType === MULTI_DROPZONE && dropzones.length === 0) {
        return { error: 'למסגרת קולאז׳ יש להגדיר לפחות חלון תמונה אחד' };
    }
    return {
        payload: {
            title: form.title.trim(),
            imageUrl: form.imageUrl.trim(),
            thumbnailUrl: (form.thumbnailUrl || form.imageUrl).trim(),
            category: form.category,
            aspectRatio: form.aspectRatio.trim(),
            printSizeKey: form.printSizeKey,
            orientation: form.orientation,
            isFixedOverlay: form.isFixedOverlay,
            layoutType,
            dropzones,
            isActive: form.isActive,
            sortOrder: Number(form.sortOrder) || 0,
        },
    };
}
