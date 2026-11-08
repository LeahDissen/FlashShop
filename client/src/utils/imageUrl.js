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

/**
 * The print file for a Cloudinary photo at exactly `width`×`height` pixels, as a JPEG: the whole photo,
 * uncropped, centered on white (Cloudinary pads it on the fly, so nothing is uploaded again).
 * Other URLs are returned as is.
 */
export function paddedPrintUrl(url, { width, height }) {
    const match = CLOUDINARY_UPLOAD.exec(String(url || ''));
    if (!match || !width || !height) return url;
    const [, prefix, rest] = match;
    if (rest.startsWith('c_pad,')) return url;
    // The ".jpg" ending makes Cloudinary deliver a JPEG (what print labs take), whatever was uploaded
    const asJpeg = /\.[a-z0-9]+$/i.test(rest) ? rest.replace(/\.[a-z0-9]+$/i, '.jpg') : `${rest}.jpg`;
    return `${prefix}c_pad,b_white,w_${Math.round(width)},h_${Math.round(height)},q_95/${asJpeg}`;
}
