import FrameSizeFolders from '../editor/FrameSizeFolders.jsx';

/** The design frames, by print size folder, next to the photo */
export default function FrameChooserPanel({ editorSettings, frames, loading, frameSelection, onApplyFrame, onRemoveFrame, disabled }) {
    return (
        <aside className="w-full lg:w-80 shrink-0 border-t lg:border-t-0 lg:border-r border-gray-100 bg-gray-50/70 p-4">
            <div className="flex items-center justify-between gap-2 mb-3">
                <h3 className="font-bold text-gray-800">
                    {editorSettings.frameFolders?.title || 'מסגרות עיצוב'}
                </h3>
                <button
                    type="button"
                    onClick={onRemoveFrame}
                    disabled={!frameSelection || disabled}
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
                activeGlobalFrameId={frameSelection?.frameId}
                onApplyFrame={onApplyFrame}
            />
        </aside>
    );
}
