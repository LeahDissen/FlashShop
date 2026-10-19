import { downloadZip } from 'client-zip';

/** Makes Windows Notepad read the summary file as UTF-8 (Hebrew) */
const UTF8_BOM = String.fromCharCode(0xfeff);
/** Files fetched at the same time while building the archive */
const PARALLEL_FETCHES = 4;

export const extensionFromSrc = (src) => {
    if (!src || typeof src !== 'string') return 'jpg';
    if (src.startsWith('data:image/png')) return 'png';
    if (src.startsWith('data:image/webp')) return 'webp';
    if (src.startsWith('data:image/gif')) return 'gif';
    const fromUrl = src.split('?')[0].match(/\.(png|jpe?g|webp|gif|svg|heic|pdf)$/i);
    return fromUrl ? fromUrl[1].toLowerCase().replace('jpeg', 'jpg') : 'jpg';
};

/** Keeps a name safe for every file system (Windows included) */
const safeName = (text) => String(text || '')
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80);

/** "פיתוח תמונה 10x15 (IMG_0009.JPG)" -> "IMG_0009" */
const originalFileName = (itemName) => {
    const match = String(itemName || '').match(/\(([^)]+)\)\s*$/);
    return match ? match[1].replace(/\.[^.]+$/, '') : '';
};

const itemFiles = (item) => {
    if (item.customization?.type === 'designer-service') {
        return [{ src: item.customization.referenceImage, kind: 'מצורף' }];
    }
    return [
        { src: item.image, kind: '' },
        { src: item.customization?.referenceImage, kind: 'מצורף' },
    ];
};

/**
 * One entry per file to print. The name carries what the printer needs:
 * line number, size and number of copies, then the customer's own file name.
 */
export function buildOrderFileList(order) {
    const entries = [];
    const seen = new Set();
    const width = String(order.items.length).length;

    order.items.forEach((item, index) => {
        const line = String(index + 1).padStart(Math.max(2, width), '0');
        const size = item.size ? safeName(item.size) : '';
        const copies = `x${Math.max(1, Number(item.quantity) || 1)}`;
        const label = safeName(originalFileName(item.name) || item.name);

        itemFiles(item).forEach(({ src, kind }) => {
            if (!src || typeof src !== 'string' || seen.has(src)) return;
            seen.add(src);
            const parts = [line, size, copies, kind, label].filter(Boolean);
            entries.push({ src, name: `${parts.join('_')}.${extensionFromSrc(src)}`, item });
        });
    });
    return entries;
}

const orderSummaryText = (order, entries, failed) => {
    const lines = [
        `הזמנה ${String(order._id).slice(-8).toUpperCase()}`,
        `לקוחה: ${order.customer?.name || ''} ${order.customer?.phone || ''}`.trim(),
        `קבצים: ${entries.length - failed.length} מתוך ${entries.length}`,
        '',
        'שם הקובץ מתחיל במספר השורה, בגודל ובמספר העותקים להדפסה.',
        '',
        ...entries.map((e) => `${e.name}  ·  ${e.item.name || ''}`),
    ];
    if (failed.length) {
        lines.push('', 'קבצים שלא ירדו (אפשר להוריד אותם אחד-אחד בעמוד ההזמנה):', ...failed.map((e) => e.name));
    }
    return `${UTF8_BOM}${lines.join('\r\n')}\r\n`;
};

/**
 * Downloads every file of the order into one ZIP, in the browser.
 * A file that cannot be fetched is listed in the summary file instead of stopping the download.
 * @returns {Promise<{ total: number, failed: number }>}
 */
export async function downloadOrderZip(order, onProgress = () => {}) {
    const entries = buildOrderFileList(order);
    const fetched = new Array(entries.length);
    const failed = [];
    let done = 0;
    let next = 0;

    const worker = async () => {
        while (next < entries.length) {
            const index = next;
            next += 1;
            const entry = entries[index];
            try {
                const response = await fetch(entry.src, { mode: 'cors' });
                if (!response.ok) throw new Error(String(response.status));
                fetched[index] = { name: entry.name, input: await response.blob() };
            } catch {
                failed.push(entry);
            }
            done += 1;
            onProgress(done, entries.length);
        }
    };
    await Promise.all(Array.from({ length: Math.min(PARALLEL_FETCHES, entries.length) }, worker));

    const files = [
        { name: 'פרטי-ההזמנה.txt', input: orderSummaryText(order, entries, failed) },
        ...fetched.filter(Boolean),
    ];
    const blob = await downloadZip(files).blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `הזמנה-${String(order._id).slice(-8).toUpperCase()}.zip`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);

    return { total: entries.length, failed: failed.length };
}
