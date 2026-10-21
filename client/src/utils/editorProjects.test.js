import { describe, expect, it } from 'vitest';
import { getCanvasDimensions } from './canvasDimensions';
import { prepareProjectForCanvas } from './editorProjects';

const puzzle = { _id: 'pz', name: 'פאזל', printWidth: 28, printHeight: 20 };

describe('prepareProjectForCanvas', () => {
    it('keeps the saved orientation flag', () => {
        const prepared = prepareProjectForCanvas({ selectedProduct: puzzle, elements: [], canvasSize: { orientationFlipped: true } }, null);
        expect(prepared.orientationFlipped).toBe(true);
        expect(prepared.canvas).toEqual(getCanvasDimensions(puzzle, null, true));
    });

    it('infers a turned canvas from the saved size for older projects', () => {
        const turned = prepareProjectForCanvas({ selectedProduct: puzzle, elements: [], canvasSize: { widthCm: 20, heightCm: 28 } }, null);
        const regular = prepareProjectForCanvas({ selectedProduct: puzzle, elements: [], canvasSize: { widthCm: 28, heightCm: 20 } }, null);
        expect(turned.orientationFlipped).toBe(true);
        expect(regular.orientationFlipped).toBe(false);
    });

    it('starts an empty project with the default text', () => {
        const prepared = prepareProjectForCanvas({ selectedProduct: puzzle, elements: [] }, null);
        expect(prepared.elements).toHaveLength(1);
        expect(prepared.elements[0].type).toBe('text');
    });

    it('stretches the frame over the whole canvas and scales the other elements', () => {
        const canvas = getCanvasDimensions(puzzle);
        const prepared = prepareProjectForCanvas({
            selectedProduct: puzzle,
            canvasSize: { width: canvas.width / 2, height: canvas.height / 2 },
            elements: [
                { id: 'f', type: 'globalFrame', width: 10, height: 10, top: 5, left: 5 },
                { id: 't', type: 'text', content: 'שלום', width: 100, height: 40, top: 10, left: 10 },
            ],
        }, null);
        const frame = prepared.elements.find((el) => el.id === 'f');
        const text = prepared.elements.find((el) => el.id === 't');
        expect(frame).toMatchObject({ width: canvas.width, height: canvas.height, top: 0, left: 0 });
        expect(text.left).toBeCloseTo(20);
        expect(text.top).toBeCloseTo(20);
    });

    it('uses the open product when the project has none', () => {
        const prepared = prepareProjectForCanvas({ elements: [] }, puzzle);
        expect(prepared.product).toBe(puzzle);
        expect(prepared.canvasStorageKey).toContain('pz');
    });
});
