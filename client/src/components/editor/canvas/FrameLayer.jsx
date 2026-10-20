import ElementContent from './ElementContent';

const FRAME_LAYER_Z_INDEX = 500;

/** The canvas frame, above the design and the collage photos; pressed to select and move it */
export default function FrameLayer({ frames, selectedElementId, onSelect, startDrag, editing }) {
    return (
        <div className="absolute inset-0" style={{ zIndex: FRAME_LAYER_Z_INDEX, isolation: 'isolate' }}>
            {frames.map((el) => (
                <div
                    key={el.id}
                    role="button"
                    tabIndex={0}
                    aria-label={el.title ? `מסגרת: ${el.title}` : 'מסגרת עיצוב'}
                    aria-pressed={selectedElementId === el.id}
                    style={{
                        position: 'absolute',
                        top: `${el.top ?? 0}px`,
                        left: `${el.left ?? 0}px`,
                        width: `${el.width}px`,
                        height: `${el.height}px`,
                        pointerEvents: 'auto',
                        cursor: el.locked ? 'not-allowed' : 'move',
                        background: 'transparent',
                    }}
                    onPointerDown={(e) => {
                        if (e.pointerType === 'mouse' && e.button !== 0) return;
                        e.stopPropagation();
                        startDrag(e, el);
                    }}
                    onClick={(e) => {
                        e.stopPropagation();
                        onSelect(el.id);
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onSelect(el.id);
                        }
                    }}
                >
                    <ElementContent element={el} editing={editing} />
                </div>
            ))}
        </div>
    );
}
