import { useRef, useState } from 'react';
import { BackgroundIcon, ChevronLeftIcon, GridIcon, ImageIcon, NoColorIcon, PlusIcon, TextIcon, XIcon } from '../icons';

const SidebarTab = ({ icon, label, isActive, onClick }) => {
    return (
        <button
            onClick={onClick}
            className={`w-full flex flex-col items-center justify-center p-3 text-xs font-medium transition-colors rounded-md h-20 ${isActive ? 'bg-red-500 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
            aria-pressed={isActive}
        >
            {icon}
            <span className="mt-1">{label}</span>
        </button>
    );
};

const ColorSwatch = ({ color, onClick, isSelected }) => (
    <button
        onClick={onClick}
        className={`w-8 h-8 rounded-md cursor-pointer border border-gray-200 ${color} ${isSelected ? 'ring-2 ring-red-500 ring-offset-1' : ''}`}
        aria-label={`Select ${color} color`}
        aria-pressed={isSelected}
    ></button>
);

const BackgroundPanel = ({ canvasBackground, setCanvasBackground, uploadedBackgrounds, addUploadedBackground, deleteUploadedBackground }) => {
    const fileInputRef = useRef(null);
    const colorInputRef = useRef(null);

    const colors = [
        { value: '#FFFFFF', class: 'bg-white' }, { value: '#E5E7EB', class: 'bg-gray-200' }, { value: '#9CA3AF', class: 'bg-gray-400' }, { value: '#4B5563', class: 'bg-gray-600' },
        { value: '#1F2937', class: 'bg-gray-800' }, { value: '#000000', class: 'bg-black' }, { value: '#9333EA', class: 'bg-purple-600' }, { value: '#C084FC', class: 'bg-purple-400' },
        { value: '#F472B6', class: 'bg-pink-400' }, { value: '#F87171', class: 'bg-red-400' }, { value: '#DC2626', class: 'bg-red-600' }, { value: '#1E40AF', class: 'bg-blue-800' },
        { value: '#3B82F6', class: 'bg-blue-500' }, { value: '#38BDF8', class: 'bg-sky-400' }, { value: '#67E8F9', class: 'bg-cyan-300' }, { value: '#2DD4BF', class: 'bg-teal-400' },
        { value: '#FB923C', class: 'bg-orange-400' }, { value: '#FBBF24', class: 'bg-amber-400' }, { value: '#FDE047', class: 'bg-yellow-300' }, { value: '#A3E635', class: 'bg-lime-400' },
        { value: '#22C55E', class: 'bg-green-500' },
    ];

    const backgroundImages = [
        'https://images.unsplash.com/photo-1519750783826-e2420f4d687f?q=80&w=300&h=450&fit=crop',
        'https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?q=80&w=300&h=450&fit=crop',
        'https://images.unsplash.com/photo-1604147706283-d7119b5b822c?q=80&w=300&h=450&fit=crop',
        'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?q=80&w=300&h=450&fit=crop',
    ];

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

    const isCustomColor = canvasBackground.type === 'color' && !colors.some(c => c.value === canvasBackground.value);

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
            <div className="grid grid-cols-5 gap-2 mb-6">
                {colors.map(c => (
                    <ColorSwatch
                        key={c.value}
                        color={c.class}
                        onClick={() => setCanvasBackground({ type: 'color', value: c.value })}
                        isSelected={canvasBackground.type === 'color' && canvasBackground.value === c.value}
                    />
                ))}
                <div data-tooltip="בחר צבע מותאם אישית">
                    <button
                        onClick={handleCustomColorClick}
                        className={`w-8 h-8 rounded-md cursor-pointer border border-gray-200 flex items-center justify-center ${isCustomColor ? 'ring-2 ring-red-500 ring-offset-1' : ''}`}
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
                {backgroundImages.map(imgSrc => {
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

const svgToDataURL = (svgString) =>
    `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgString)))}`;

const shapeSvgs = {
    tri: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><polygon points="50,5 95,95 5,95" fill="#3B82F6"/></svg>`,
    square: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="5" y="5" width="90" height="90" rx="4" fill="#3B82F6"/></svg>`,
    circle: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="45" fill="#3B82F6"/></svg>`,
    star: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><polygon points="50,5 61,35 95,35 68,55 79,85 50,65 21,85 32,55 5,35 39,35" fill="#3B82F6"/></svg>`,
    heart: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M50 88.9L16.7 55.6C7.2 46.1 7.2 30.9 16.7 21.4s24.7-9.5 33.3 0l0 0 0 0c8.6-9.5 23.8-9.5 33.3 0s9.5 24.7 0 34.2L50 88.9z" fill="#3B82F6"/></svg>`,
    rect: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="5" y="20" width="90" height="60" rx="4" fill="#3B82F6"/></svg>`,
    hexagon: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><polygon points="50,5 95,27.5 95,72.5 50,95 5,72.5 5,27.5" fill="#3B82F6"/></svg>`,
};

const shapes = [
    { id: 'tri', alt: 'Triangle', src: svgToDataURL(shapeSvgs.tri), content: shapeSvgs.tri, type: 'shape' },
    { id: 'square', alt: 'Square', src: svgToDataURL(shapeSvgs.square), content: shapeSvgs.square, type: 'shape' },
    { id: 'circle', alt: 'Circle', src: svgToDataURL(shapeSvgs.circle), content: shapeSvgs.circle, type: 'shape' },
    { id: 'star', alt: 'Star', src: svgToDataURL(shapeSvgs.star), content: shapeSvgs.star, type: 'shape' },
    { id: 'heart', alt: 'Heart', src: svgToDataURL(shapeSvgs.heart), content: shapeSvgs.heart, type: 'shape' },
    { id: 'rect', alt: 'Rectangle', src: svgToDataURL(shapeSvgs.rect), content: shapeSvgs.rect, type: 'shape' },
    { id: 'hexagon', alt: 'Hexagon', src: svgToDataURL(shapeSvgs.hexagon), content: shapeSvgs.hexagon, type: 'shape' },
];

const backgroundAssets = [
    { id: 'grid', alt: 'Grid', src: svgToDataURL(`<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="gray" stroke-width="0.5"/></pattern></defs><rect width="100" height="100" fill="url(#grid)"/></svg>`) },
    { id: 'dots', alt: 'Dots', src: svgToDataURL(`<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="dots" width="10" height="10" patternUnits="userSpaceOnUse"><circle cx="5" cy="5" r="2" fill="gray"/></pattern></defs><rect width="100" height="100" fill="url(#dots)"/></svg>`) },
    { id: 'black', alt: 'Black', src: svgToDataURL(`<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="#333"/></svg>`) },
    { id: 'wood', alt: 'Wood', src: svgToDataURL(`<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="wood" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M0 10 Q5 5 10 10 T20 10" stroke="#8B4513" fill="none"/></pattern></defs><rect width="100" height="100" fill="#DEB887"/><rect width="100" height="100" fill="url(#wood)" opacity="0.5"/></svg>`) },
    { id: 'sky', alt: 'Sky', src: svgToDataURL(`<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#87CEEB"/><stop offset="100%" stop-color="#E0F7FA"/></linearGradient></defs><rect width="100" height="100" fill="url(#sky)"/></svg>`) },
];

const graphics = [
    { id: 'flower1', alt: 'Flower 1', src: svgToDataURL(`<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="20" fill="#FCD34D"/><circle cx="50" cy="20" r="20" fill="#F87171"/><circle cx="80" cy="50" r="20" fill="#F87171"/><circle cx="50" cy="80" r="20" fill="#F87171"/><circle cx="20" cy="50" r="20" fill="#F87171"/></svg>`) },
    { id: 'leaf', alt: 'Leaf', src: svgToDataURL(`<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M50 95 Q50 5 5 5 Q50 5 50 95 Z" fill="#34D399" transform="rotate(-15 50 95)"/></svg>`) },
    { id: 'flower2', alt: 'Flower 2', src: svgToDataURL(`<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M50 50 L30 10 L70 10 Z" fill="#60A5FA"/><path d="M50 50 L90 30 L90 70 Z" fill="#60A5FA"/><path d="M50 50 L70 90 L30 90 Z" fill="#60A5FA"/><path d="M50 50 L10 70 L10 30 Z" fill="#60A5FA"/><circle cx="50" cy="50" r="15" fill="#FEF3C7"/></svg>`) },
    { id: 'sun', alt: 'Sun', src: svgToDataURL(`<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="25" fill="#FDB813"/><g stroke="#FDB813" stroke-width="5" stroke-linecap="round"><line x1="50" y1="10" x2="50" y2="20"/><line x1="50" y1="80" x2="50" y2="90"/><line x1="10" y1="50" x2="20" y2="50"/><line x1="80" y1="50" x2="90" y2="50"/><line x1="22" y1="22" x2="29" y2="29"/><line x1="71" y1="71" x2="78" y2="78"/><line x1="22" y1="78" x2="29" y2="71"/><line x1="71" y1="29" x2="78" y2="22"/></g></svg>`) },
    { id: 'cloud', alt: 'Cloud', src: svgToDataURL(`<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M25,60 a20,20 0 0,1 0,-40 a20,20 0 0,1 30,-10 a20,20 0 0,1 30,10 a20,20 0 0,1 0,40 z" fill="#E0F7FA" stroke="#B2EBF2" stroke-width="2"/></svg>`) },
];

const frames = [
    { id: 'circleFrame', alt: 'Circle Frame', src: svgToDataURL(`<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><defs><mask id="hole"><rect width="100" height="100" fill="white"/><circle cx="50" cy="50" r="40" fill="black"/></mask></defs><rect width="100" height="100" fill="#F9A8D4" mask="url(#hole)"/></svg>`) },
    { id: 'squareFrame', alt: 'Square Frame', src: svgToDataURL(`<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><defs><mask id="sqhole"><rect width="100" height="100" fill="white"/><rect x="15" y="15" width="70" height="70" fill="black"/></mask></defs><rect width="100" height="100" fill="#FCA5A5" mask="url(#sqhole)"/></svg>`) },
    { id: 'dashedFrame', alt: 'Dashed Frame', src: svgToDataURL(`<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="5" y="5" width="90" height="90" rx="10" fill="none" stroke="#FBBF24" stroke-width="5" stroke-dasharray="10,5"/></svg>`) },
    { id: 'floralFrame', alt: 'Floral Frame', src: svgToDataURL(`<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="45" fill="none" stroke="#A78BFA" stroke-width="8"/></svg>`) },
    { id: 'heartFrame', alt: 'Heart Frame', src: svgToDataURL(`<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><defs><mask id="hearthole"><rect width="100" height="100" fill="white"/><path d="M50 80L20 50C10 40 10 25 20 15s25 0 30 10c5-10 20-10 30 0s10 25 0 35L50 80z" fill="black"/></mask></defs><rect width="100" height="100" fill="#F43F5E" mask="url(#hearthole)"/></svg>`) },
];

const icons = [
    { id: 'user', alt: 'User', src: svgToDataURL(`<svg viewBox="0 0 24 24" fill="#1F2937" xmlns="http://www.w3.org/2000/svg"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>`) },
    { id: 'home', alt: 'Home', src: svgToDataURL(`<svg viewBox="0 0 24 24" fill="#1F2937" xmlns="http://www.w3.org/2000/svg"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>`) },
    { id: 'star_icon', alt: 'Star', src: svgToDataURL(`<svg viewBox="0 0 24 24" fill="#1F2937" xmlns="http://www.w3.org/2000/svg"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>`) },
    { id: 'arrow', alt: 'Arrow', src: svgToDataURL(`<svg viewBox="0 0 24 24" fill="#1F2937" xmlns="http://www.w3.org/2000/svg"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" transform="rotate(-90 12 12)"/></svg>`) },
    { id: 'plane', alt: 'Plane', src: svgToDataURL(`<svg viewBox="0 0 24 24" fill="#1F2937" xmlns="http://www.w3.org/2000/svg"><path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg>`) },
    { id: 'twitter', alt: 'Twitter', src: svgToDataURL(`<svg viewBox="0 0 24 24" fill="#1F2937" xmlns="http://www.w3.org/2000/svg"><path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05-.78-.83-1.88-1.35-3.09-1.35-2.34 0-4.24 1.9-4.24 4.24 0 .33.04.65.1.96-3.53-.18-6.66-1.87-8.75-4.44-.37.63-.58 1.37-.58 2.15 0 1.47.75 2.77 1.89 3.53-.69-.02-1.35-.21-1.92-.53v.05c0 2.05 1.46 3.76 3.4 4.15-.36.1-.73.15-1.11.15-.27 0-.54-.02-.8-.06.54 1.68 2.1 2.91 3.96 2.94-1.45 1.14-3.27 1.82-5.25 1.82-.34 0-.68-.02-1.02-.06 1.87 1.2 4.09 1.9 6.47 1.9 7.76 0 12.01-6.43 12.01-12.01 0-.18 0-.37-.01-.55.82-.6 1.53-1.34 2.09-2.2z"/></svg>`) },
];

const ElementSection = ({ title, items, onAdd, onShowAll }) => {
    const scrollContainerRef = useRef(null);

    const scroll = (offset) => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollLeft += offset;
        }
    };

    return (
        <div className="mb-8">
            <div className="flex justify-between items-end mb-3 px-2">
                <h3 className="font-bold text-gray-800 text-base">{title}</h3>
                <button
                    type="button"
                    onClick={onShowAll}
                    className="text-sm font-medium text-gray-500 hover:text-red-500 transition-colors flex items-center gap-1 px-2 py-1 rounded hover:bg-red-50"
                >
                    <span>הצג הכל</span>
                    <ChevronLeftIcon className="w-3 h-3" />
                </button>
            </div>

            <div className="relative group">
                <button
                    onClick={() => scroll(200)}
                    className="absolute -right-2 top-1/2 -translate-y-1/2 z-10 p-1.5 bg-white rounded-full shadow-md text-gray-600 hover:text-red-500 border border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0"
                >
                    <ChevronLeftIcon className="w-4 h-4 rotate-180" />
                </button>

                <div
                    ref={scrollContainerRef}
                    className="flex gap-3 overflow-x-auto pb-2 pt-1 px-1 scrollbar-hide snap-x"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {items.map(item => (
                        <button
                            key={item.id}
                            onClick={() => onAdd(item)}
                            className="flex-shrink-0 w-20 h-20 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-red-300 transition-all p-2 snap-start flex items-center justify-center group/item"
                            title={item.alt}
                        >
                            <img
                                src={item.src}
                                alt={item.alt}
                                className="max-w-full max-h-full object-contain transition-transform duration-300 group-hover/item:scale-110"
                            />
                        </button>
                    ))}
                </div>

                <button
                    onClick={() => scroll(-200)}
                    className="absolute -left-2 top-1/2 -translate-y-1/2 z-10 p-1.5 bg-white rounded-full shadow-md text-gray-600 hover:text-red-500 border border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    <ChevronLeftIcon className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

const ElementsPanel = ({ addImageElement, addShapeElement }) => {
    const [expandedCategory, setExpandedCategory] = useState(null);

    const handleAdd = (item) => {
        if (item.type === 'shape' && item.content) {
            addShapeElement(item.content);
            return;
        }

        const img = new Image();
        img.onload = () => {
            const maxWidth = 150;
            const maxHeight = 150;
            let { width, height } = img;
            const naturalWidth = img.width;
            const naturalHeight = img.height;

            if (width > maxWidth || height > maxHeight) {
                const ratio = Math.min(maxWidth / width, maxHeight / height);
                width *= ratio;
                height *= ratio;
            }

            addImageElement(item.src, width, height, naturalWidth, naturalHeight);
        };
        img.src = item.src;
    };

    if (expandedCategory) {
        return (
            <div className="p-4 h-full flex flex-col">
                <div className="flex items-center justify-between mb-4 border-b pb-2 border-gray-100">
                    <h3 className="font-bold text-gray-800 text-lg">{expandedCategory.title}</h3>
                    <button
                        onClick={() => setExpandedCategory(null)}
                        className="text-gray-500 hover:text-red-500 transition-colors flex items-center gap-1 text-sm font-medium px-2 py-1 rounded hover:bg-gray-100"
                    >
                        <span>חזרה</span>
                        <ChevronLeftIcon className="w-4 h-4 rotate-180" />
                    </button>
                </div>

                <div className="grid grid-cols-3 gap-3 overflow-y-auto pb-4" style={{ scrollbarWidth: 'thin' }}>
                    {expandedCategory.items.map(item => (
                        <button
                            key={item.id}
                            onClick={() => handleAdd(item)}
                            className="aspect-square bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-red-300 transition-all p-2 flex items-center justify-center group"
                            title={item.alt}
                        >
                            <img
                                src={item.src}
                                alt={item.alt}
                                className="max-w-full max-h-full object-contain transition-transform duration-300 group-hover:scale-110"
                            />
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 overflow-y-auto h-full">
            <ElementSection title="צורות" items={shapes} onAdd={handleAdd} onShowAll={() => setExpandedCategory({ title: "צורות", items: shapes })} />
            <ElementSection title="תמונות רקע" items={backgroundAssets} onAdd={handleAdd} onShowAll={() => setExpandedCategory({ title: "תמונות רקע", items: backgroundAssets })} />
            <ElementSection title="גרפיקות" items={graphics} onAdd={handleAdd} onShowAll={() => setExpandedCategory({ title: "גרפיקות", items: graphics })} />
            <ElementSection title="מסגרות לתמונה" items={frames} onAdd={handleAdd} onShowAll={() => setExpandedCategory({ title: "מסגרות לתמונה", items: frames })} />
            <ElementSection title="אייקונים" items={icons} onAdd={handleAdd} onShowAll={() => setExpandedCategory({ title: "אייקונים", items: icons })} />
        </div>
    );
}

const TextPanel = ({ addTextElement }) => {
    return (
        <div className="p-4">
            <div className="space-y-3">
                <h3 className="text-xl font-bold text-gray-800 mb-1 text-right">סגנון טקסט</h3>
                <p className="text-sm text-gray-500 mb-4 text-right">הקש על טקסט כדי להוסיף לדף</p>
                <button
                    onClick={addTextElement}
                    className="w-full text-center py-3 rounded-lg bg-red-500 text-white font-bold hover:bg-red-600 transition-colors"
                >
                    הוסף תיבת טקסט
                </button>
            </div>
        </div>
    );
};

const ImagePanel = ({ addImageElement, uploadedImages, deleteUploadedImage }) => {
    const fileInputRef = useRef(null);

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const addImageToCanvas = (src) => {
        const img = new Image();
        img.onload = () => {
            const maxWidth = 150;
            const maxHeight = 200;
            let { width, height } = img;
            const naturalWidth = img.width;
            const naturalHeight = img.height;

            if (width > maxWidth) {
                height = (maxWidth / width) * height;
                width = maxWidth;
            }
            if (height > maxHeight) {
                width = (maxHeight / height) * width;
                height = maxHeight;
            }

            addImageElement(src, width, height, naturalWidth, naturalHeight);
        };
        img.src = src;
    };

    const handleFileChange = (event) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const result = e.target?.result;
                if (result) {
                    addImageToCanvas(result);
                }
            };
            reader.readAsDataURL(file);
        }
        if (event.target) {
            event.target.value = '';
        }
    };

    return (
        <div className="p-4 text-right">
            <h3 className="font-semibold text-gray-800 mb-4">תמונות</h3>
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

            <div className="border-t pt-4 mt-4">
                <h4 className="font-semibold text-gray-700 text-sm mb-3">התמונות שלך</h4>
                {uploadedImages.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2">
                        {uploadedImages.map((src, index) => (
                            <div key={index} className="relative group aspect-square">
                                <button
                                    onClick={() => addImageToCanvas(src)}
                                    className="w-full h-full bg-gray-100 rounded-md overflow-hidden hover:ring-2 ring-offset-1 ring-red-400 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-400 transition-shadow"
                                    aria-label={`Add uploaded image ${index + 1} to canvas`}
                                >
                                    <img src={src} alt={`Uploaded image ${index + 1}`} className="w-full h-full object-cover pointer-events-none" />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); deleteUploadedImage(src); }}
                                    className="absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center text-gray-700 hover:bg-red-500 hover:text-white transition-all duration-200 z-10 opacity-0 group-hover:opacity-100"
                                    aria-label="Delete uploaded image"
                                >
                                    <XIcon className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-sm text-gray-500 py-4 rounded-md bg-gray-50">
                        <p>אין תמונות שהועלו.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const EditorSidebar = ({
    addTextElement,
    addImageElement,
    addShapeElement,
    uploadedImages,
    deleteUploadedImage,
    selectedElement,
    onUpdateElement,
    canvasBackground,
    setCanvasBackground,
    uploadedBackgrounds,
    addUploadedBackground,
    deleteUploadedBackground,
}) => {
    const [activeTab, setActiveTab] = useState('background');
    const [isCollapsed, setIsCollapsed] = useState(false);

    const tabs = [
        { id: 'elements', label: 'אלמנטים', icon: <GridIcon className="w-7 h-7" /> },
        { id: 'background', label: 'רקע', icon: <BackgroundIcon className="w-7 h-7" /> },
        { id: 'text', label: 'טקסט', icon: <TextIcon className="w-7 h-7" /> },
        { id: 'images', label: 'תמונות', icon: <ImageIcon className="w-7 h-7" /> },
    ];

    return (
        <aside className={`bg-white shadow-lg flex flex-col transition-all duration-300 relative z-10 ${isCollapsed ? 'w-24' : 'w-96'}`}>
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="absolute top-1/2 left-0 -translate-x-1/2 z-40 bg-white border border-gray-200 shadow-md rounded-full w-8 h-8 flex items-center justify-center text-gray-500 hover:text-red-500 hover:border-red-300 transition-colors"
                aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                data-tooltip={isCollapsed ? "הרחב סרגל" : "צמצם סרגל"}
                data-tooltip-pos="bottom"
            >
                <ChevronLeftIcon className={`w-4 h-4 transition-transform duration-300 ${isCollapsed ? '' : 'rotate-180'}`} />
            </button>

            {/* Main Content Area - Horizontal Flex */}
            <div className="flex flex-1 overflow-hidden">
                {/* Tabs Column */}
                <div className="w-24 bg-white flex flex-col items-center p-2 space-y-2 border-l border-gray-200 shrink-0 relative">
                    {tabs.map(tab => (
                        <SidebarTab
                            key={tab.id}
                            icon={tab.icon}
                            label={tab.label}
                            isActive={activeTab === tab.id}
                            onClick={() => {
                                setActiveTab(tab.id);
                                if (isCollapsed) setIsCollapsed(false);
                            }}
                        />
                    ))}
                </div>

                {/* Panel Content Column - Scrollable */}
                <div className={`flex-1 overflow-y-auto transition-opacity duration-300 ${isCollapsed ? 'opacity-0 invisible w-0' : 'opacity-100 visible'}`}>
                    {activeTab === 'background' && <BackgroundPanel
                        canvasBackground={canvasBackground}
                        setCanvasBackground={setCanvasBackground}
                        uploadedBackgrounds={uploadedBackgrounds}
                        addUploadedBackground={addUploadedBackground}
                        deleteUploadedBackground={deleteUploadedBackground}
                    />}
                    {activeTab === 'elements' && <ElementsPanel addImageElement={addImageElement} addShapeElement={addShapeElement} />}
                    {activeTab === 'text' && <TextPanel addTextElement={addTextElement} selectedElement={selectedElement} onUpdateElement={onUpdateElement} />}
                    {activeTab === 'images' && <ImagePanel addImageElement={addImageElement} uploadedImages={uploadedImages} deleteUploadedImage={deleteUploadedImage} />}
                </div>
            </div>
        </aside>
    );
};

export default EditorSidebar;