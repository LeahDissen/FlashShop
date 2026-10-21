import { XIcon } from '../../icons';
import { shapeOutlinePath } from '../../../utils/productShapes';

/**
 * Overlays drawn over the design but never printed: the capture leaves out the classes
 * canvas-grid-overlay, canvas-safe-zone-overlay and canvas-shape-outline (useCanvasCapture).
 */

/** The warning shown when the design goes outside the safe zone or too close to the edge */
export function ZoneWarningToast({ warning, onDismiss }) {
    return (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 w-full max-w-lg px-4 pointer-events-none">
            <div
                role="alert"
                className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm font-medium shadow-lg pointer-events-auto ${
                    warning.type === 'error'
                        ? 'border-red-400 bg-red-50 text-red-900'
                        : 'border-amber-400 bg-amber-50 text-amber-900'
                }`}
            >
                <p className="flex-1 text-right leading-relaxed">{warning.message}</p>
                <button
                    type="button"
                    onClick={onDismiss}
                    className="shrink-0 p-1 rounded-md hover:bg-black/10 transition-colors"
                    aria-label="סגור הודעה"
                >
                    <XIcon className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

export function GridOverlay({ cellSize }) {
    return (
        <div
            className="absolute inset-0 pointer-events-none z-30 opacity-30 canvas-grid-overlay"
            style={{
                backgroundImage: 'linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)',
                backgroundSize: `${cellSize}px ${cellSize}px`,
            }}
        />
    );
}

/** The dashed outline of a built-in product shape (heart, circle...), so the customer sees its edge */
export function ShapeOutline({ shape }) {
    const path = shapeOutlinePath(shape);
    if (!path) return null;
    return (
        <svg
            className="absolute inset-0 w-full h-full pointer-events-none canvas-shape-outline"
            viewBox="0 0 100 100"
            style={{ zIndex: 95 }}
            aria-hidden="true"
        >
            <path d={path} fill="none" stroke="#f2665e" strokeWidth="0.8" strokeDasharray="2 1.5" vectorEffect="non-scaling-stroke" />
        </svg>
    );
}

/** The dashed safe-zone frame (dark and light dashes, visible on any background) */
export function SafeZoneFrame({ insets }) {
    return (
        <div
            className="absolute pointer-events-none canvas-safe-zone-overlay"
            style={{
                top: `${insets.top}px`,
                left: `${insets.left}px`,
                right: `${insets.right}px`,
                bottom: `${insets.bottom}px`,
                zIndex: 90,
            }}
            aria-hidden="true"
        >
            <svg width="100%" height="100%" preserveAspectRatio="none" style={{ display: 'block', overflow: 'visible' }} aria-hidden="true">
                <rect width="100%" height="100%" fill="none" stroke="rgba(0, 0, 0, 0.45)" strokeWidth="1" strokeDasharray="7 5" vectorEffect="non-scaling-stroke" />
                <rect width="100%" height="100%" fill="none" stroke="rgba(255, 255, 255, 0.75)" strokeWidth="1" strokeDasharray="7 5" strokeDashoffset="7" vectorEffect="non-scaling-stroke" />
            </svg>
        </div>
    );
}
