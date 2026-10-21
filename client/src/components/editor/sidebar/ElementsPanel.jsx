import { useRef, useState } from 'react';
import { ChevronLeftIcon } from '../../icons';

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

/** Shapes, background pictures, graphics and icons: a scrolling row per category, or all of one category */
const ElementsPanel = ({
    addImageElement,
    addShapeElement,
    shapes,
    backgroundAssets,
    graphics,
    icons,
}) => {
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
                            className="aspect-square bg-white rounded-xl border border-gray-200 hover:border-red-300 shadow-sm hover:shadow-md transition-all p-2 flex items-center justify-center group"
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
            <ElementSection title="אייקונים" items={icons} onAdd={handleAdd} onShowAll={() => setExpandedCategory({ title: "אייקונים", items: icons })} />
        </div>
    );
};

export default ElementsPanel;
