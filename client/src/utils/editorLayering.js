export function isGlobalFrame(el) {
    return el?.type === 'globalFrame';
}

/**
 * A "pinned" frame: a fixed overlay layer or a collage with photo windows.
 * It stays above the photos and does not move. A free frame behaves like any other design element.
 */
export function isPinnedFrame(el) {
    return isGlobalFrame(el) && (el.isFixedOverlay !== false || el.layoutType === 'multi_dropzone');
}

/** Orders elements: photos/shapes/free frames at the bottom, the pinned frame in the middle, text on top */
export function enforceLayerOrder(elements) {
    if (!Array.isArray(elements)) return [];

    const bottom = elements.filter((el) => el.type !== 'text' && !isPinnedFrame(el));
    const pinnedFrames = elements.filter(isPinnedFrame);
    const texts = elements.filter((el) => el.type === 'text');

    return [...bottom, ...pinnedFrames, ...texts];
}

/**
 * Moves an element to the front or back within its own layer (text stays above everything, a pinned frame does not move).
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

/** Adds an element below the pinned frame (if any), otherwise above the other photos */
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

/** Replaces/adds a photo in a collage window (keeps one photo per dropzoneId) */
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

/** Removes the dropzone link from photos that should not be in the collage (regular frame / removal) */
export function stripLegacyDropzoneFields(elements) {
    if (!Array.isArray(elements)) return [];
    return elements.map((el) => {
        if (!el?.dropzoneId) return el;
        const { dropzoneId: _removedDropzoneId, ...rest } = el;
        return rest;
    });
}

/** Splits elements into render layers: free content, collage photos, frame, text */
export function partitionElementsByLayer(elements) {
    if (!Array.isArray(elements)) {
        return { bottom: [], dropzoneImages: [], frames: [], texts: [] };
    }

    // A free frame is drawn together with the photos (by layer order and with rotation); only a pinned frame is in the dedicated layer
    const nonTextNonFrame = elements.filter((el) => el.type !== 'text' && !isPinnedFrame(el));

    return {
        bottom: nonTextNonFrame.filter((el) => !isDropzoneImage(el)),
        dropzoneImages: nonTextNonFrame.filter(isDropzoneImage),
        frames: elements.filter(isPinnedFrame),
        texts: elements.filter((el) => el.type === 'text'),
    };
}
