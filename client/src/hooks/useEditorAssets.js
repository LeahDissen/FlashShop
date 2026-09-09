import { useEffect, useState } from 'react';
import { getEditorAssets } from '../api/editorAssets';
import { mapEditorAssets, mergeEditorAssetsWithFallback } from '../utils/mapEditorAssets';

let cachedRaw = null;
let inflightRequest = null;

const fetchAssetsOnce = () => {
    if (cachedRaw) return Promise.resolve(cachedRaw);
    if (!inflightRequest) {
        inflightRequest = getEditorAssets()
            .then((data) => {
                if (!Array.isArray(data) || data.length === 0) {
                    throw new Error('empty editor assets');
                }
                cachedRaw = data;
                return cachedRaw;
            })
            .finally(() => {
                inflightRequest = null;
            });
    }
    return inflightRequest;
};

export const invalidateEditorAssetsCache = () => {
    cachedRaw = null;
};

/**
 * טוען את ספריית העורך מה-API.
 * עד שהבקשה חוזרת, ואם היא נכשלת או ריקה, מוחזרות ברירות המחדל לפי קטגוריה.
 */
export const useEditorAssets = (fallbacks) => {
    const [assets, setAssets] = useState(fallbacks);

    useEffect(() => {
        let cancelled = false;

        fetchAssetsOnce()
            .then((data) => {
                if (cancelled) return;
                setAssets(mergeEditorAssetsWithFallback(mapEditorAssets(data), fallbacks));
            })
            .catch((err) => {
                console.warn('Failed to load editor assets, using defaults', err);
                if (!cancelled) setAssets(fallbacks);
            });

        return () => {
            cancelled = true;
        };
    }, [fallbacks]);

    return { assets };
};
