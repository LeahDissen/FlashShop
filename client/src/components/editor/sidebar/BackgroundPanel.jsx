import { useRef } from 'react';
import { ImageIcon, XIcon } from '../../icons';

const ColorSwatch = ({ color, value, onClick, isSelected }) => (
    <button
        onClick={onClick}
        className={`w-9 h-9 sm:w-8 sm:h-8 rounded-md cursor-pointer border border-gray-200 touch-manipulation ${color || ''} ${isSelected ? 'ring-2 ring-red-500 ring-offset-1' : ''}`}
        style={value ? { backgroundColor: value } : undefined}
        aria-label={`Select ${color || value} color`}
        aria-pressed={isSelected}
    ></button>
);

/** The canvas background: an uploaded image, a color (or a custom one), the customer's backgrounds and the shop's */
const BackgroundPanel = ({
    canvasBackground,
    setCanvasBackground,
    uploadedBackgrounds,
    addUploadedBackground,
    deleteUploadedBackground,
    colors,
    backgroundImages,
}) => {
    const fileInputRef = useRef(null);
    const colorInputRef = useRef(null);

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const result = e.target?.result;
                if (result) {
                    setCanvasBackground({ type: 'image', value: result, size: 'cover', position: 'center', repeat: 'no-repeat' });
                    addUploadedBackground(result);
                }
            };
            reader.readAsDataURL(file);
        }
        if (event.target) {
            event.target.value = '';
        }
    };

    const handleCustomColorClick = () => {
        colorInputRef.current?.click();
    };

    const handleCustomColorChange = (event) => {
        setCanvasBackground({ type: 'color', value: event.target.value });
    };

    const isCustomColor = canvasBackground.type === 'color' && !(colors || []).some(c => c.value === canvasBackground.value);

    return (
        <div className="p-4 text-right">
            <h3 className="font-semibold text-gray-800 mb-4">רקע</h3>
            <button
                onClick={handleUploadClick}
                className="w-full flex items-center justify-center p-3 mb-6 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
            >
                <ImageIcon className="w-5 h-5 ml-2 text-gray-600" />
                <span className="font-semibold text-gray-700">העלה תמונה</span>
            </button>
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/png, image/jpeg, image/gif"
                onChange={handleFileChange}
            />

            <h4 className="font-semibold text-gray-700 text-sm mb-3">צבעים</h4>
            <div className="grid grid-cols-6 sm:grid-cols-5 gap-2 mb-6">
                {(colors || []).map(c => (
                    <ColorSwatch
                        key={c.value}
                        color={c.class}
                        value={c.value}
                        onClick={() => setCanvasBackground({ type: 'color', value: c.value })}
                        isSelected={canvasBackground.type === 'color' && canvasBackground.value === c.value}
                    />
                ))}
                <div data-tooltip="בחר צבע מותאם אישית">
                    <button
                        onClick={handleCustomColorClick}
                        className={`w-9 h-9 sm:w-8 sm:h-8 rounded-md cursor-pointer border border-gray-200 flex items-center justify-center touch-manipulation ${isCustomColor ? 'ring-2 ring-red-500 ring-offset-1' : ''}`}
                        style={isCustomColor ? { backgroundColor: canvasBackground.value } : {}}
                        aria-label="בחר צבע מותאם אישית"
                        aria-pressed={isCustomColor}
                    >
                        {!isCustomColor && (
                            <div className="w-full h-full rounded-md bg-gradient-to-br from-red-500 via-yellow-300 to-blue-500" />
                        )}
                    </button>
                    <input
                        ref={colorInputRef}
                        type="color"
                        onChange={handleCustomColorChange}
                        value={canvasBackground.type === 'color' ? canvasBackground.value : '#FFFFFF'}
                        className="absolute w-0 h-0 opacity-0"
                        style={{ pointerEvents: 'none' }}
                    />
                </div>
            </div>

            {uploadedBackgrounds.length > 0 && (
                <>
                    <h4 className="font-semibold text-gray-700 text-sm mb-3">הרקעים שלך</h4>
                    <div className="grid grid-cols-2 gap-2 mb-4">
                        {uploadedBackgrounds.map(src => {
                            const isSelected = canvasBackground.type === 'image' && canvasBackground.value === src;
                            return (
                                <div key={src} className="relative group">
                                    <button
                                        onClick={() => setCanvasBackground({ type: 'image', value: src, size: 'cover', position: 'center', repeat: 'no-repeat' })}
                                        className={`h-20 w-full rounded-md bg-cover bg-center focus:outline-none transition-all ${isSelected ? 'ring-2 ring-red-500 ring-offset-2' : 'hover:ring-2 hover:ring-red-300'}`}
                                        style={{ backgroundImage: `url(${src})` }}
                                        aria-label={`Select uploaded background`}
                                        aria-pressed={isSelected}
                                    />
                                    <button
                                        onClick={(e) => { e.stopPropagation(); deleteUploadedBackground(src); }}
                                        className="absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center text-gray-700 hover:bg-red-500 hover:text-white transition-all duration-200 z-10 opacity-0 group-hover:opacity-100"
                                        aria-label="Delete uploaded background"
                                    >
                                        <XIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}

            <h4 className="font-semibold text-gray-700 text-sm mb-3">תמונות רקע</h4>
            <div className="grid grid-cols-2 gap-2">
                {(backgroundImages || []).map(imgSrc => {
                    const isSelected = canvasBackground.type === 'image' && canvasBackground.value === imgSrc;
                    return (
                        <button
                            key={imgSrc}
                            onClick={() => setCanvasBackground({ type: 'image', value: imgSrc, size: 'cover', position: 'center', repeat: 'no-repeat' })}
                            className={`h-20 rounded-md bg-cover bg-center focus:outline-none transition-all ${isSelected ? 'ring-2 ring-red-500 ring-offset-2' : 'hover:ring-2 hover:ring-red-300'}`}
                            style={{ backgroundImage: `url(${imgSrc})` }}
                            aria-label={`Select background image ${imgSrc}`}
                            aria-pressed={isSelected}
                        />
                    );
                })}
            </div>
        </div>
    );
};

export default BackgroundPanel;
