import { useMemo } from 'react';
import { useEditorAssets } from '../hooks/useEditorAssets';
import { useEditorSettings } from '../hooks/useEditorSettings';
import { buildEditorPalette } from '../utils/editorPalette';
import { EMPTY_EDITOR_ASSETS } from '../utils/mapEditorAssets';
import BackgroundColorPicker from './photoPrint/BackgroundColorPicker';
import FrameChooserPanel from './photoPrint/FrameChooserPanel';
import PhotoCaptionToolbar from './photoPrint/PhotoCaptionToolbar';
import PrintOptionsPanel from './photoPrint/PrintOptionsPanel';
import PrintPreview from './photoPrint/PrintPreview';
import { BASE_BACKGROUND_COLORS } from './photoPrint/photoPrintOptions';
import { usePhotoPrintAdjust } from './photoPrint/usePhotoPrintAdjust';

/**
 * "עריכה או הצגה" of a photo for printing: size, orientation, placing the photo in the print frame,
 * background color, a design frame and captions. Saving renders the print file.
 */
const PhotoPrintAdjustModal = ({
    image,
    onSave,
    onClose,
    isSaving = false,
    availableSizes = [],
}) => {
    const { settings: editorSettings } = useEditorSettings();
    const { assets: editorAssets } = useEditorAssets(EMPTY_EDITOR_ASSETS);
    // The base colors plus every color the admin defined in the editor settings and the color library
    const backgroundColors = useMemo(
        () => buildEditorPalette(
            [...BASE_BACKGROUND_COLORS, ...(editorSettings.textToolbar?.colorPresets || [])],
            editorAssets.colors,
        ).map((color) => color.value),
        [editorSettings.textToolbar?.colorPresets, editorAssets.colors],
    );
    const print = usePhotoPrintAdjust({
        image,
        onSave,
        availableSizes,
        captionDefaults: editorSettings.captionDefaults,
    });

    if (!image) return null;

    return (
        <div
            className="fixed inset-0 z-[180] flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
            role="presentation"
        >
            <div
                className={`bg-white rounded-2xl shadow-2xl w-full max-h-[96vh] overflow-hidden flex flex-col ${
                    print.showFramePanel ? 'max-w-6xl' : 'max-w-3xl'
                }`}
                dir="rtl"
                role="dialog"
                aria-modal="true"
                aria-labelledby="print-adjust-title"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3 border-b border-gray-100">
                    <div>
                        <h2 id="print-adjust-title" className="text-lg font-bold text-gray-800">
                            חיתוך והתאמה להדפסה
                        </h2>
                        <p className="text-sm text-gray-500">גודל: {print.sizeLabel}</p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSaving}
                        className="text-gray-400 hover:text-gray-600 text-2xl leading-none p-1 disabled:opacity-50"
                        aria-label="סגור"
                    >
                        ×
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto min-h-0">
                    <div className={`flex flex-col ${print.showFramePanel ? 'lg:flex-row' : ''}`}>
                        <div className="flex-1 min-w-0">
                            <PrintOptionsPanel
                                printSize={print.printSize}
                                sizeOptions={print.sizeOptions}
                                onPrintSizeChange={print.handlePrintSizeChange}
                                orientation={print.orientation}
                                onOrientationChange={print.handleOrientationChange}
                                showFramePanel={print.showFramePanel}
                                onToggleFramePanel={() => print.setShowFramePanel((open) => !open)}
                                onAddCaption={print.handleAddCaption}
                                addCaptionLabel={editorSettings.captionDefaults?.buttonLabel}
                                warning={print.warning}
                                disabled={isSaving}
                            />

                            <div
                                className="relative mx-5 rounded-xl overflow-hidden"
                                style={{ height: 'min(52vh, 480px)', backgroundColor: '#111827' }}
                            >
                                <PrintPreview
                                    print={print}
                                    captionPlaceholder={editorSettings.captionDefaults?.placeholder}
                                    disabled={isSaving}
                                />
                            </div>

                            <p className="px-5 pt-3 text-xs text-gray-500">
                                גררו את התמונה להזזה, ואת הידיות בפינות להגדלה או הקטנה. אפשר להקטין את התמונה כדי לחשוף את צבע הרקע בתוך מסגרת ההדפסה. המסגרת הקבועה מראה בדיוק מה ייכנס להדפסה.
                            </p>

                            <div className="px-5 py-3 space-y-4">
                                <BackgroundColorPicker
                                    colors={backgroundColors}
                                    value={print.backgroundColor}
                                    onChange={print.setBackgroundColor}
                                    disabled={isSaving}
                                />

                                {print.selectedCaption && (
                                    <div ref={print.captionToolbarRef}>
                                        <PhotoCaptionToolbar
                                            caption={print.selectedCaption}
                                            textOptions={editorSettings.textToolbar}
                                            onChange={(patch) => print.handleUpdateCaption(print.selectedCaption.id, patch)}
                                            onRemove={print.handleRemoveCaption}
                                            disabled={isSaving}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {print.showFramePanel && (
                            <FrameChooserPanel
                                editorSettings={editorSettings}
                                frames={print.frames}
                                loading={print.framesLoading}
                                frameSelection={print.frameSelection}
                                onApplyFrame={print.handleApplyFrame}
                                onRemoveFrame={print.handleRemoveFrame}
                                disabled={isSaving}
                            />
                        )}
                    </div>
                </div>

                {print.saveError && (
                    <p className="px-5 pb-2 text-sm text-red-600">{print.saveError}</p>
                )}

                <div className="flex flex-wrap gap-2 px-5 py-4 border-t border-gray-100 justify-end bg-gray-50/80">
                    <button
                        type="button"
                        onClick={print.handleReset}
                        disabled={isSaving}
                        className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-white disabled:opacity-50"
                    >
                        איפוס
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSaving}
                        className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-white disabled:opacity-50"
                    >
                        ביטול
                    </button>
                    <button
                        type="button"
                        onClick={print.handleSave}
                        disabled={isSaving || !print.imageSrc}
                        className="px-5 py-2 text-sm font-bold text-white bg-[#f2665e] hover:bg-[#d95248] rounded-lg disabled:opacity-50 flex items-center gap-2"
                    >
                        {isSaving ? (
                            <>
                                <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                שומר...
                            </>
                        ) : (
                            'שמור'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PhotoPrintAdjustModal;
