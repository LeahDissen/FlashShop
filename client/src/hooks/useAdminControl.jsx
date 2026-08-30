import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { updatePage } from '../api/pages';

export const useAdminControl = (initialData, endpoint) => {
    const [page, setPage] = useState(initialData);
    const [editMode, setEditMode] = useState(false);
    const [previewMode, setPreviewMode] = useState(false);
    const [draft, setDraft] = useState(initialData);
    
    const location = useLocation();

    useEffect(() => {
        if (location.state?.autoEdit && location.state?.targetEndpoint === endpoint) {
            setEditMode(true);
        }
    }, [location.state, endpoint]);

    const saveChanges = async () => {
        try {
            const payload = { ...draft };
            // Redis hash values must be strings — stringify object/array fields
            Object.keys(payload).forEach((key) => {
                const value = payload[key];
                if (value !== null && typeof value === 'object') {
                    payload[key] = JSON.stringify(value);
                }
            });
            await updatePage(endpoint, payload);
            setPage(draft);
            setEditMode(false);
            setPreviewMode(false);
        } catch (error) {
            console.error('Error saving changes:', error);
        }
    };

    const cancelEdit = () => {
        setDraft(page);
        setEditMode(false);
        setPreviewMode(false);
    };

    const updateDraft = (changes) => {
        setDraft(prev => ({ ...prev, ...changes }));
    };

    return {
        page,
        setPage,
        editMode,
        setEditMode,
        previewMode,
        setPreviewMode,
        draft,
        setDraft,
        saveChanges,
        cancelEdit,
        updateDraft
    };
};