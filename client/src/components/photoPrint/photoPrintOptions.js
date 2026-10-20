import { getFrameOrientation } from '../../utils/orientationMatching';

/** Base background colors; all the colors the admin defined in the editor settings and the color library are added to them */
export const BASE_BACKGROUND_COLORS = [
    '#FFFFFF',
    '#000000',
    '#F3F4F6',
    '#FEF3C7',
    '#DBEAFE',
    '#FCE7F3',
    '#D1FAE5',
];

export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

/** The frame choice saved with the photo for production */
export const buildFrameSelection = (frame, printSize, requestedOrientation) => ({
    frameId: frame._id,
    frameTitle: frame.title,
    frameImageUrl: frame.imageUrl,
    frameCategory: frame.category,
    aspectRatio: frame.aspectRatio,
    printSizeKey: frame.printSizeKey || printSize?.key || '',
    printSizeLabel: printSize?.label || '',
    frameOrientation: getFrameOrientation(frame) || requestedOrientation || null,
    requestedOrientation: requestedOrientation || null,
    isFixedOverlay: true,
    selectedAt: new Date().toISOString(),
});

/** A new caption near the bottom, with the defaults the admin set */
export const createCaption = (captionDefaults = {}) => ({
    id: `caption_${Date.now()}`,
    content: '',
    fontFamily: captionDefaults.fontFamily || 'Rubik',
    fontSize: Number(captionDefaults.fontSize) || 24,
    color: captionDefaults.color || '#FFFFFF',
    x: 0.5,
    y: 0.92,
});
