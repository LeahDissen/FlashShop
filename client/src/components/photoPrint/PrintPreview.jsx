import DraggableCaption from './DraggableCaption';
import PrintImageEditor from './PrintImageEditor';

/**
 * The print as it will come out: the photo placed in the print frame, with the design frame and the
 * captions on top. `print` is the window's state from usePhotoPrintAdjust.
 */
export default function PrintPreview({ print, captionPlaceholder, disabled }) {
    const { imageSrc, frameOverlaySrc, captions, cropSize } = print;

    if (!imageSrc) {
        return (
            <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                טוען תמונה...
            </div>
        );
    }

    return (
        <PrintImageEditor
            imageSrc={imageSrc}
            aspect={print.aspect}
            placement={print.placement}
            onChange={print.setPlacement}
            backgroundColor={print.backgroundColor}
            disabled={disabled}
            onFrameSize={print.setFrameSize}
        >
            {(frameOverlaySrc || captions.length > 0) && (
                <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
                    {frameOverlaySrc && (
                        <img
                            src={frameOverlaySrc}
                            alt=""
                            className="absolute inset-0 w-full h-full object-fill pointer-events-none"
                        />
                    )}
                    {cropSize && captions.map((caption) => (
                        <DraggableCaption
                            key={caption.id}
                            caption={caption}
                            selected={print.selectedCaptionId === caption.id}
                            editing={print.editingCaptionId === caption.id}
                            cropSize={cropSize}
                            disabled={disabled}
                            placeholder={captionPlaceholder}
                            onSelect={() => print.setSelectedCaptionId(caption.id)}
                            onChange={(patch) => print.handleUpdateCaption(caption.id, patch)}
                            onStartEdit={() => {
                                print.setSelectedCaptionId(caption.id);
                                print.setEditingCaptionId(caption.id);
                            }}
                            onEndEdit={() => {
                                print.setEditingCaptionId((current) => (current === caption.id ? null : current));
                            }}
                        />
                    ))}
                </div>
            )}
        </PrintImageEditor>
    );
}
