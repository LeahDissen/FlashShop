/** פרסור גודל מגנט מטקסט חופשי (למשל 15×10 / 15*10 / 15x10) */
export function parseMagnetSize(raw) {
    if (raw == null) return null;
    const text = String(raw).trim();
    if (!text) return null;
    const match = text.match(/(\d+(?:\.\d+)?)\s*[x×*]\s*(\d+(?:\.\d+)?)/i);
    if (!match) return null;
    const width = Number(match[1]);
    const height = Number(match[2]);
    if (!Number.isFinite(width) || !Number.isFinite(height)) return null;
    return {
        width,
        height,
        label: `${width}×${height}`,
    };
}

export function withMagnetPrintDimensions(product) {
    if (!product || typeof product !== 'object') return product;
    const parsed = parseMagnetSize(product.size);
    return {
        ...product,
        printWidth: parsed?.width ?? product.printWidth ?? 12,
        printHeight: parsed?.height ?? product.printHeight ?? 18,
    };
}
