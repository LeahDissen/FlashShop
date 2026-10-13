export function isGlobalFrame(el) {
    return el?.type === 'globalFrame';
}

/**
 * מסגרת "מקובעת": שכבת Overlay קבועה או קולאז׳ עם חלונות תמונה.
 * היא נשארת מעל התמונות ולא זזה. מסגרת חופשית מתנהגת כמו כל אלמנט עיצובי.
 */
export function isPinnedFrame(el) {
    return isGlobalFrame(el) && (el.isFixedOverlay !== false || el.layoutType === 'multi_dropzone');
}

/** מסדר אלמנטים: תמונות/צורות/מסגרות חופשיות למטה, מסגרת מקובעת באמצע, טקסט למעלה */
export function enforceLayerOrder(elements) {
    if (!Array.isArray(elements)) return [];

    const bottom = elements.filter((el) => el.type !== 'text' && !isPinnedFrame(el));
    const pinnedFrames = elements.filter(isPinnedFrame);
    const texts = elements.filter((el) => el.type === 'text');

    return [...bottom, ...pinnedFrames, ...texts];
}

/**
 * מעביר אלמנט לקדמה או לאחור בתוך שכבת הסדר שלו (טקסט נשאר מעל הכל, מסגרת מקובעת לא זזה).
 * @param {'front' | 'back'} direction
 */
export function moveElementToEdge(elements, elementId, direction) {
    const target = elements.find((el) => el.id === elementId);
    if (!target || isPinnedFrame(target)) return elements;

    const others = elements.filter((el) => el.id !== elementId);
    return enforceLayerOrder(direction === 'front' ? [...others, target] : [target, ...others]);
}

export function getGlobalFrameIndex(elements) {
    return elements.findIndex(isPinnedFrame);
}

export function getActiveGlobalFrame(elements) {
    return elements.find(isGlobalFrame) || null;
}

/** מוסיף אלמנט מתחת למסגרת המקובעת (אם יש), אחרת מעל שאר התמונות */
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
