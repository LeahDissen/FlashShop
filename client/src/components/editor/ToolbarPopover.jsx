import { useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';

const VIEWPORT_MARGIN = 8;

/**
 * Panel that opens below a toolbar button.
 * Rendered in a portal with fixed positioning because the toolbar scrolls horizontally (overflow-x: auto),
 * which makes the browser clip any absolute element taller than the toolbar.
 * The element is marked with data-toolbar-popover so a click inside it is not treated as an "outside click".
 */
const ToolbarPopover = ({ anchorRef, width = 288, align = 'start', className = '', children }) => {
    const [position, setPosition] = useState(null);

    useLayoutEffect(() => {
        const update = () => {
            const rect = anchorRef.current?.getBoundingClientRect();
            if (!rect) return;
            const preferredLeft = align === 'center'
                ? rect.left + rect.width / 2 - width / 2
                : rect.left;
            const maxLeft = window.innerWidth - width - VIEWPORT_MARGIN;
            setPosition({
                top: rect.bottom + VIEWPORT_MARGIN,
                left: Math.min(Math.max(VIEWPORT_MARGIN, preferredLeft), Math.max(VIEWPORT_MARGIN, maxLeft)),
            });
        };

        update();
        window.addEventListener('resize', update);
        window.addEventListener('scroll', update, true);
        return () => {
            window.removeEventListener('resize', update);
            window.removeEventListener('scroll', update, true);
        };
    }, [anchorRef, width, align]);

    if (!position) return null;

    return createPortal(
        <div
            data-toolbar-popover
            dir="rtl"
            className={`fixed z-[60] bg-white border border-gray-200 rounded-xl shadow-xl ${className}`}
            style={{ top: position.top, left: position.left, width }}
        >
            {children}
        </div>,
        document.body,
    );
};

export default ToolbarPopover;
