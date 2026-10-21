import { describe, expect, it } from 'vitest';
import { imageMarker, insertImageMarker, removeBodyImage, stripImageMarkers, tipBodyBlocks } from './tipBody';

describe('tipBodyBlocks', () => {
    it('places each image where its marker is', () => {
        const content = 'פתיחה\n[[תמונה 2]]\nאמצע\n[[תמונה 1]]\nסוף';
        expect(tipBodyBlocks(content, ['a.jpg', 'b.jpg'])).toEqual([
            { type: 'text', text: 'פתיחה' },
            { type: 'image', src: 'b.jpg' },
            { type: 'text', text: 'אמצע' },
            { type: 'image', src: 'a.jpg' },
            { type: 'text', text: 'סוף' },
        ]);
    });

    it('shows images without a marker after the text, like old tips', () => {
        expect(tipBodyBlocks('טקסט בלבד', ['a.jpg'])).toEqual([{ type: 'text', text: 'טקסט בלבד' }, { type: 'image', src: 'a.jpg' }]);
        expect(tipBodyBlocks('שורה\n[[תמונה 1]]', ['a.jpg', 'b.jpg']).map((b) => b.src || b.text)).toEqual(['שורה', 'a.jpg', 'b.jpg']);
    });

    it('drops a marker of an image that does not exist', () => {
        expect(tipBodyBlocks('א\n[[תמונה 5]]\nב', [])).toEqual([{ type: 'text', text: 'א\nב' }]);
    });
});

describe('markers', () => {
    it('inserts the marker on its own line at the cursor', () => {
        expect(insertImageMarker('שורה ראשונה שורה שנייה', 0, 11)).toBe(`שורה ראשונה\n${imageMarker(0)}\nשורה שנייה`);
        expect(insertImageMarker('טקסט', 2)).toBe('טקסט\n[[תמונה 3]]');
        expect(insertImageMarker('', 0)).toBe('[[תמונה 1]]');
    });

    it('strips markers for summaries', () => {
        expect(stripImageMarkers('א\n[[תמונה 1]]\nב')).toBe('א\nב');
    });
});

describe('removeBodyImage', () => {
    it('drops the image and its line, and renumbers the later images', () => {
        const { content, images } = removeBodyImage('א\n[[תמונה 1]]\nב\n[[תמונה 2]]\nג\n[[תמונה 3]]', ['a', 'b', 'c'], 1);
        expect(images).toEqual(['a', 'c']);
        expect(content).toBe('א\n[[תמונה 1]]\nב\nג\n[[תמונה 2]]');
        expect(tipBodyBlocks(content, images).filter((b) => b.type === 'image').map((b) => b.src)).toEqual(['a', 'c']);
    });
});
