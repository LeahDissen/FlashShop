import { lazy } from 'react';

const RELOAD_FLAG = 'flashshop_chunk_reload';

/**
 * כמו React.lazy, אבל אם קובץ הקוד של העמוד לא נמצא (קורה אחרי פריסה חדשה, כשהדפדפן
 * עוד מחזיק את הגרסה הקודמת) – טוען את האתר מחדש פעם אחת במקום להשאיר מסך ריק.
 * @param {() => Promise<{ default: React.ComponentType }>} importer
 */
export function lazyWithReload(importer) {
    return lazy(() => importer()
        .then((module) => {
            sessionStorage.removeItem(RELOAD_FLAG);
            return module;
        })
        .catch((error) => {
            if (sessionStorage.getItem(RELOAD_FLAG)) throw error; // כבר ניסינו – לא נכנסים ללולאת רענונים
            sessionStorage.setItem(RELOAD_FLAG, '1');
            window.location.reload();
            return new Promise(() => {}); // הדף מתרענן; לא מציגים שגיאה בינתיים
        }));
}
