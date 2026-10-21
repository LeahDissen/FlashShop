import { BringForwardIcon, DuplicateIcon, SendBackwardIcon, TrashIcon } from '../icons';
import { DEFAULT_EDITOR_SETTINGS } from '../../constants/editorSettingsDefaults';
import ImageTools from './toolbar/ImageTools';
import ShapeTools from './toolbar/ShapeTools';
import TextTools from './toolbar/TextTools';
import ToolbarDivider from './toolbar/ToolbarDivider';

/** The bar above the canvas for the selected element: layer actions, its type's tools and opacity */
const ContextualToolbar = ({ 
    selectedElement, 
    onUpdateElement,
    onCrop,
    onDuplicate,
    onDelete,
    onBringToFront,
    onSendToBack,
    textOptions = DEFAULT_EDITOR_SETTINGS.textToolbar,
    colors = [],
}) => {
    if (!selectedElement) {
        return null;
    }

    const updateField = (key, value) => onUpdateElement({ [key]: value });

    const fonts = textOptions?.fonts?.length
        ? textOptions.fonts
        : DEFAULT_EDITOR_SETTINGS.textToolbar.fonts;
    const paletteValues = colors.length
        ? colors.map((c) => c.value)
        : DEFAULT_EDITOR_SETTINGS.textToolbar.colorPresets;
    const minFontSize = Number(textOptions?.minFontSize) || DEFAULT_EDITOR_SETTINGS.textToolbar.minFontSize;
    const maxFontSize = Number(textOptions?.maxFontSize) || DEFAULT_EDITOR_SETTINGS.textToolbar.maxFontSize;

    return (
        <div className="contextual-toolbar h-14 sm:h-16 bg-white border-b border-gray-200 flex items-center px-2 sm:px-4 gap-1 sm:gap-2 shadow-sm relative z-40 shrink-0 overflow-x-auto overflow-y-visible scrollbar-thin">
            
            {/* Selection Tools */}
            <div className="flex items-center gap-1">
                 <button onClick={onDelete} className="w-9 h-9 flex items-center justify-center text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" data-tooltip="מחק" data-tooltip-pos="bottom">
                    <TrashIcon className="w-5 h-5" />
                </button>
                <button onClick={onDuplicate} className="w-9 h-9 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" data-tooltip="שכפל" data-tooltip-pos="bottom">
                    <DuplicateIcon className="w-5 h-5" />
                </button>
                 <button onClick={onBringToFront} className="w-9 h-9 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" data-tooltip="הבא לקדמה" data-tooltip-pos="bottom">
                    <BringForwardIcon className="w-5 h-5" />
                </button>
                <button onClick={onSendToBack} className="w-9 h-9 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" data-tooltip="שלח לאחור" data-tooltip-pos="bottom">
                    <SendBackwardIcon className="w-5 h-5" />
                </button>
            </div>

            <ToolbarDivider />

            {selectedElement.type === 'text' && (
                <TextTools
                    element={selectedElement}
                    onChange={updateField}
                    fonts={fonts}
                    paletteValues={paletteValues}
                    minFontSize={minFontSize}
                    maxFontSize={maxFontSize}
                />
            )}

            {selectedElement.type === 'shape' && (
                <ShapeTools element={selectedElement} onChange={updateField} paletteValues={paletteValues} />
            )}

            {selectedElement.type === 'image' && (
                <ImageTools element={selectedElement} onChange={updateField} onCrop={onCrop} onUpdateElement={onUpdateElement} />
            )}

             <ToolbarDivider />
             
             {/* Opacity - Common */}
             <div className="flex items-center gap-2" data-tooltip="שקיפות אלמנט" data-tooltip-pos="bottom">
                <span className="text-xs font-medium text-gray-500">שקיפות</span>
                <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.01" 
                    value={selectedElement.opacity} 
                    onChange={(e) => onUpdateElement({ opacity: parseFloat(e.target.value) })}
                    className="w-20 accent-gray-600 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-xs w-8 text-center">{Math.round(selectedElement.opacity * 100)}%</span>
            </div>
        </div>
    );
};

export default ContextualToolbar;
