import { useCallback, useState } from 'react';
import { createDefaultBackground } from '../../utils/editorDraftStorage';

const addOnce = (src) => (prev) => (prev.includes(src) ? prev : [...prev, src]);

/** The photos and backgrounds the customer uploaded in this design ("התמונות שלך") */
export function useUploadedMedia({ setCanvasBackground }) {
    const [uploadedImages, setUploadedImages] = useState([]);
    const [uploadedBackgrounds, setUploadedBackgrounds] = useState([]);

    const rememberUploadedImage = useCallback((src) => setUploadedImages(addOnce(src)), []);
    const forgetUploadedImage = useCallback((src) => setUploadedImages((prev) => prev.filter((s) => s !== src)), []);

    const addUploadedBackground = useCallback((src) => setUploadedBackgrounds(addOnce(src)), []);

    /** Removes a background from the list; the canvas goes back to white if it was using it */
    const deleteUploadedBackground = useCallback((srcToDelete) => {
        setUploadedBackgrounds((prev) => prev.filter((src) => src !== srcToDelete));
        setCanvasBackground((prev) => (
            prev.type === 'image' && prev.value === srcToDelete ? createDefaultBackground() : prev
        ));
    }, [setCanvasBackground]);

    return {
        uploadedImages,
        setUploadedImages,
        rememberUploadedImage,
        forgetUploadedImage,
        uploadedBackgrounds,
        setUploadedBackgrounds,
        addUploadedBackground,
        deleteUploadedBackground,
    };
}
