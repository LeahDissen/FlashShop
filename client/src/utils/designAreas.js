/**
 * Extra design areas of a product (e.g. a shirt's back), each with its own print size.
 * In the editor an area is designed as its own "product": the same product with the area's size and
 * name, so it gets its own canvas and its own draft.
 */

/** The product as designed in one of its extra areas (its own main print settings are kept to go back) */
export const areaProduct = (product, area) => {
    const main = mainProduct(product);
    return {
        ...main,
        printWidth: Number(area.printWidth),
        printHeight: Number(area.printHeight),
        designArea: area.name,
        mainPrint: {
            printWidth: main.printWidth,
            printHeight: main.printHeight,
            allowOrientationToggle: main.allowOrientationToggle,
            shape: main.shape,
        },
        // An area is printed as a plain rectangle in the size the admin set
        allowOrientationToggle: false,
        shape: null,
    };
};

/** The product's main area: the product itself, with its own print size */
export const mainProduct = (product) => {
    if (!product?.designArea) return product;
    const { designArea, mainPrint, ...rest } = product;
    void designArea;
    return { ...rest, ...mainPrint };
};

/** "גב · 20×30 ס"מ" */
export const areaLabel = (area) => `${area.name} · ${area.printWidth}×${area.printHeight} ס"מ`;

/** Draft/storage id: the product id, plus the area for an extra area */
export const designAreaSuffix = (product) => (product?.designArea ? `__area_${product.designArea}` : '');

/** Where the uploaded print files of a product's extra areas are kept until the order */
export const areaFilesStorageKey = (productId) => `editor_design_areas_${productId}`;
