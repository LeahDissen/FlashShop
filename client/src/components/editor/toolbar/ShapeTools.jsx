import { NoColorIcon, PlusIcon } from '../../icons';
import ToolbarPopover from '../ToolbarPopover';
import FlipButtons from './FlipButtons';
import ToolbarDivider from './ToolbarDivider';
import { usePopoverToggle } from './usePopoverToggle';

/** Shape tools: fill color (or none) and flipping */
export default function ShapeTools({ element, onChange, paletteValues }) {
    const colorPicker = usePopoverToggle();
    const currentFill = element.fill;

    return (
        <>
            {/* Shape Color Picker */}
            <div className="relative" ref={colorPicker.ref}>
                <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-600">צבע:</span>
                    <button
                        onClick={colorPicker.toggle}
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

                {colorPicker.open && (
                    <ToolbarPopover anchorRef={colorPicker.ref} width={288} className="p-4">
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
                                onClick={() => onChange('fill', 'transparent')}
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
                                    onChange={(e) => onChange('fill', e.target.value)}
                                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                                />
                            </div>
                        </div>

                        <div className="text-right text-sm font-semibold text-gray-600 mb-2">צבעים</div>
                        <div className="grid grid-cols-6 gap-2">
                            {paletteValues.map(color => (
                                <button
                                    key={color}
                                    onClick={() => onChange('fill', color)}
                                    className={`w-8 h-8 rounded-md border border-gray-200 hover:scale-110 transition-transform ${currentFill === color ? 'ring-2 ring-red-400 ring-offset-2' : ''}`}
                                    style={{ backgroundColor: color }}
                                    aria-label={`Select color ${color}`}
                                />
                            ))}
                        </div>
                    </ToolbarPopover>
                )}
            </div>

            <ToolbarDivider />
            <FlipButtons element={element} onChange={onChange} />
        </>
    );
}
