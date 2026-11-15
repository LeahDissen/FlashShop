import { describe, expect, it } from 'vitest';
import { mapEditorAssets, mergeEditorAssetsWithFallback } from './mapEditorAssets';

describe('ready designs in the editor library', () => {
    const raw = [
        { _id: 'r2', category: 'readyDesign', title: 'יום הולדת', src: 'https://x/b.png', sortOrder: 2 },
        { _id: 'r1', category: 'readyDesign', title: 'חתונה', src: 'https://x/a.png', sortOrder: 1 },
        { _id: 'r3', category: 'readyDesign', title: 'כבוי', src: 'https://x/c.png', isActive: false },
        { _id: 'g', category: 'graphic', title: 'לב', src: 'https://x/g.png' },
    ];

    it('maps active ready designs in their order, apart from the graphics', () => {
        const mapped = mapEditorAssets(raw);
        expect(mapped.readyDesigns.map((d) => d.id)).toEqual(['r1', 'r2']);
        expect(mapped.graphics.map((d) => d.id)).toEqual(['g']);
    });

    it('never fills ready designs from the built-in defaults', () => {
        const merged = mergeEditorAssetsWithFallback(mapEditorAssets([]), { readyDesigns: [{ id: 'x' }], shapes: [], backgroundAssets: [], graphics: [], icons: [], canvasBackgrounds: [], colors: [] });
        expect(merged.readyDesigns).toEqual([]);
    });
});
