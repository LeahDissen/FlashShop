/**
 * Splits a Word document of numbered tips into separate tips.
 * A tip starts at a paragraph that begins with its number ("1.", "1)", "טיפ 1", "טיפ מס' 1"...);
 * everything after it – text, bullet points and images – belongs to it until the next number.
 * The tip's first image is its main image (shown at the top). Images get a "[[תמונה N]]" line at their
 * place in the text (see tipBody.js) – all of them, except a first image that comes before any text,
 * which is only the main image. A document without numbered tips is one tip, titled by its first line.
 */
import { imageMarker } from './tipBody';

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

/** A list item's own text, without the items of a list nested in it (they are lines of their own) */
const ownTextOf = (li) => {
    const copy = li.cloneNode(true);
    copy.querySelectorAll('ul, ol').forEach((nested) => nested.remove());
    return textOf(copy);
};

/** The list's items as lines: "• " for bullets, "1. " for numbered items; nested lists in order */
const listLines = (list) => Array.from(list.querySelectorAll('li')).map((li) => {
    const item = ownTextOf(li);
    if (!item) return null;
    const parent = li.parentElement;
    const position = Array.from(parent.children).indexOf(li) + 1;
    return parent.tagName === 'OL' ? `${position}. ${item}` : `• ${item}`;
}).filter(Boolean);

/** A new tip being collected from the document */
const newTip = (number, title) => ({ number, title, lines: [], mainImage: '', images: [] });

/**
 * The node's images: the first image of the tip becomes its main image; each image after text (and
 * every later image) also gets a marker line at its place and joins the body images.
 */
const collectImages = (tip, node) => {
    const found = node.tagName === 'IMG' ? [node] : Array.from(node.querySelectorAll?.('img') || []);
    found.forEach((img) => {
        if (!img.src) return;
        const isFirst = !tip.mainImage;
        if (isFirst) tip.mainImage = img.src;
        if (isFirst && !tip.lines.length) return;
        tip.images.push(img.src);
        tip.lines.push(imageMarker(tip.images.length - 1));
    });
};

/**
 * @param {string} html mammoth's HTML of the document (images as data URLs)
 * @param {string} [fallbackTitle] the title of a document without numbered tips (e.g. the file name)
 * @returns {{ number: number, title: string, content: string, mainImage: string, images: string[] }[]}
 */
export function splitTips(html, fallbackTitle = '') {
    const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html');
    const tips = [];
    let current = null;

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
            current = newTip(start.number, start.title);
            tips.push(current);
            collectImages(current, node);
            continue;
        }
        if (!current) continue; // text before the first tip (e.g. the document's title)
        if (isList) {
            current.lines.push(...listLines(node));
        } else if (text) {
            // A tip whose title is on its own line after the number ("1." then the heading)
            if (!current.title) current.title = text;
            else current.lines.push(text);
        }
        collectImages(current, node);
    }

    if (!tips.length) {
        const single = singleTip(doc.body, fallbackTitle);
        if (single) tips.push(single);
    }

    return tips
        .map(({ lines, ...tip }) => ({ ...tip, content: lines.join('\n') }))
        .sort((a, b) => a.number - b.number);
}

/** A document of one tip without a number: its first short line is the title, the rest its content */
function singleTip(body, fallbackTitle) {
    const tip = newTip(1, '');
    for (const node of Array.from(body.children)) {
        const text = textOf(node);
        const isList = node.tagName === 'UL' || node.tagName === 'OL';
        if (!tip.title && text && text.length <= 150 && !isList) tip.title = text;
        else if (isList) tip.lines.push(...listLines(node));
        else if (text) tip.lines.push(text);
        collectImages(tip, node);
    }
    if (!tip.title && !tip.lines.length && !tip.mainImage) return null;
    if (!tip.title) tip.title = String(fallbackTitle || '').replace(/\.docx$/i, '').trim();
    return tip;
}

/** Reads a .docx in the browser: mammoth is loaded only when a document is imported */
export async function readTipsFromDocx(file) {
    const { default: mammoth } = await import('mammoth/mammoth.browser.js');
    const arrayBuffer = await file.arrayBuffer();
    const { value: html } = await mammoth.convertToHtml({ arrayBuffer });
    return splitTips(html, file.name);
}

/** A data: URL image from the document as a File, for uploading */
export async function dataUrlToFile(dataUrl, name) {
    const blob = await (await fetch(dataUrl)).blob();
    const ext = (blob.type.split('/')[1] || 'png').replace('jpeg', 'jpg');
    return new File([blob], `${name}.${ext}`, { type: blob.type || 'image/png' });
}
