/**
 * Images inside a tip's text. The tip's `img` is its main image (at the top); `images` are the images
 * of its body. A line "[[תמונה 2]]" in the text shows images[1] at that place. Images no line refers
 * to are shown after the text, as before the markers existed.
 */

const MARKER_LINE = /^\s*\[\[\s*תמונה\s+(\d{1,3})\s*\]\]\s*$/;

/** The marker line for the body image at this index (0-based) */
export const imageMarker = (index) => `[[תמונה ${index + 1}]]`;

/** The text without its image marker lines (for summaries and previews) */
export const stripImageMarkers = (content) => String(content || '')
    .split('\n')
    .filter((line) => !MARKER_LINE.test(line))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

/**
 * The tip's body as blocks to render in order: text paragraphs and images.
 * @returns {({ type: 'text', text: string } | { type: 'image', src: string })[]}
 */
export function tipBodyBlocks(content, images = []) {
    const list = Array.isArray(images) ? images : [];
    const blocks = [];
    const used = new Set();
    let text = [];
    const flushText = () => {
        const joined = text.join('\n').trim();
        if (joined) blocks.push({ type: 'text', text: joined });
        text = [];
    };
    for (const line of String(content || '').split('\n')) {
        const match = MARKER_LINE.exec(line);
        const index = match ? Number(match[1]) - 1 : -1;
        if (match && list[index]) {
            flushText();
            blocks.push({ type: 'image', src: list[index] });
            used.add(index);
        } else if (!match) {
            text.push(line);
        }
    }
    flushText();
    list.forEach((src, index) => {
        if (!used.has(index)) blocks.push({ type: 'image', src });
    });
    return blocks;
}

/** Puts the marker of a new body image on its own line at the cursor position (or at the end) */
export function insertImageMarker(content, imageIndex, cursor = null) {
    const text = String(content || '');
    const at = Number.isInteger(cursor) && cursor >= 0 && cursor <= text.length ? cursor : text.length;
    const before = text.slice(0, at).replace(/[ \t]+$/, '');
    const after = text.slice(at).replace(/^[ \t]+/, '');
    const head = before && !before.endsWith('\n') ? `${before}\n` : before;
    const tail = after && !after.startsWith('\n') ? `\n${after}` : after;
    return `${head}${imageMarker(imageIndex)}${tail}`;
}
