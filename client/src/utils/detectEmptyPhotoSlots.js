/**
 * מזהה ריבועים/מלבנים ריקים (לבנים) בתמונת מסגרת קולאז׳
 * ומחזיר dropzones באחוזים (0–100) מוכנים לשימוש.
 */
export async function detectEmptyPhotoSlots(imageUrl, options = {}) {
    const {
        whiteThreshold = 232,
        minAreaRatio = 0.012,
        maxAreaRatio = 0.4,
        minFillRatio = 0.55,
        maxSlots = 16,
        maxWorkSize = 640,
        insetPercent = 0.4,
    } = options;

    if (!imageUrl) return [];

    const img = await loadImage(imageUrl);
    const srcW = img.naturalWidth || img.width;
    const srcH = img.naturalHeight || img.height;
    if (!srcW || !srcH) return [];

    const scale = Math.min(1, maxWorkSize / Math.max(srcW, srcH));
    const w = Math.max(1, Math.round(srcW * scale));
    const h = Math.max(1, Math.round(srcH * scale));

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return [];

    ctx.drawImage(img, 0, 0, w, h);
    const { data } = ctx.getImageData(0, 0, w, h);

    const isWhite = (i) => {
        const o = i * 4;
        const r = data[o];
        const g = data[o + 1];
        const b = data[o + 2];
        const a = data[o + 3];
        if (a < 200) return false;
        return r >= whiteThreshold && g >= whiteThreshold && b >= whiteThreshold;
    };

    const visited = new Uint8Array(w * h);
    const components = [];
    const minArea = Math.floor(w * h * minAreaRatio);
    const maxArea = Math.floor(w * h * maxAreaRatio);

    for (let y = 0; y < h; y += 1) {
        for (let x = 0; x < w; x += 1) {
            const start = y * w + x;
            if (visited[start] || !isWhite(start)) continue;

            // BFS לרכיב מחובר של פיקסלים לבנים
            let minX = x;
            let maxX = x;
            let minY = y;
            let maxY = y;
            let count = 0;
            const queue = [start];
            visited[start] = 1;

            while (queue.length) {
                const idx = queue.pop();
                const cx = idx % w;
                const cy = (idx - cx) / w;
                count += 1;
                if (cx < minX) minX = cx;
                if (cx > maxX) maxX = cx;
                if (cy < minY) minY = cy;
                if (cy > maxY) maxY = cy;

                const neighbors = [
                    idx - 1,
                    idx + 1,
                    idx - w,
                    idx + w,
                ];
                for (let n = 0; n < neighbors.length; n += 1) {
                    const ni = neighbors[n];
                    if (ni < 0 || ni >= w * h || visited[ni]) continue;
                    const nx = ni % w;
                    const ny = (ni - nx) / w;
                    // מניעת מעבר לשורה אחרת בחיבור אופקי
                    if (Math.abs(nx - cx) + Math.abs(ny - cy) !== 1) continue;
                    if (!isWhite(ni)) continue;
                    visited[ni] = 1;
                    queue.push(ni);
                }
            }

            if (count < minArea || count > maxArea) continue;

            const boxW = maxX - minX + 1;
            const boxH = maxY - minY + 1;
            const boxArea = boxW * boxH;
            if (boxArea <= 0) continue;

            const fillRatio = count / boxArea;
            if (fillRatio < minFillRatio) continue;

            // יחס גובה-רוחב סביר לחלון תמונה (לא פס דק)
            const aspect = boxW / boxH;
            if (aspect < 0.35 || aspect > 3.2) continue;

            components.push({
                minX,
                minY,
                maxX,
                maxY,
                count,
                boxArea,
            });
        }
    }

    if (!components.length) return [];

    // מיזוג רכיבים חופפים/קרובים (למשל פיצול בגלל עיטור מעל החלון)
    const merged = mergeNearbyBoxes(components, Math.max(4, Math.round(Math.min(w, h) * 0.02)));

    const slots = merged
        .map((box) => {
            const boxW = box.maxX - box.minX + 1;
            const boxH = box.maxY - box.minY + 1;
            const fillRatio = box.count / (boxW * boxH || 1);
            return { ...box, boxW, boxH, fillRatio };
        })
        .filter((box) => {
            const area = box.boxW * box.boxH;
            return area >= minArea && area <= maxArea && box.fillRatio >= minFillRatio * 0.85;
        })
        .sort((a, b) => (b.boxW * b.boxH) - (a.boxW * a.boxH))
        .slice(0, maxSlots)
        .sort((a, b) => (a.minY - b.minY) || (a.minX - b.minX));

    const insetX = (insetPercent / 100) * w;
    const insetY = (insetPercent / 100) * h;

    return slots.map((box, index) => {
        const left = Math.max(0, box.minX + insetX);
        const top = Math.max(0, box.minY + insetY);
        const right = Math.min(w, box.maxX + 1 - insetX);
        const bottom = Math.min(h, box.maxY + 1 - insetY);
        const width = Math.max(1, right - left);
        const height = Math.max(1, bottom - top);

        return {
            id: `zone_${index + 1}`,
            x: Number(((left / w) * 100).toFixed(2)),
            y: Number(((top / h) * 100).toFixed(2)),
            width: Number(((width / w) * 100).toFixed(2)),
            height: Number(((height / h) * 100).toFixed(2)),
            clipType: 'rect',
            clipPath: '',
            label: `חלון ${index + 1}`,
        };
    });
}

function loadImage(src) {
    return new Promise((resolve, reject) => {
        const finish = (img) => resolve(img);
        const fail = () => reject(new Error('Failed to load image for slot detection'));

        // data:/blob: – טעינה ישירה
        if (typeof src === 'string' && (src.startsWith('data:') || src.startsWith('blob:'))) {
            const img = new Image();
            img.onload = () => finish(img);
            img.onerror = fail;
            img.src = src;
            return;
        }

        // ניסיון דרך fetch כדי להתמודד עם CORS כשאפשר
        fetch(src, { mode: 'cors' })
            .then((res) => {
                if (!res.ok) throw new Error('fetch failed');
                return res.blob();
            })
            .then((blob) => {
                const objectUrl = URL.createObjectURL(blob);
                const img = new Image();
                img.onload = () => {
                    URL.revokeObjectURL(objectUrl);
                    finish(img);
                };
                img.onerror = () => {
                    URL.revokeObjectURL(objectUrl);
                    fail();
                };
                img.src = objectUrl;
            })
            .catch(() => {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = () => finish(img);
                img.onerror = fail;
                img.src = src;
            });
    });
}

function boxesOverlapOrNear(a, b, gap) {
    return !(
        a.maxX + gap < b.minX
        || b.maxX + gap < a.minX
        || a.maxY + gap < b.minY
        || b.maxY + gap < a.minY
    );
}

function mergeNearbyBoxes(boxes, gap) {
    const items = boxes.map((b) => ({ ...b }));
    let merged = true;
    while (merged) {
        merged = false;
        for (let i = 0; i < items.length; i += 1) {
            for (let j = i + 1; j < items.length; j += 1) {
                if (!boxesOverlapOrNear(items[i], items[j], gap)) continue;
                items[i] = {
                    minX: Math.min(items[i].minX, items[j].minX),
                    minY: Math.min(items[i].minY, items[j].minY),
                    maxX: Math.max(items[i].maxX, items[j].maxX),
                    maxY: Math.max(items[i].maxY, items[j].maxY),
                    count: items[i].count + items[j].count,
                };
                items.splice(j, 1);
                merged = true;
                break;
            }
            if (merged) break;
        }
    }
    return items;
}
