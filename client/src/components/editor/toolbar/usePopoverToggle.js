import { useEffect, useRef, useState } from 'react';

/**
 * Open/closed state of a toolbar popover, closed by a click outside its anchor (`ref`).
 * The panels are rendered in a portal outside the toolbar, so a click inside a panel is not "outside".
 */
export function usePopoverToggle() {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        if (!open) return undefined;
        const handleClickOutside = (event) => {
            if (event.target.closest?.('[data-toolbar-popover]')) return;
            if (ref.current && !ref.current.contains(event.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [open]);

    return { open, setOpen, toggle: () => setOpen((value) => !value), ref };
}
