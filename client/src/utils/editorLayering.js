export function isGlobalFrame(el) {
    return el?.type === 'globalFrame';
}

/** מסדר אלמנטים: תמונות/צורות למטה, מסגרת גלובלית באמצע, טקסט למעלה */
export function enforceLayerOrder(elements) {
    if (!Array.isArray(elements)) return [];

    const bottom = elements.filter((el) => el.type !== 'text' && !isGlobalFrame(el));
    const frames = elements.filter(isGlobalFrame);
    const texts = elements.filter((el) => el.type === 'text');

    return [...bottom, ...frames, ...texts];
}

export function getGlobalFrameIndex(elements) {
    return elements.findIndex(isGlobalFrame);
}

export function getActiveGlobalFrame(elements) {
    return elements.find(isGlobalFrame) || null;
}

/** מוסיף אלמנט מתחת למסגרת הגלובלית */
export function insertBelowGlobalFrame(elements, newElement) {
    const frameIdx = getGlobalFrameIndex(elements);
    if (frameIdx === -1) {
        const firstTextIdx = elements.findIndex((el) => el.type === 'text');
        if (firstTextIdx === -1) return [...elements, newElement];
        const next = [...elements];
        next.splice(firstTextIdx, 0, newElement);
        return next;
    }
    const next = [...elements];
    next.splice(frameIdx, 0, newElement);
    return next;
}

export function extractFrameAspectRatio(elements) {
    const frame = elements.find(isGlobalFrame);
    return frame?.aspectRatio || null;
}

export function removeGlobalFrames(elements) {
    return elements.filter((el) => !isGlobalFrame(el));
}

/** מסיר שדות dropzone ישנים מתמונות (תאימות לאחור) */
export function stripLegacyDropzoneFields(elements) {
    if (!Array.isArray(elements)) return [];
    return elements.map((el) => {
        if (!el?.dropzoneId) return el;
        const { dropzoneId, ...rest } = el;
        return rest;
    });
}

/** מחלק אלמנטים לשכבות רינדור: תוכן תחתון, מסגרת, טקסט */
export function partitionElementsByLayer(elements) {
    if (!Array.isArray(elements)) {
        return { bottom: [], frames: [], texts: [] };
    }

    return {
        bottom: elements.filter((el) => el.type !== 'text' && !isGlobalFrame(el)),
        frames: elements.filter(isGlobalFrame),
        texts: elements.filter((el) => el.type === 'text'),
    };
}
