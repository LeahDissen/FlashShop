import { useEffect, useRef } from 'react';
import { detectTextDirection } from '../../utils/cropImage';
import { clamp } from './photoPrintOptions';

/** A caption on the photo: tap to type in it, drag to move it */
const DraggableCaption = ({
    caption,
    selected,
    editing,
    cropSize,
    disabled,
    placeholder,
    onSelect,
    onChange,
    onStartEdit,
    onEndEdit,
}) => {
    const editorRef = useRef(null);
    const dragRef = useRef(null);
    const dir = detectTextDirection(caption.content);

    useEffect(() => {
        const node = editorRef.current;
        if (!node || document.activeElement === node) return;
        const next = caption.content || '';
        if (node.innerText !== next) node.innerText = next;
    }, [caption.content, caption.fontFamily, caption.fontSize, caption.color, editing, placeholder]);

    useEffect(() => {
        if (!editing || !editorRef.current) return;
        const node = editorRef.current;
        node.focus();
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(node);
        range.collapse(caption.content ? false : true);
        selection?.removeAllRanges();
        selection?.addRange(range);
        // Focus once when edit mode starts.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editing]);

    const stopCropper = (event) => {
        event.stopPropagation();
    };

    const handlePointerDown = (event) => {
        if (disabled) return;
        stopCropper(event);
        onSelect();
        if (editing && event.target === editorRef.current) return;

        dragRef.current = {
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            origX: Number.isFinite(Number(caption.x)) ? Number(caption.x) : 0.5,
            origY: Number.isFinite(Number(caption.y)) ? Number(caption.y) : 0.92,
            moved: false,
        };
        event.currentTarget.setPointerCapture(event.pointerId);
    };

    const handlePointerMove = (event) => {
        const drag = dragRef.current;
        if (!drag || event.pointerId !== drag.pointerId) return;
        stopCropper(event);
        const dx = event.clientX - drag.startX;
        const dy = event.clientY - drag.startY;
        if (!drag.moved && Math.abs(dx) < 4 && Math.abs(dy) < 4) return;
        drag.moved = true;
        if (editing) onEndEdit();
        if (!cropSize?.width || !cropSize?.height) return;
        onChange({
            x: clamp(drag.origX + dx / cropSize.width, 0.04, 0.96),
            y: clamp(drag.origY + dy / cropSize.height, 0.08, 0.98),
        });
    };

    const handlePointerUp = (event) => {
        const drag = dragRef.current;
        if (!drag || event.pointerId !== drag.pointerId) return;
        stopCropper(event);
        dragRef.current = null;
        if (!drag.moved) onStartEdit();
    };

    return (
        <div
            className={`absolute z-30 max-w-[90%] px-1 pointer-events-auto ${
                selected ? 'ring-1 ring-white/90 rounded-sm' : ''
            } ${editing ? 'cursor-text' : 'cursor-grab active:cursor-grabbing'}`}
            style={{
                left: `${(caption.x ?? 0.5) * 100}%`,
                top: `${(caption.y ?? 0.92) * 100}%`,
                transform: 'translate(-50%, -100%)',
                touchAction: 'none',
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onWheel={stopCropper}
            onTouchStart={stopCropper}
        >
            <div
                ref={editorRef}
                role="textbox"
                aria-multiline="true"
                aria-label="כתובית"
                contentEditable={!disabled && editing}
                suppressContentEditableWarning
                dir={dir}
                className="min-w-[3rem] outline-none whitespace-pre-wrap text-center bg-transparent empty:before:content-[attr(data-placeholder)] empty:before:opacity-50"
                data-placeholder={placeholder || 'כתובית לתמונה'}
                style={{
                    color: caption.color,
                    fontFamily: caption.fontFamily,
                    fontSize: `${caption.fontSize}px`,
                    textShadow: '0 1px 4px rgba(0,0,0,0.65)',
                    caretColor: caption.color,
                    unicodeBidi: 'plaintext',
                }}
                onInput={(event) => onChange({ content: event.currentTarget.innerText })}
                onBlur={onEndEdit}
            />
        </div>
    );
};

export default DraggableCaption;
