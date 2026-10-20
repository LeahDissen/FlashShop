import { ReactCrop } from 'react-image-crop';
import ElementContent from './ElementContent';

const FIXED_SIZE_TYPES = ['image', 'shape', 'text', 'globalFrame'];
const CROPPING_Z_INDEX = 50;
const EDITING_TEXT_Z_INDEX = 1100;

/** A short description for screen readers */
function ariaLabelOf(el, isSelected) {
    let label = el.type;
    if (el.type === 'text') label = `Text: ${el.content.length > 20 ? `${el.content.substring(0, 20)}...` : el.content}`;
    else if (el.type === 'image') label = 'Image';
    else if (el.type === 'shape') label = 'Shape';
    if (el.locked) label += ' (Locked)';
    if (isSelected) label += ' (Selected)';
    return label;
}

function CropTool({ element, crop, onCancelCrop }) {
    return (
        <>
            <ReactCrop crop={crop.crop} onChange={(c) => crop.setCrop(c)} onComplete={(c) => crop.setCompletedCrop(c)}>
                <img
                    ref={crop.cropImageRef}
                    src={element.src}
                    alt="Image to crop"
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    onLoad={crop.handleCropImageLoad}
                />
            </ReactCrop>
            <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 flex gap-3 bg-white/90 p-2 rounded shadow z-50">
                <button
                    onClick={onCancelCrop}
                    className="px-4 py-2 bg-white text-gray-800 font-semibold rounded-md shadow hover:bg-gray-100 transition-colors"
                >
                    ביטול
                </button>
                <button
                    onClick={() => crop.saveCurrentCrop(element.id)}
                    className="px-6 py-2 bg-red-500 text-white font-semibold rounded-md shadow hover:bg-red-600 transition-colors"
                >
                    שמור
                </button>
            </div>
        </>
    );
}

/**
 * One element in the bottom or text layer: positioned and rotated, pressed to select and move,
 * a second tap on a selected text opens it for typing, and a photo being cropped shows the crop tool.
 */
export default function CanvasElement({
    element: el,
    zIndex,
    isSelected,
    croppingElementId,
    editing,
    interactions,
    crop,
    onSelect,
    onCancelCrop,
}) {
    const isCroppingThis = el.id === croppingElementId;
    const isEditingThis = el.id === editing.editingElementId;
    // A free frame has its own width and height; without this the width is "auto" and shrinks when it is moved right
    const hasFixedSize = FIXED_SIZE_TYPES.includes(el.type);

    return (
        <div
            style={{
                position: 'absolute',
                top: `${el.top}px`,
                left: `${el.left}px`,
                width: hasFixedSize ? `${el.width}px` : 'auto',
                height: hasFixedSize ? `${el.height}px` : 'auto',
                transform: `rotate(${el.rotation || 0}deg)`,
                transformOrigin: 'center center',
                zIndex: isCroppingThis ? CROPPING_Z_INDEX : (isEditingThis ? EDITING_TEXT_Z_INDEX : zIndex),
            }}
            role="button"
            tabIndex={0}
            aria-label={ariaLabelOf(el, isSelected)}
            aria-pressed={isSelected}
            onKeyDown={(e) => {
                // While typing in the text, Space/Enter belong to the text
                if ((el.type === 'text' && isEditingThis) || e.target.isContentEditable) return;
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    if (!croppingElementId) onSelect(el.id);
                }
            }}
        >
            <div
                style={{
                    position: 'relative',
                    width: hasFixedSize ? '100%' : 'auto',
                    height: hasFixedSize ? '100%' : 'auto',
                    cursor: isCroppingThis ? 'default' : (el.locked ? 'not-allowed' : (isEditingThis ? 'text' : 'move')),
                    userSelect: isEditingThis ? 'text' : 'none',
                    ...(el.type === 'image' && { overflow: isCroppingThis ? 'visible' : 'hidden' }),
                }}
                onPointerDown={(e) => {
                    if (e.pointerType === 'mouse' && e.button !== 0) return;
                    interactions.startDrag(e, el);
                }}
                onClick={(e) => {
                    if (croppingElementId) return;
                    e.stopPropagation();
                    if (interactions.isSecondTapOnText(el)) {
                        editing.startTextEditing(el.id);
                        return;
                    }
                    onSelect(el.id);
                }}
            >
                {isCroppingThis
                    ? <CropTool element={el} crop={crop} onCancelCrop={onCancelCrop} />
                    : <ElementContent element={el} editing={editing} />}
            </div>
        </div>
    );
}
