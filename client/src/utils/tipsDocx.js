/**
 * Splits a Word document of numbered tips into separate tips.
 * A tip starts at a paragraph that begins with its number ("1.", "1)", "טיפ 1", "טיפ מס' 1"...);
 * everything after it – text, bullet points and images – belongs to it until the next number.
 */

const TIP_START = /^\s*(?:טיפ\s*(?:מס(?:פר)?['׳"]?\.?\s*)?)?(\d{1,3})\s*[.):\-–]?\s*(.*)$/;

/** The tip number and title when this paragraph starts a tip, else null */
export function parseTipStart(text) {
    const match = TIP_START.exec(String(text || ''));
    if (!match) return null;
    // "1.1 ..." is a sub-section inside a tip, not a new tip
    if (/^\s*\d{1,3}\.\d/.test(text)) return null;
    const startsWithWord = /^\s*טיפ/.test(text);
    const hasSeparator = /^\s*\d{1,3}\s*[.):\-–]/.test(text);
    // "2024 was..." is a sentence, not tip 2024: a bare number needs a separator or the word "טיפ"
    if (!startsWithWord && !hasSeparator) return null;
    return { number: Number(match[1]), title: match[2].trim() };
}

const textOf = (node) => (node.textContent || '').replace(/\s+/g, ' ').trim();

/**
 * @param {string} html mammoth's HTML of the document (images as data URLs)
 * @returns {{ number: number, title: string, content: string, images: string[] }[]}
 */
export function splitTips(html) {
    const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html');
    const tips = [];
    let current = null;

    const addImages = (node) => {
        if (!current) return;
        node.querySelectorAll?.('img').forEach((img) => img.src && current.images.push(img.src));
        if (node.tagName === 'IMG' && node.src) current.images.push(node.src);
    };

    for (const node of Array.from(doc.body.children)) {
        const text = textOf(node);
        const isList = node.tagName === 'UL' || node.tagName === 'OL';
        let start = !isList ? parseTipStart(text) : null;
        // Word's automatic numbering: the number is not in the text, and each numbered heading comes as
        // a one-item ordered list between the tips' content
        const items = node.tagName === 'OL' ? node.querySelectorAll(':scope > li') : [];
        if (!start && items.length === 1 && text && text.length <= 150) {
            start = { number: tips.length + 1, title: text };
        }
        if (start) {
            current = { number: start.number, title: start.title, lines: [], images: [] };
            tips.push(current);
            addImages(node);
            continue;
        }
        if (!current) continue; // text before the first tip (e.g. the document's title)
        if (isList) {
            node.querySelectorAll('li').forEach((li, index) => {
                const item = textOf(li);
                if (item) current.lines.push(node.tagName === 'OL' ? `${index + 1}. ${item}` : `• ${item}`);
            });
        } else if (text) {
            // A tip whose title is on its own line after the number ("1." then the heading)
            if (!current.title) current.title = text;
            else current.lines.push(text);
        }
        addImages(node);
    }

    return tips
        .map(({ lines, ...tip }) => ({ ...tip, content: lines.join('\n') }))
        .sort((a, b) => a.number - b.number);
}

/** Reads a .docx in the browser: mammoth is loaded only when a document is imported */
export async function readTipsFromDocx(file) {
    const { default: mammoth } = await import('mammoth/mammoth.browser.js');
    const arrayBuffer = await file.arrayBuffer();
    const { value: html } = await mammoth.convertToHtml({ arrayBuffer });
    return splitTips(html);
}

/** A data: URL image from the document as a File, for uploading */
export async function dataUrlToFile(dataUrl, name) {
    const blob = await (await fetch(dataUrl)).blob();
    const ext = (blob.type.split('/')[1] || 'png').replace('jpeg', 'jpg');
    return new File([blob], `${name}.${ext}`, { type: blob.type || 'image/png' });
}
