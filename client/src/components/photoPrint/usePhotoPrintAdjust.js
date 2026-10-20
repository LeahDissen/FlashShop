import { useEffect, useMemo, useRef, useState } from 'react';
import { getDesignFrames } from '../../api/designFrames';
import { prepareFrameImageSrc } from '../../utils/frameImageProcessing';
import { getPrintCropBlob } from '../../utils/cropImage';
import {
    DEFAULT_CROP,
    DEFAULT_PHOTO_PRINT_SIZE,
    getCompactPrintSizeLabel,
    getCropWarning,
    getDefaultOrientation,
    getImageDimensions,
    getPhotoSizeOptions,
    resolvePrintDimensions,
} from '../../utils/printSizes';
import { containPlacement, DEFAULT_BACKGROUND, isPlacement, scalePlacement } from './placement';
import { buildFrameSelection, createCaption } from './photoPrintOptions';

/**
 * The photo print window's state: size, orientation, the photo's placement, background, frame and
 * captions. It starts from the photo's saved choices; saving renders the print file (getPrintCropBlob).
 */
export function usePhotoPrintAdjust({ image, onSave, availableSizes, captionDefaults }) {
    const [orientation, setOrientation] = useState(image?.orientation ?? 'landscape');
    const [printSize, setPrintSize] = useState(image?.size ?? DEFAULT_PHOTO_PRINT_SIZE);
    const [placement, setPlacement] = useState(
        isPlacement(image?.cropState?.placement) ? image.cropState.placement : null,
    );
    const [backgroundColor, setBackgroundColor] = useState(
        image?.cropState?.backgroundColor ?? DEFAULT_BACKGROUND,
    );
    const [dims, setDims] = useState({ w: 0, h: 0 });
    const [saveError, setSaveError] = useState('');
    const [frameSize, setFrameSize] = useState(null);
    const captionToolbarRef = useRef(null);

    const [showFramePanel, setShowFramePanel] = useState(false);
    const [frames, setFrames] = useState([]);
    const [framesLoading, setFramesLoading] = useState(false);
    const [frameSelection, setFrameSelection] = useState(image?.frameSelection ?? null);
    const [frameOverlaySrc, setFrameOverlaySrc] = useState(image?.frameOverlaySrc || image?.frameSelection?.frameImageUrl || '');
    const [captions, setCaptions] = useState(Array.isArray(image?.captions) ? image.captions : []);
    const [selectedCaptionId, setSelectedCaptionId] = useState(image?.captions?.[0]?.id ?? null);
    const [editingCaptionId, setEditingCaptionId] = useState(null);

    const imageSrc = image?.originalSrc || image?.src;
    const print = resolvePrintDimensions(printSize, orientation);
    const aspect = print.aspect;
    const sizeLabel = getCompactPrintSizeLabel(printSize, orientation);
    const selectedCaption = captions.find((caption) => caption.id === selectedCaptionId) || null;
    const cropSize = frameSize;
    const imageAspect = dims.w && dims.h ? dims.w / dims.h : null;

    const sizeOptions = useMemo(() => {
        if (Array.isArray(availableSizes) && availableSizes.length > 0) {
            return availableSizes.map((entry) => ({
                value: entry.size,
                label: entry.label,
            }));
        }
        return getPhotoSizeOptions().map((entry) => ({
            value: entry.size,
            label: entry.label,
        }));
    }, [availableSizes]);

    const initialState = useMemo(
        () => ({
            orientation: image?.orientation ?? 'landscape',
            printSize: image?.size ?? DEFAULT_PHOTO_PRINT_SIZE,
            placement: isPlacement(image?.cropState?.placement) ? image.cropState.placement : null,
            backgroundColor: image?.cropState?.backgroundColor ?? DEFAULT_BACKGROUND,
            frameSelection: image?.frameSelection ?? null,
            frameOverlaySrc: image?.frameOverlaySrc || image?.frameSelection?.frameImageUrl || '',
            captions: Array.isArray(image?.captions) ? image.captions : [],
        }),
        // The photo's saved choices, read once per photo – not again while the parent updates the same photo
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [image?.id],
    );

    useEffect(() => {
        setOrientation(initialState.orientation);
        setPrintSize(initialState.printSize);
        setPlacement(initialState.placement);
        setBackgroundColor(initialState.backgroundColor);
        setSaveError('');
        setFrameSelection(initialState.frameSelection);
        setFrameOverlaySrc(initialState.frameOverlaySrc);
        setCaptions(initialState.captions);
        setSelectedCaptionId(initialState.captions[0]?.id ?? null);
        setEditingCaptionId(null);
        setShowFramePanel(false);
    }, [image?.id, image?.cropState, initialState]);

    useEffect(() => {
        if (!imageSrc) return;
        getImageDimensions(imageSrc).then(({ w, h }) => {
            setDims({ w, h });
            if (!image?.orientation && w && h) {
                setOrientation(getDefaultOrientation(w, h));
            }
        });
    }, [imageSrc, image?.orientation]);

    useEffect(() => {
        if (!showFramePanel) return undefined;
        let cancelled = false;
        setFramesLoading(true);
        getDesignFrames()
            .then((data) => {
                if (!cancelled) setFrames(Array.isArray(data) ? data : []);
            })
            .catch((err) => {
                console.error('Failed to load design frames', err);
                if (!cancelled) setFrames([]);
            })
            .finally(() => {
                if (!cancelled) setFramesLoading(false);
            });
        return () => { cancelled = true; };
    }, [showFramePanel]);

    const warning = getCropWarning(dims.w, dims.h, print.aspect);

    useEffect(() => {
        if (!imageAspect) return;
        setPlacement((current) => {
            if (isPlacement(current)) return current;
            return containPlacement(imageAspect, aspect);
        });
    }, [imageAspect, aspect]);

    const prevAspectRef = useRef(aspect);

    useEffect(() => {
        if (prevAspectRef.current === aspect) return;
        const previousAspect = prevAspectRef.current;
        prevAspectRef.current = aspect;
        if (!imageAspect) return;
        setPlacement((current) => {
            const nextCover = containPlacement(imageAspect, aspect);
            if (!isPlacement(current)) return nextCover;
            const prevCover = containPlacement(imageAspect, previousAspect);
            const scale = prevCover.w ? current.w / prevCover.w : 1;
            return scalePlacement(nextCover, scale);
        });
    }, [aspect, imageAspect]);

    const handleOrientationChange = (next) => {
        setOrientation(next);
    };

    const handlePrintSizeChange = (nextSize) => {
        setPrintSize(nextSize);
    };

    const handleApplyFrame = async (frame, framePrintSize, requestedOrientation) => {
        const processed = await prepareFrameImageSrc(frame.imageUrl);
        setFrameOverlaySrc(processed);
        setFrameSelection(buildFrameSelection(frame, framePrintSize, requestedOrientation));
        if (requestedOrientation && requestedOrientation !== orientation) {
            handleOrientationChange(requestedOrientation);
        }
    };

    const handleRemoveFrame = () => {
        setFrameSelection(null);
        setFrameOverlaySrc('');
    };

    const handleAddCaption = () => {
        const caption = createCaption(captionDefaults);
        setCaptions((prev) => [...prev, caption]);
        setSelectedCaptionId(caption.id);
        setEditingCaptionId(caption.id);
        window.setTimeout(() => {
            captionToolbarRef.current?.scrollIntoView({
                behavior: 'smooth',
                block: 'end',
            });
        }, 50);
    };

    const handleUpdateCaption = (id, patch) => {
        setCaptions((prev) => prev.map((caption) => (
            caption.id === id ? { ...caption, ...patch } : caption
        )));
    };

    const handleRemoveCaption = () => {
        setCaptions((prev) => prev.filter((caption) => caption.id !== selectedCaptionId));
        setSelectedCaptionId(null);
        setEditingCaptionId(null);
    };

    const handleReset = () => {
        setOrientation(initialState.orientation);
        setPrintSize(initialState.printSize);
        setPlacement(imageAspect
            ? containPlacement(imageAspect, resolvePrintDimensions(initialState.printSize, initialState.orientation).aspect)
            : null);
        setBackgroundColor(DEFAULT_BACKGROUND);
        setSaveError('');
        setFrameSelection(null);
        setFrameOverlaySrc('');
        setCaptions([]);
        setSelectedCaptionId(null);
        setEditingCaptionId(null);
    };

    const handleSave = async () => {
        if (!isPlacement(placement) || !imageSrc) {
            setSaveError('יש להמתין לטעינת התמונה לפני שמירה');
            return;
        }

        setSaveError('');
        try {
            const croppedBlob = await getPrintCropBlob({
                imageSrc,
                placement,
                aspect,
                backgroundColor,
                file: image?.file ?? null,
                frameSrc: frameOverlaySrc || null,
                captions,
                previewCropWidth: frameSize?.width,
            });

            const cropState = { placement, backgroundColor };

            await onSave(image.id, {
                crop: { ...DEFAULT_CROP },
                cropState,
                orientation,
                size: printSize,
                croppedBlob,
                fileName: image?.alt || image?.file?.name || 'photo.jpg',
                frameSelection,
                frameOverlaySrc,
                captions,
            });
        } catch (err) {
            console.error('Crop save failed:', err);
            setSaveError('שגיאה ביצירת התמונה החתוכה. נסו שוב.');
        }
    };

    return {
        imageSrc,
        orientation,
        printSize,
        sizeLabel,
        sizeOptions,
        aspect,
        warning,
        placement,
        setPlacement,
        backgroundColor,
        setBackgroundColor,
        frameSize,
        setFrameSize,
        cropSize,
        saveError,
        showFramePanel,
        setShowFramePanel,
        frames,
        framesLoading,
        frameSelection,
        frameOverlaySrc,
        captions,
        selectedCaption,
        selectedCaptionId,
        setSelectedCaptionId,
        editingCaptionId,
        setEditingCaptionId,
        captionToolbarRef,
        handleOrientationChange,
        handlePrintSizeChange,
        handleApplyFrame,
        handleRemoveFrame,
        handleAddCaption,
        handleUpdateCaption,
        handleRemoveCaption,
        handleReset,
        handleSave,
    };
}
