import { DuplicateIcon, LockIcon, RotateIcon, TextIcon, TrashIcon, UnlockIcon } from '../../icons';
import { getCursorForHandle } from './canvasGeometry';

const HANDLE_POSITIONS = {
    tl: { top: '-6px', left: '-6px' },
    tr: { top: '-6px', right: '-6px' },
    bl: { bottom: '-6px', left: '-6px' },
    br: { bottom: '-6px', right: '-6px' },
};
const RESIZABLE_TYPES = ['image', 'shape', 'globalFrame'];
const stopPropagation = (event) => event.stopPropagation();

/** Runs an action from a toolbar button without the click reaching the canvas */
const withoutBubbling = (action) => (event) => {
    event.stopPropagation();
    action();
};

/**
 * The selected element's controls: a small toolbar above it (edit text, lock, duplicate, delete),
 * its border, a rotate handle below it and corner handles for resizing.
 */
export default function SelectionControls({ element, onStartEditing, onToggleLock, onDuplicate, onDelete, onRotateStart, onResizeStart }) {
    const isResizable = RESIZABLE_TYPES.includes(element.type);
    return (
        <>
            <div
                className="absolute left-1/2 -translate-x-1/2 bg-white rounded-lg shadow-lg flex items-center gap-1 p-1"
                style={{ top: '-45px', pointerEvents: 'auto', zIndex: 100 }}
                onMouseDown={stopPropagation}
                onPointerDown={stopPropagation}
                onTouchStart={stopPropagation}
            >
                {element.type === 'text' && !element.locked && (
                    <button
                        type="button"
                        onClick={withoutBubbling(() => onStartEditing(element.id))}
                        aria-label="ערוך טקסט"
                        className="p-2 text-[#f2665e] hover:bg-red-50 rounded-md"
                    >
                        <TextIcon className="w-5 h-5" />
                    </button>
                )}
                <button
                    onClick={withoutBubbling(onToggleLock)}
                    aria-label={element.locked ? 'בטל נעילה' : 'נעל'}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-md"
                >
                    {element.locked ? <UnlockIcon className="w-5 h-5" /> : <LockIcon className="w-5 h-5" />}
                </button>
                <button
                    onClick={withoutBubbling(onDuplicate)}
                    disabled={element.locked || element.type === 'globalFrame'}
                    aria-label="שכפל"
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-md disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                    <DuplicateIcon className="w-5 h-5" />
                </button>
                <button
                    onClick={withoutBubbling(onDelete)}
                    disabled={element.locked}
                    aria-label={element.type === 'globalFrame' ? 'הסר מסגרת' : 'מחק'}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-md disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                    <TrashIcon className="w-5 h-5" />
                </button>
            </div>

            <div
                style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    border: `2px solid ${element.locked ? '#f87171' : '#3B82F6'}`,
                    pointerEvents: 'none',
                }}
            />

            {/* Not for a photo inside a collage window (move/resize only) */}
            {!element.locked && !element.dropzoneId && (
                <div
                    className="absolute left-1/2 -translate-x-1/2 p-1 cursor-grab bg-white rounded-full shadow active:cursor-grabbing"
                    style={{ pointerEvents: 'auto', bottom: '-40px' }}
                    onMouseDown={(e) => onRotateStart(e, element)}
                >
                    <RotateIcon className="w-4 h-4 text-gray-700" />
                </div>
            )}

            {!element.locked && isResizable && Object.entries(HANDLE_POSITIONS).map(([handle, position]) => (
                <div
                    key={handle}
                    style={{
                        position: 'absolute',
                        width: '12px', height: '12px',
                        backgroundColor: 'white',
                        border: '2px solid #3B82F6',
                        borderRadius: '50%',
                        pointerEvents: 'auto',
                        ...position,
                        cursor: getCursorForHandle(handle, element.rotation || 0),
                    }}
                    onMouseDown={(e) => onResizeStart(e, element, handle)}
                />
            ))}
        </>
    );
}
