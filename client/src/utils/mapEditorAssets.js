const sortByOrder = (items) =>
    [...items].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

const inCategory = (items, category) =>
    sortByOrder(items.filter((item) => item?.category === category && item?.isActive !== false));

const toElement = (item, { asShape = false } = {}) => {
    const src = String(item?.src || '').trim();
    const content = String(item?.content || '');
    if (asShape) {
        if (!content && !src) return null;
        return {
            id: item._id,
            alt: item.title || 'צורה',
            src: src || '',
            content,
            type: content ? 'shape' : 'image',
        };
    }
    if (!src) return null;
    return {
        id: item._id,
        alt: item.title || 'פריט',
        src,
    };
};

export const mapEditorAssets = (raw) => {
    const list = Array.isArray(raw) ? raw : [];

    return {
        shapes: inCategory(list, 'shape').map((item) => toElement(item, { asShape: true })).filter(Boolean),
        backgroundAssets: inCategory(list, 'elementBackground').map((item) => toElement(item)).filter(Boolean),
        graphics: inCategory(list, 'graphic').map((item) => toElement(item)).filter(Boolean),
        icons: inCategory(list, 'icon').map((item) => toElement(item)).filter(Boolean),
        canvasBackgrounds: inCategory(list, 'canvasBackground')
            .map((item) => String(item?.src || '').trim())
            .filter(Boolean),
        colors: inCategory(list, 'color')
            .map((item) => {
                const value = String(item?.colorValue || '').trim();
                if (!value) return null;
                return { value, class: String(item?.colorClass || '').trim() };
            })
            .filter(Boolean),
    };
};

export const mergeEditorAssetsWithFallback = (mapped, fallbacks) => ({
    shapes: mapped.shapes.length ? mapped.shapes : fallbacks.shapes,
    backgroundAssets: mapped.backgroundAssets.length ? mapped.backgroundAssets : fallbacks.backgroundAssets,
    graphics: mapped.graphics.length ? mapped.graphics : fallbacks.graphics,
    icons: mapped.icons.length ? mapped.icons : fallbacks.icons,
    canvasBackgrounds: mapped.canvasBackgrounds.length ? mapped.canvasBackgrounds : fallbacks.canvasBackgrounds,
    colors: mapped.colors.length ? mapped.colors : fallbacks.colors,
});
