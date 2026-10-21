/** An order line in the admin: what kind it is, its display name and the files to download for production */
import { extensionFromSrc } from '../../utils/orderDownloads';
import { shortOrderId } from '../orderStatus';

const CUSTOMIZATION_LABELS = {
    'upload-only': 'העלאת עיצוב מוכן',
    magnet: 'מגנט מותאם',
    'designer-service': 'שירות עיצוב גרפי',
};

export const isPhotoPrintItem = (item) => item.itemType === 'photo-print' || String(item.name || '').startsWith('פיתוח תמונה');

export function itemKindLabel(item) {
    if (item.itemType === 'photo-print') return 'פיתוח תמונות';
    if (item.customDesign) return 'עיצוב מהעורך';
    if (item.customization?.type && CUSTOMIZATION_LABELS[item.customization.type]) {
        return CUSTOMIZATION_LABELS[item.customization.type];
    }
    if (item.customization) return 'מוצר מותאם';
    return 'מוצר מהקטלוג';
}

/** "פיתוח תמונה (IMG_1.jpg)" → title and the customer's file name */
export function splitItemDisplayName(name) {
    const raw = String(name || '').trim();
    const match = raw.match(/^(.*)\s+\(([^)]+)\)\s*$/);
    if (!match) return { title: raw, fileName: null };
    return { title: match[1].trim(), fileName: match[2].trim() };
}

/**
 * The line's files with a button label and a file name each: the designer's attached photos,
 * each copy of a per-copy design, or the design and its attachment.
 */
export function collectItemDownloads(item, orderId, index) {
    const prefix = `order-${shortOrderId(orderId)}-item-${index + 1}`;
    const files = [];
    const seen = new Set();
    const add = (src, label, namePart) => {
        if (!src || typeof src !== 'string' || seen.has(src)) return;
        seen.add(src);
        files.push({ src, label, filename: `${prefix}-${namePart}.${extensionFromSrc(src)}` });
    };

    if (item.customization?.type === 'designer-service') {
        const references = item.customization.referenceImages?.length
            ? item.customization.referenceImages
            : [item.customization.referenceImage];
        references.forEach((src, i) => add(src, references.length > 1 ? `הורדת תמונה מצורפת ${i + 1}` : 'הורדת התמונה המצורפת', `reference-${i + 1}`));
        return files;
    }
    if (item.customDesign?.copies?.length) {
        item.customDesign.copies.forEach((copy, i) => add(copy.image, `עותק ${i + 1}`, `copy-${i + 1}`));
        return files;
    }
    add(item.image, 'הורדת תמונה', 'design');
    add(item.customization?.referenceImage, 'הורדת קובץ מצורף', 'reference');
    return files;
}

const clickDownloadLink = (href, filename) => {
    const link = document.createElement('a');
    link.href = href;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
};

/** Downloads a file under the given name; when the host does not allow it, it opens in a new tab */
export async function downloadAsset(src, filename) {
    try {
        if (src.startsWith('data:')) {
            clickDownloadLink(src, filename);
            return;
        }
        const response = await fetch(src, { mode: 'cors' });
        if (!response.ok) throw new Error('download failed');
        const url = URL.createObjectURL(await response.blob());
        clickDownloadLink(url, filename);
        URL.revokeObjectURL(url);
    } catch {
        window.open(src, '_blank', 'noopener,noreferrer');
    }
}

export async function copyText(value) {
    try {
        await navigator.clipboard.writeText(value);
    } catch {
        alert('לא ניתן להעתיק אוטומטית');
    }
}
