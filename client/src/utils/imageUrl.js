const CLOUDINARY_UPLOAD = /^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.+)$/;

/**
 * Resized, compressed Cloudinary image URL: modern format (WebP/AVIF) and automatic quality,
 * at a width/height large enough for display. A non-Cloudinary image is returned as is.
 * @param {string} url
 * @param {{ width?: number, height?: number }} size actual pixels (already including screen density)
 */
export function optimizeImageUrl(url, { width, height } = {}) {
    const match = CLOUDINARY_UPLOAD.exec(String(url || ''));
    if (!match) return url;
    const [, prefix, rest] = match;
    const transforms = ['f_auto', 'q_auto', 'c_limit'];
    if (width) transforms.push(`w_${Math.round(width)}`);
    if (height) transforms.push(`h_${Math.round(height)}`);
    return `${prefix}${transforms.join(',')}/${rest}`;
}

/** Image width at screen width, rounded to 400px steps so the Cloudinary cache works well */
export function screenWidthImageSize(maxWidth = 2400) {
    if (typeof window === 'undefined') return 1600;
    const pixels = window.innerWidth * (window.devicePixelRatio || 1);
    return Math.min(maxWidth, Math.ceil(pixels / 400) * 400);
}
