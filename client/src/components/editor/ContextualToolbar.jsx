import { useEffect, useRef, useState } from 'react';
import { 
    AlignCenterIcon, AlignLeftIcon, AlignRightIcon, 
    BoldIcon, BringForwardIcon, CropIcon, 
    DuplicateIcon, FlipHorizontalIcon, FlipVerticalIcon,
    ItalicIcon, NoColorIcon, PlusIcon, 
    SendBackwardIcon, SunIcon, TrashIcon, UnderlineIcon 
} from '../icons';

const NumericStepper = ({ value, onChange, min = 0, max = 200, step = 1, label }) => {
    const handleDecrement = () => onChange(Math.max(min, value - step));
    const handleIncrement = () => onChange(Math.min(max, value + step));
    
    const handleChange = (e) => {
        const val = parseFloat(e.target.value);
        if (!isNaN(val)) onChange(Math.max(min, Math.min(max, val)));
    };

    return (
        <div className="flex items-center gap-2">
            {label && <span className="text-xs text-gray-500 font-medium">{label}</span>}
            <div className="flex items-center border border-gray-300 rounded-lg h-9 bg-white overflow-hidden shadow-sm" dir="ltr">
                <button 
                    onClick={handleDecrement}
                    className="px-3 h-full hover:bg-gray-50 active:bg-gray-100 border-r border-gray-300 text-gray-600 transition-colors flex items-center justify-center"
                >
                    -
                </button>
                <input 
                    type="number" 
                    value={value}
                    onChange={handleChange}
                    className="w-12 text-center h-full border-none focus:ring-0 focus:outline-none text-gray-800 font-semibold bg-transparent text-sm"
                />
                <button 
                    onClick={handleIncrement}
                    className="px-3 h-full hover:bg-gray-50 active:bg-gray-100 border-l border-gray-300 text-gray-600 transition-colors flex items-center justify-center"
                >
                    +
                </button>
            </div>
        </div>
    );
};

const Divider = () => <div className="w-px h-8 bg-gray-200 mx-2"></div>;

const PRESET_COLORS = [
  '#FFFFFF', '#E5E7EB', '#9CA3AF', '#4B5563', '#1F2937', '#000000',
  '#9333EA', '#C084FC', '#E879F9', '#F472B6', '#F87171', '#DC2626',
  '#1D4ED8', '#3B82F6', '#38BDF8', '#67E8F9', '#2DD4BF', '#10B981',
  '#FB923C', '#FBBF24', '#FDE047', '#A3E635', '#4ADE80', '#16A34A'
];

const ContextualToolbar = ({ 
    selectedElement, 
    onUpdateElement,
    onCrop,
    onDuplicate,
    onDelete,
    onBringToFront,
    onSendToBack
}) => {
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const colorPickerRef = useRef(null);
    const filtersRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (colorPickerRef.current && !colorPickerRef.current.contains(event.target)) {
                setShowColorPicker(false);
            }
            if (filtersRef.current && !filtersRef.current.contains(event.target)) {
                setShowFilters(false);
            }
        };

        if (showColorPicker || showFilters) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showColorPicker, showFilters]);

    if (!selectedElement) {
        return null;
    }

    const handleTextChange = (key, value) => {
        onUpdateElement({ [key]: value });
    };

    const handleImageChange = (key, value) => {
        onUpdateElement({ [key]: value });
    };

    const handleShapeChange = (key, value) => {
        onUpdateElement({ [key]: value });
    };

    const currentFill = selectedElement.fill;

    return (
        <div className="contextual-toolbar h-16 bg-white border-b border-gray-200 flex items-center px-4 gap-2 shadow-sm relative z-40 shrink-0 overflow-visible">
            
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

            <Divider />

            {selectedElement.type === 'text' && (
                <>
                    {/* Font Family */}
                    <div className="relative" data-tooltip="גופן" data-tooltip-pos="bottom">
                        <select 
                            value={selectedElement.fontFamily} 
                            onChange={(e) => handleTextChange('fontFamily', e.target.value)}
                            className="h-9 pl-2 pr-8 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400 bg-white text-gray-700 min-w-[140px]"
                        >
                            <option value="Arial">Arial</option>
                            <option value="Times New Roman">Times New Roman</option>
                            <option value="Courier New">Courier New</option>
                            <option value="Verdana">Verdana</option>
                            <option value="Georgia">Georgia</option>
                            <option value="Tahoma">Tahoma</option>
                            <option value="Trebuchet MS">Trebuchet MS</option>
                            <option value="Impact">Impact</option>
                            <option value="Varela Round">Varela Round</option>
                            <option value="Rubik">Rubik</option>
                        </select>
                    </div>

                    {/* Font Size - THE STEPPER */}
                    <div data-tooltip="גודל גופן" data-tooltip-pos="bottom">
                        <NumericStepper 
                            value={selectedElement.fontSize} 
                            onChange={(val) => handleTextChange('fontSize', val)} 
                            min={8} 
                            max={200} 
                        />
                    </div>

                    <Divider />

                    {/* Color Picker */}
                     <div className="relative flex items-center justify-center w-9 h-9 rounded-lg border border-gray-300 cursor-pointer hover:bg-gray-50 shadow-sm" data-tooltip="צבע טקסט" data-tooltip-pos="bottom">
                        <div className="w-6 h-6 rounded-full border border-gray-200 shadow-sm overflow-hidden relative">
                             <div className="w-full h-full" style={{ backgroundColor: selectedElement.color }}></div>
                             <input 
                                type="color" 
                                value={selectedElement.color} 
                                onChange={(e) => handleTextChange('color', e.target.value)}
                                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                            />
                        </div>
                    </div>

                    <Divider />

                    {/* Text Styling */}
                    <div className="flex items-center gap-1 border border-gray-200 rounded-lg p-1 bg-gray-50">
                        <button 
                            onClick={() => handleTextChange('bold', !selectedElement.bold)} 
                            className={`w-7 h-7 flex items-center justify-center rounded ${selectedElement.bold ? 'bg-white shadow-sm text-black font-bold' : 'text-gray-500 hover:bg-gray-200'}`}
                            data-tooltip="מודגש"
                            data-tooltip-pos="bottom"
                        >
                            <BoldIcon className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => handleTextChange('italic', !selectedElement.italic)} 
                            className={`w-7 h-7 flex items-center justify-center rounded ${selectedElement.italic ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:bg-gray-200'}`}
                            data-tooltip="נטוי"
                            data-tooltip-pos="bottom"
                        >
                            <ItalicIcon className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => handleTextChange('underline', !selectedElement.underline)} 
                            className={`w-7 h-7 flex items-center justify-center rounded ${selectedElement.underline ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:bg-gray-200'}`}
                            data-tooltip="קו תחתון"
                            data-tooltip-pos="bottom"
                        >
                            <UnderlineIcon className="w-4 h-4" />
                        </button>
                    </div>

                    <Divider />

                    {/* Alignment */}
                    <div className="flex items-center gap-1 border border-gray-200 rounded-lg p-1 bg-gray-50">
                        <button 
                            onClick={() => handleTextChange('textAlign', 'right')} 
                            className={`w-7 h-7 flex items-center justify-center rounded ${selectedElement.textAlign === 'right' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:bg-gray-200'}`}
                            data-tooltip="יישור לימין"
                            data-tooltip-pos="bottom"
                        >
                            <AlignRightIcon className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => handleTextChange('textAlign', 'center')} 
                            className={`w-7 h-7 flex items-center justify-center rounded ${selectedElement.textAlign === 'center' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:bg-gray-200'}`}
                            data-tooltip="יישור למרכז"
                            data-tooltip-pos="bottom"
                        >
                            <AlignCenterIcon className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => handleTextChange('textAlign', 'left')} 
                            className={`w-7 h-7 flex items-center justify-center rounded ${selectedElement.textAlign === 'left' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:bg-gray-200'}`}
                            data-tooltip="יישור לשמאל"
                            data-tooltip-pos="bottom"
                        >
                            <AlignLeftIcon className="w-4 h-4" />
                        </button>
                    </div>
                </>
            )}

            {selectedElement.type === 'shape' && (
                <>
                    {/* Shape Color Picker */}
                    <div className="relative" ref={colorPickerRef}>
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-gray-600">צבע:</span>
                            <button 
                                onClick={() => setShowColorPicker(!showColorPicker)}
                                className="relative flex items-center justify-center w-9 h-9 rounded-lg border border-gray-300 cursor-pointer hover:bg-gray-50 shadow-sm"
                                data-tooltip="צבע צורה"
                                data-tooltip-pos="bottom"
                            >
                                {currentFill === 'transparent' ? (
                                    <NoColorIcon className="w-full h-full" />
                                ) : (
                                    <div className="w-6 h-6 rounded-full border border-gray-200 shadow-sm" style={{ backgroundColor: currentFill }}></div>
                                )}
                            </button>
                        </div>

                        {showColorPicker && (
                            <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl p-4 z-50 w-72" dir="rtl">
                                <div className="text-right font-bold text-gray-800 mb-2">צבע האלמנט</div>
                                <div className="flex items-center gap-3 mb-4">
                                    {/* Current Color Large Preview */}
                                    <div className="w-12 h-12 rounded-lg shadow-sm border border-gray-200 flex items-center justify-center overflow-hidden">
                                        {currentFill === 'transparent' ? (
                                            <NoColorIcon className="w-full h-full" />
                                        ) : (
                                            <div className="w-full h-full" style={{ backgroundColor: currentFill }}></div>
                                        )}
                                    </div>
                                    
                                    {/* No Color Button */}
                                    <button 
                                        onClick={() => handleShapeChange('fill', 'transparent')}
                                        className="w-12 h-12 rounded-lg border border-gray-200 hover:border-red-400 transition-colors flex items-center justify-center bg-white group"
                                        title="ללא צבע"
                                    >
                                        <NoColorIcon className="w-8 h-8 text-gray-400 group-hover:text-red-500" />
                                    </button>

                                    {/* Custom Color Button */}
                                    <div className="w-12 h-12 rounded-lg overflow-hidden relative cursor-pointer group border border-gray-200 hover:border-red-400 transition-colors">
                                         <div className="w-full h-full bg-gradient-to-br from-red-500 via-yellow-400 via-green-500 via-blue-500 to-purple-600 flex items-center justify-center">
                                              <PlusIcon className="w-6 h-6 text-white drop-shadow-md" />
                                         </div>
                                         <input 
                                            type="color" 
                                            value={currentFill === 'transparent' ? '#ffffff' : currentFill} 
                                            onChange={(e) => handleShapeChange('fill', e.target.value)}
                                            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                                        />
                                    </div>
                                </div>

                                <div className="text-right text-sm font-semibold text-gray-600 mb-2">צבעים</div>
                                <div className="grid grid-cols-6 gap-2">
                                    {PRESET_COLORS.map(color => (
                                        <button
                                            key={color}
                                            onClick={() => handleShapeChange('fill', color)}
                                            className={`w-8 h-8 rounded-md border border-gray-200 hover:scale-110 transition-transform ${currentFill === color ? 'ring-2 ring-red-400 ring-offset-2' : ''}`}
                                            style={{ backgroundColor: color }}
                                            aria-label={`Select color ${color}`}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    
                    <Divider />

                    <div className="flex items-center gap-1">
                         <button 
                            onClick={() => handleShapeChange('scaleX', selectedElement.scaleX === 1 ? -1 : 1)} 
                            className={`w-9 h-9 flex items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 ${selectedElement.scaleX === -1 ? 'bg-blue-50 text-blue-600 border border-blue-200' : ''}`}
                            data-tooltip="היפוך אופקי"
                            data-tooltip-pos="bottom"
                        >
                            <FlipHorizontalIcon className="w-5 h-5" />
                        </button>
                        <button 
                            onClick={() => handleShapeChange('scaleY', selectedElement.scaleY === 1 ? -1 : 1)} 
                            className={`w-9 h-9 flex items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 ${selectedElement.scaleY === -1 ? 'bg-blue-50 text-blue-600 border border-blue-200' : ''}`}
                            data-tooltip="היפוך אנכי"
                            data-tooltip-pos="bottom"
                        >
                            <FlipVerticalIcon className="w-5 h-5" />
                        </button>
                    </div>
                </>
            )}

            {selectedElement.type === 'image' && (
                <>
                    <button 
                        onClick={onCrop} 
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg border border-gray-300 transition-colors hover:shadow-sm"
                        data-tooltip="חיתוך תמונה"
                        data-tooltip-pos="bottom"
                    >
                        <CropIcon className="w-4 h-4" />
                        חתוך
                    </button>

                    <Divider />

                    <div className="flex items-center gap-1">
                         <button 
                            onClick={() => handleImageChange('scaleX', selectedElement.scaleX === 1 ? -1 : 1)} 
                            className={`w-9 h-9 flex items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 ${selectedElement.scaleX === -1 ? 'bg-blue-50 text-blue-600 border border-blue-200' : ''}`}
                            data-tooltip="היפוך אופקי"
                            data-tooltip-pos="bottom"
                        >
                            <FlipHorizontalIcon className="w-5 h-5" />
                        </button>
                        <button 
                            onClick={() => handleImageChange('scaleY', selectedElement.scaleY === 1 ? -1 : 1)} 
                            className={`w-9 h-9 flex items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 ${selectedElement.scaleY === -1 ? 'bg-blue-50 text-blue-600 border border-blue-200' : ''}`}
                            data-tooltip="היפוך אנכי"
                            data-tooltip-pos="bottom"
                        >
                            <FlipVerticalIcon className="w-5 h-5" />
                        </button>
                    </div>

                    <Divider />

                    {/* Image Filters Popover */}
                    <div className="relative" ref={filtersRef}>
                        <button 
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${showFilters ? 'bg-red-50 border-red-300 text-red-600' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                            data-tooltip="התאמות תמונה"
                            data-tooltip-pos="bottom"
                        >
                            <SunIcon className="w-4 h-4" />
                            <span>התאמות</span>
                        </button>

                        {showFilters && (
                            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 bg-white border border-gray-200 rounded-xl shadow-xl p-5 z-50 w-64" dir="rtl">
                                <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">התאמת תמונה</h3>
                                
                                <div className="space-y-4">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex justify-between text-xs text-gray-500 font-medium">
                                            <span className="flex items-center gap-1">בהירות</span>
                                            <span>{Math.round((selectedElement.brightness || 100) - 100)}%</span>
                                        </div>
                                        <input 
                                            type="range" min="0" max="200" 
                                            value={selectedElement.brightness || 100} 
                                            onChange={(e) => handleImageChange('brightness', parseInt(e.target.value))}
                                            className="w-full accent-red-400 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                        />
                                    </div>

                                    <div className="flex flex-col gap-1">
                                        <div className="flex justify-between text-xs text-gray-500 font-medium">
                                            <span>ניגודיות</span>
                                            <span>{Math.round((selectedElement.contrast || 100) - 100)}%</span>
                                        </div>
                                        <input 
                                            type="range" min="0" max="200" 
                                            value={selectedElement.contrast || 100} 
                                            onChange={(e) => handleImageChange('contrast', parseInt(e.target.value))}
                                            className="w-full accent-red-400 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                        />
                                    </div>

                                    <div className="flex flex-col gap-1">
                                        <div className="flex justify-between text-xs text-gray-500 font-medium">
                                            <span>גווני אפור</span>
                                            <span>{selectedElement.grayscale || 0}%</span>
                                        </div>
                                        <input 
                                            type="range" min="0" max="100" 
                                            value={selectedElement.grayscale || 0} 
                                            onChange={(e) => handleImageChange('grayscale', parseInt(e.target.value))}
                                            className="w-full accent-red-400 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                        />
                                    </div>

                                    <div className="flex flex-col gap-1">
                                        <div className="flex justify-between text-xs text-gray-500 font-medium">
                                            <span>ספיה</span>
                                            <span>{selectedElement.sepia || 0}%</span>
                                        </div>
                                        <input 
                                            type="range" min="0" max="100" 
                                            value={selectedElement.sepia || 0} 
                                            onChange={(e) => handleImageChange('sepia', parseInt(e.target.value))}
                                            className="w-full accent-red-400 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                        />
                                    </div>

                                    <div className="flex flex-col gap-1">
                                        <div className="flex justify-between text-xs text-gray-500 font-medium">
                                            <span>טשטוש</span>
                                            <span>{selectedElement.blur || 0}px</span>
                                        </div>
                                        <input 
                                            type="range" min="0" max="20" step="0.5"
                                            value={selectedElement.blur || 0} 
                                            onChange={(e) => handleImageChange('blur', parseFloat(e.target.value))}
                                            className="w-full accent-red-400 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                        />
                                    </div>

                                    <button 
                                        onClick={() => onUpdateElement({ brightness: 100, contrast: 100, grayscale: 0, sepia: 0, blur: 0 })}
                                        className="w-full text-xs text-red-500 hover:bg-red-50 py-1 rounded transition-colors mt-2"
                                    >
                                        איפוס הגדרות
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}

             <Divider />
             
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