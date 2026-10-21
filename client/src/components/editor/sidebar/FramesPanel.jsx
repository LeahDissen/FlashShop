import { useEffect, useState } from 'react';
import { getDesignFrames } from '../../../api/designFrames';
import FrameSizeFolders from '../FrameSizeFolders.jsx';

/**
 * Global frames the admin uploads in the dashboard – the same size-folder picker as in photo development.
 * Loaded only when the tab is opened.
 */
const FramesPanel = ({
    editorSettings,
    activeGlobalFrameId,
    onApplyGlobalFrame,
    onRemoveGlobalFrame,
    onSelectGlobalFrame,
}) => {
    const [frames, setFrames] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        getDesignFrames()
            .then((data) => {
                if (!cancelled) setFrames(Array.isArray(data) ? data : []);
            })
            .catch((err) => {
                console.error('Failed to load global design frames', err);
                if (!cancelled) setFrames([]);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => { cancelled = true; };
    }, []);

    return (
        <div className="p-4 overflow-y-auto h-full">
            <div className="flex items-center justify-between gap-2 mb-3">
                <h3 className="font-bold text-gray-800 text-base">
                    {editorSettings.frameFolders?.title || 'מסגרות עיצוב'}
                </h3>
                <button
                    type="button"
                    onClick={onRemoveGlobalFrame}
                    disabled={!activeGlobalFrameId}
                    className="text-xs font-bold text-gray-500 hover:text-red-600 disabled:opacity-40"
                >
                    הסר מסגרת
                </button>
            </div>
            <FrameSizeFolders
                frames={frames}
                printSizes={editorSettings.framePrintSizes}
                orientationLabels={editorSettings.orientationLabels}
                folderTexts={editorSettings.frameFolders}
                loading={loading}
                activeGlobalFrameId={activeGlobalFrameId}
                onApplyFrame={onApplyGlobalFrame}
                onSelectFrame={onSelectGlobalFrame}
            />
        </div>
    );
};

export default FramesPanel;
