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

export function isDropzoneImage(el) {
    return el?.type === 'image' && Boolean(el.dropzoneId);
}

export function removeDropzoneImages(elements) {
    if (!Array.isArray(elements)) return [];
    return elements.filter((el) => !isDropzoneImage(el));
}

export function getDropzoneImageForSlot(elements, dropzoneId) {
    if (!Array.isArray(elements) || !dropzoneId) return null;
    return elements.find((el) => isDropzoneImage(el) && el.dropzoneId === dropzoneId) || null;
}

/** מחליף/מוסיף תמונה לחלון קולאז׳ (שומר תמונה אחת לכל dropzoneId) */
export function replaceDropzoneImage(elements, dropzoneId, newImageElement) {
    if (!Array.isArray(elements) || !dropzoneId || !newImageElement) return elements || [];
    const withoutSlot = elements.filter(
        (el) => !(isDropzoneImage(el) && el.dropzoneId === dropzoneId),
    );
    return insertBelowGlobalFrame(withoutSlot, {
        ...newImageElement,
        dropzoneId,
        type: 'image',
    });
}

/** מסיר קישור dropzone מתמונות שלא אמורות להיות בקולאז׳ (מסגרת רגילה / הסרה) */
export function stripLegacyDropzoneFields(elements) {
    if (!Array.isArray(elements)) return [];
    return elements.map((el) => {
        if (!el?.dropzoneId) return el;
        const { dropzoneId: _removedDropzoneId, ...rest } = el;
        return rest;
    });
}

/** מחלק אלמנטים לשכבות רינדור: תוכן חופשי, תמונות קולאז׳, מסגרת, טקסט */
export function partitionElementsByLayer(elements) {
    if (!Array.isArray(elements)) {
        return { bottom: [], dropzoneImages: [], frames: [], texts: [] };
    }

    const nonTextNonFrame = elements.filter((el) => el.type !== 'text' && !isGlobalFrame(el));

    return {
        bottom: nonTextNonFrame.filter((el) => !isDropzoneImage(el)),
        dropzoneImages: nonTextNonFrame.filter(isDropzoneImage),
        frames: elements.filter(isGlobalFrame),
        texts: elements.filter((el) => el.type === 'text'),
    };
}
