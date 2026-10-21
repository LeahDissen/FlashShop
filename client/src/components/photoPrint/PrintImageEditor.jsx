import { useEffect, useRef, useState } from 'react';
import { HANDLE_ORDS, resizePlacement, scalePlacement } from './placement';

const HANDLE_STYLE = {
    nw: { left: 0, top: 0, cursor: 'nwse-resize' },
    n: { left: '50%', top: 0, cursor: 'ns-resize' },
    ne: { left: '100%', top: 0, cursor: 'nesw-resize' },
    e: { left: '100%', top: '50%', cursor: 'ew-resize' },
    se: { left: '100%', top: '100%', cursor: 'nwse-resize' },
    s: { left: '50%', top: '100%', cursor: 'ns-resize' },
    sw: { left: 0, top: '100%', cursor: 'nesw-resize' },
    w: { left: 0, top: '50%', cursor: 'ew-resize' },
};

/**
 * The print frame with the photo inside: drag to move, handles to resize, the wheel to zoom.
 * Everything outside the frame is dimmed; children (frame overlay, captions) are drawn on top.
 */
const PrintImageEditor = ({
    imageSrc,
    aspect,
    placement,
    onChange,
    backgroundColor,
    disabled,
    children,
    onFrameSize,
}) => {
    const stageRef = useRef(null);
    const dragRef = useRef(null);
    const [frameSize, setFrameSize] = useState({ width: 0, height: 0 });

    useEffect(() => {
        const stage = stageRef.current;
        if (!stage) return undefined;

        const update = () => {
            const maxW = Math.max(80, stage.clientWidth - 16);
            const maxH = Math.max(80, stage.clientHeight - 16);
            let width = maxW;
            let height = width / aspect;
            if (height > maxH) {
                height = maxH;
                width = height * aspect;
            }
            const next = { width, height };
            setFrameSize(next);
            onFrameSize?.(next);
        };

        update();
        const observer = new ResizeObserver(update);
        observer.observe(stage);
        return () => observer.disconnect();
    }, [aspect, onFrameSize]);

    useEffect(() => {
        const stage = stageRef.current;
        if (!stage) return undefined;
        const onWheel = (event) => {
            if (disabled || !placement) return;
            event.preventDefault();
            event.stopPropagation();
            const factor = event.deltaY > 0 ? 0.94 : 1.06;
            onChange(scalePlacement(placement, factor));
        };
        stage.addEventListener('wheel', onWheel, { passive: false });
        return () => stage.removeEventListener('wheel', onWheel);
    }, [disabled, placement, onChange]);

    const stop = (event) => event.stopPropagation();

    const handlePointerDown = (event, ord = null) => {
        if (disabled || !placement) return;
        stop(event);
        event.currentTarget.setPointerCapture?.(event.pointerId);
        dragRef.current = {
            pointerId: event.pointerId,
            ord,
            startX: event.clientX,
            startY: event.clientY,
            box: { ...placement },
        };
    };

    const handlePointerMove = (event) => {
        const drag = dragRef.current;
        if (!drag || event.pointerId !== drag.pointerId || !frameSize.width) return;
        stop(event);
        const dx = event.clientX - drag.startX;
        const dy = event.clientY - drag.startY;
        if (drag.ord) {
            onChange(resizePlacement(
                drag.box,
                drag.ord,
                dx,
                dy,
                (drag.box.w * frameSize.width) / (drag.box.h * frameSize.height),
                frameSize.width,
                frameSize.height,
            ));
            return;
        }
        onChange({
            ...drag.box,
            x: drag.box.x + dx / frameSize.width,
            y: drag.box.y + dy / frameSize.height,
        });
    };

    const handlePointerUp = (event) => {
        if (dragRef.current?.pointerId !== event.pointerId) return;
        dragRef.current = null;
    };

    return (
        <div
            ref={stageRef}
            className="relative w-full h-full flex items-center justify-center"
        >
            <div
                className="relative overflow-visible"
                style={{
                    width: frameSize.width,
                    height: frameSize.height,
                    backgroundColor,
                    boxShadow: '0 0 0 9999px rgba(0,0,0,0.55)',
                }}
            >
                <div className="absolute inset-0 overflow-hidden">
                    {placement && (
                        <img
                            src={imageSrc}
                            alt=""
                            draggable={false}
                            className={`absolute max-w-none select-none ${disabled ? '' : 'cursor-move'}`}
                            style={{
                                left: `${placement.x * 100}%`,
                                top: `${placement.y * 100}%`,
                                width: `${placement.w * 100}%`,
                                height: `${placement.h * 100}%`,
                            }}
                            onPointerDown={(event) => handlePointerDown(event, null)}
                            onPointerMove={handlePointerMove}
                            onPointerUp={handlePointerUp}
                            onPointerCancel={handlePointerUp}
                        />
                    )}
                </div>

                <div className="absolute inset-0 pointer-events-none border-2 border-white/90">
                    <div className="absolute inset-0 opacity-40">
                        <div className="absolute top-1/3 right-0 left-0 border-t border-white" />
                        <div className="absolute top-2/3 right-0 left-0 border-t border-white" />
                        <div className="absolute left-1/3 top-0 bottom-0 border-l border-white" />
                        <div className="absolute left-2/3 top-0 bottom-0 border-l border-white" />
                    </div>
                </div>

                {placement && !disabled && (
                    <div
                        className="absolute pointer-events-none"
                        style={{
                            left: `${placement.x * 100}%`,
                            top: `${placement.y * 100}%`,
                            width: `${placement.w * 100}%`,
                            height: `${placement.h * 100}%`,
                        }}
                    >
                        {HANDLE_ORDS.map((ord) => (
                            <button
                                key={ord}
                                type="button"
                                aria-label={`שנה גודל ${ord}`}
                                className="absolute z-20 w-3 h-3 bg-white border border-gray-700 rounded-[2px] p-0 pointer-events-auto"
                                style={{
                                    ...HANDLE_STYLE[ord],
                                    transform: 'translate(-50%, -50%)',
                                }}
                                onPointerDown={(event) => handlePointerDown(event, ord)}
                                onPointerMove={handlePointerMove}
                                onPointerUp={handlePointerUp}
                                onPointerCancel={handlePointerUp}
                            />
                        ))}
                    </div>
                )}

                {children}
            </div>
        </div>
    );
};

export default PrintImageEditor;
