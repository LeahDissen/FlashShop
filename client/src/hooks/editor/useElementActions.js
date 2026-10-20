import { useCallback, useState } from 'react';
import { centerPosition, createCaptionTextElement, createDefaultTextElement } from '../../utils/canvasDimensions';
import { fitImageToDropzone, isMultiDropzoneFrame, resolveDropzones } from '../../utils/dropzoneUtils';
import {
    enforceLayerOrder,
    getActiveGlobalFrame,
    getDropzoneImageForSlot,
    insertBelowGlobalFrame,
    isDropzoneImage,
    isGlobalFrame,
    moveElementToEdge,
    replaceDropzoneImage,
} from '../../utils/editorLayering';

const SHAPE_SIZE = 100;
const DEFAULT_SHAPE_FILL = '#3B82F6';
const DUPLICATE_OFFSET = 20;

/** A photo element with neutral filters */
const createImageElement = ({ id, src, width, height, top, left, naturalWidth, naturalHeight, ...extra }) => ({
    id,
    type: 'image',
    ...extra,
    src,
    width,
    height,
    top,
    left,
    opacity: 1,
    rotation: 0,
    naturalWidth,
    naturalHeight,
    scaleX: 1,
    scaleY: 1,
    brightness: 100,
    contrast: 100,
    grayscale: 0,
    sepia: 0,
    blur: 0,
});

const touchesGeometry = (props) => ['left', 'top', 'width', 'height'].some((key) => props[key] !== undefined);

/** Moving or resizing a collage frame: its photos move with it, or refit their windows when its size changed */
function moveFrameWithPhotos(elements, frame, newProps) {
    const nextFrame = { ...frame, ...newProps };
    const dx = (nextFrame.left ?? 0) - (frame.left ?? 0);
    const dy = (nextFrame.top ?? 0) - (frame.top ?? 0);
    const sizeChanged = (newProps.width !== undefined && newProps.width !== frame.width)
        || (newProps.height !== undefined && newProps.height !== frame.height);

    return elements.map((el) => {
        if (el.id === frame.id) return nextFrame;
        if (!isDropzoneImage(el)) return el;

        if (sizeChanged && isMultiDropzoneFrame(nextFrame)) {
            const zones = resolveDropzones(nextFrame.dropzones, nextFrame.width, nextFrame.height, nextFrame.left ?? 0, nextFrame.top ?? 0);
            const zone = zones.find((z) => z.id === el.dropzoneId);
            return zone ? { ...el, ...fitImageToDropzone(el.naturalWidth, el.naturalHeight, zone) } : el;
        }
        return dx || dy ? { ...el, left: (el.left ?? 0) + dx, top: (el.top ?? 0) + dy } : el;
    });
}

/** The cropped image keeps its longer side and takes the crop's proportions */
function applyCrop(element, croppedPx) {
    const ratio = croppedPx.width / croppedPx.height;
    const { width, height } = element;
    return width > height
        ? { ...element, crop: croppedPx, width, height: width / ratio }
        : { ...element, crop: croppedPx, width: height * ratio, height };
}

/**
 * Everything the customer does to the elements: adding text, captions, photos and shapes,
 * editing, duplicating, locking, layering, cropping and deleting.
 */
export function useElementActions({
    elements,
    setElements,
    commit,
    selectedElementId,
    setSelectedElementId,
    canvasDimensions,
    captionDefaults,
    rememberUploadedImage,
    forgetUploadedImage,
    detectOrientationMismatch,
    removeGlobalFrame,
}) {
    const [croppingElementId, setCroppingElementId] = useState(null);

    const addAndSelect = useCallback((newElements, newElementId) => {
        commit(newElements);
        setSelectedElementId(newElementId);
    }, [commit, setSelectedElementId]);

    const addTextElement = useCallback(() => {
        const newElement = { ...createDefaultTextElement(canvasDimensions), id: `text_${Date.now()}` };
        addAndSelect(enforceLayerOrder([...elements, newElement]), newElement.id);
    }, [elements, canvasDimensions, addAndSelect]);

    /** A photo caption with the defaults the admin set */
    const addCaptionElement = useCallback(() => {
        const newElement = createCaptionTextElement(canvasDimensions, captionDefaults);
        addAndSelect(enforceLayerOrder([...elements, newElement]), newElement.id);
    }, [elements, canvasDimensions, captionDefaults, addAndSelect]);

    /** atBack: a base photo goes under the existing elements (e.g. the default text) instead of covering them */
    const addImageElement = useCallback((src, width, height, naturalWidth, naturalHeight, { atBack = false } = {}) => {
        const { left, top } = centerPosition(width, height, canvasDimensions.width, canvasDimensions.height);
        const newElement = createImageElement({ id: `image_${Date.now()}`, src, width, height, top, left, naturalWidth, naturalHeight });
        const inserted = insertBelowGlobalFrame(elements, newElement);
        addAndSelect(enforceLayerOrder(atBack ? moveElementToEdge(inserted, newElement.id, 'back') : inserted), newElement.id);
        rememberUploadedImage(src);
        detectOrientationMismatch(newElement.id, naturalWidth, naturalHeight);
    }, [elements, canvasDimensions, addAndSelect, rememberUploadedImage, detectOrientationMismatch]);

    /** A photo placed in a collage window, fitted to it (replaces the window's previous photo) */
    const addImageToDropzone = useCallback((dropzoneId, src, naturalWidth, naturalHeight) => {
        const frame = getActiveGlobalFrame(elements);
        if (!frame || !isMultiDropzoneFrame(frame) || !dropzoneId) return;

        const zones = resolveDropzones(
            frame.dropzones,
            frame.width || canvasDimensions.width,
            frame.height || canvasDimensions.height,
            frame.left ?? 0,
            frame.top ?? 0,
        );
        const zone = zones.find((z) => z.id === dropzoneId);
        if (!zone) return;

        const newElement = createImageElement({
            id: `image_dz_${dropzoneId}_${Date.now()}`,
            dropzoneId,
            src,
            ...fitImageToDropzone(naturalWidth, naturalHeight, zone),
            naturalWidth,
            naturalHeight,
            locked: false,
        });
        addAndSelect(enforceLayerOrder(replaceDropzoneImage(elements, dropzoneId, newElement)), newElement.id);
        rememberUploadedImage(src);
    }, [elements, canvasDimensions, addAndSelect, rememberUploadedImage]);

    const clearDropzoneImage = useCallback((dropzoneId) => {
        if (!dropzoneId) return;
        const existing = getDropzoneImageForSlot(elements, dropzoneId);
        if (!existing) return;
        commit(enforceLayerOrder(elements.filter((el) => !(isDropzoneImage(el) && el.dropzoneId === dropzoneId))));
        if (selectedElementId === existing.id) setSelectedElementId(null);
    }, [elements, selectedElementId, commit, setSelectedElementId]);

    const addShapeElement = useCallback((svgContent) => {
        const { left, top } = centerPosition(SHAPE_SIZE, SHAPE_SIZE, canvasDimensions.width, canvasDimensions.height);
        const newElement = {
            id: `shape_${Date.now()}`,
            type: 'shape',
            svgContent,
            fill: DEFAULT_SHAPE_FILL,
            width: SHAPE_SIZE,
            height: SHAPE_SIZE,
            top,
            left,
            opacity: 1,
            rotation: 0,
            scaleX: 1,
            scaleY: 1,
        };
        addAndSelect(enforceLayerOrder(insertBelowGlobalFrame(elements, newElement)), newElement.id);
    }, [elements, canvasDimensions, addAndSelect]);

    /** Live edits (dragging, resizing, text and color changes) – without an undo step */
    const updateElement = useCallback((id, newProps) => {
        setElements((prev) => {
            const target = prev.find((el) => el.id === id);
            if (!target) return prev;
            if (isGlobalFrame(target) && touchesGeometry(newProps)) return moveFrameWithPhotos(prev, target, newProps);
            return prev.map((el) => (el.id === id ? { ...el, ...newProps } : el));
        });
    }, [setElements]);

    const updateSelectedElement = useCallback((props) => {
        if (selectedElementId) updateElement(selectedElementId, props);
    }, [selectedElementId, updateElement]);

    const deleteElement = useCallback(() => {
        if (!selectedElementId) return;
        const target = elements.find((el) => el.id === selectedElementId);
        if (!target) return;
        if (isGlobalFrame(target)) {
            removeGlobalFrame();
            return;
        }
        commit(elements.filter((el) => el.id !== selectedElementId));
        setSelectedElementId(null);
    }, [elements, selectedElementId, commit, setSelectedElementId, removeGlobalFrame]);

    const duplicateElement = useCallback(() => {
        const original = elements.find((el) => el.id === selectedElementId);
        // The frame and locked elements are not duplicated, nor collage photos (one window per photo)
        if (!original || original.locked || isGlobalFrame(original) || isDropzoneImage(original)) return;
        const newElement = {
            ...original,
            id: `${original.type}_${Date.now()}`,
            top: original.top + DUPLICATE_OFFSET,
            left: original.left + DUPLICATE_OFFSET,
            locked: false,
        };
        addAndSelect([...elements, newElement], newElement.id);
    }, [elements, selectedElementId, addAndSelect]);

    const toggleLockElement = useCallback(() => {
        if (!selectedElementId) return;
        commit(elements.map((el) => (el.id === selectedElementId ? { ...el, locked: !el.locked } : el)));
    }, [elements, selectedElementId, commit]);

    const bringToFront = useCallback(() => {
        if (selectedElementId) commit(moveElementToEdge(elements, selectedElementId, 'front'));
    }, [elements, selectedElementId, commit]);

    const sendToBack = useCallback(() => {
        if (selectedElementId) commit(moveElementToEdge(elements, selectedElementId, 'back'));
    }, [elements, selectedElementId, commit]);

    /** Removes an uploaded photo from the list and from the design */
    const deleteUploadedImage = useCallback((srcToDelete) => {
        forgetUploadedImage(srcToDelete);
        const remaining = elements.filter((el) => !(el.type === 'image' && el.src === srcToDelete));
        if (remaining.length !== elements.length) commit(remaining);
        if (selectedElementId && !remaining.some((el) => el.id === selectedElementId)) setSelectedElementId(null);
    }, [elements, selectedElementId, commit, forgetUploadedImage, setSelectedElementId]);

    const startCrop = useCallback(() => {
        if (selectedElementId) setCroppingElementId(selectedElementId);
    }, [selectedElementId]);

    const saveCrop = useCallback((elementId, croppedPx) => {
        commit(elements.map((el) => (el.id === elementId && el.type === 'image' ? applyCrop(el, croppedPx) : el)));
        setCroppingElementId(null);
    }, [elements, commit]);

    const cancelCrop = useCallback(() => setCroppingElementId(null), []);

    return {
        addTextElement,
        addCaptionElement,
        addImageElement,
        addImageToDropzone,
        clearDropzoneImage,
        addShapeElement,
        updateElement,
        updateSelectedElement,
        deleteElement,
        duplicateElement,
        toggleLockElement,
        bringToFront,
        sendToBack,
        deleteUploadedImage,
        croppingElementId,
        startCrop,
        saveCrop,
        cancelCrop,
    };
}
