import ElementContent from './ElementContent';
import SelectionControls from './SelectionControls';

const FIXED_SIZE_TYPES = ['image', 'shape', 'text', 'globalFrame'];
/** Above the frame for the frame itself and collage photos; otherwise above the design */
const OVER_FRAME_Z_INDEX = 600;
const OVER_DESIGN_Z_INDEX = 100;

/** An invisible surface over the selected element that can be pressed to move it */
function MoveSurface({ element, label, startDrag }) {
    return (
        <div
            style={{ position: 'absolute', inset: 0, pointerEvents: 'auto', cursor: 'move', background: 'transparent' }}
            onPointerDown={(e) => {
                if (e.pointerType === 'mouse' && e.button !== 0) return;
                e.stopPropagation();
                startDrag(e, element);
            }}
            onClick={(e) => e.stopPropagation()}
            aria-label={label}
        />
    );
}

/**
 * The selected element's frame and controls, drawn on top of everything at the element's place.
 * The frame and collage photos sit under other layers, so they get a surface here to be moved by.
 */
export default function SelectionOverlay({ element, editing, interactions, onToggleLock, onDuplicate, onDelete }) {
    const hasFixedSize = FIXED_SIZE_TYPES.includes(element.type);
    const isFrame = element.type === 'globalFrame';
    const isCollagePhoto = Boolean(element.dropzoneId);

    return (
        <div
            style={{
                position: 'absolute',
                top: `${element.top}px`,
                left: `${element.left}px`,
                width: hasFixedSize ? `${element.width}px` : 'auto',
                height: hasFixedSize ? `${element.height}px` : 'auto',
                transform: `rotate(${element.rotation || 0}deg)`,
                transformOrigin: 'center center',
                zIndex: isFrame || isCollagePhoto ? OVER_FRAME_Z_INDEX : OVER_DESIGN_Z_INDEX,
                pointerEvents: 'none',
            }}
        >
            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                {element.type !== 'text' && !isFrame && !isCollagePhoto && <ElementContent element={element} isGhost editing={editing} />}
                {isFrame && !element.locked && <MoveSurface element={element} label="הזז מסגרת" startDrag={interactions.startDrag} />}
                {isCollagePhoto && !element.locked && <MoveSurface element={element} label="הזז תמונה בחלון" startDrag={interactions.startDrag} />}
                <SelectionControls
                    element={element}
                    onStartEditing={editing.startTextEditing}
                    onToggleLock={onToggleLock}
                    onDuplicate={onDuplicate}
                    onDelete={onDelete}
                    onRotateStart={interactions.startRotation}
                    onResizeStart={interactions.startResize}
                />
            </div>
        </div>
    );
}
