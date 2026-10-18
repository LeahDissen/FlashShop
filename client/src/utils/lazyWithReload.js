import { lazy } from 'react';

const RELOAD_FLAG = 'flashshop_chunk_reload';

/**
 * Like React.lazy, but if the page's code file is missing (happens after a new deploy, while the browser
 * still holds the previous version) – reloads the site once instead of leaving a blank screen.
 * @param {() => Promise<{ default: React.ComponentType }>} importer
 */
export function lazyWithReload(importer) {
    return lazy(() => importer()
        .then((module) => {
            sessionStorage.removeItem(RELOAD_FLAG);
            return module;
        })
        .catch((error) => {
            if (sessionStorage.getItem(RELOAD_FLAG)) throw error; // Already tried – don't enter a reload loop
            sessionStorage.setItem(RELOAD_FLAG, '1');
            window.location.reload();
            return new Promise(() => {}); // The page is reloading; don't show an error meanwhile
        }));
}
