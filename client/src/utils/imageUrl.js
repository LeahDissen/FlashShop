const CLOUDINARY_UPLOAD = /^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.+)$/;

/**
 * כתובת תמונה מוקטנת ודחוסה מ-Cloudinary: פורמט מודרני (WebP/AVIF) ואיכות אוטומטית,
 * ברוחב/גובה שמספיקים לתצוגה. תמונה שלא מ-Cloudinary חוזרת כמו שהיא.
 * @param {string} url
 * @param {{ width?: number, height?: number }} size פיקסלים בפועל (כבר כולל צפיפות מסך)
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

/** רוחב תמונה ברוחב המסך, מעוגל למדרגות של 400px כדי שהמטמון של Cloudinary יעבוד טוב */
export function screenWidthImageSize(maxWidth = 2400) {
    if (typeof window === 'undefined') return 1600;
    const pixels = window.innerWidth * (window.devicePixelRatio || 1);
    return Math.min(maxWidth, Math.ceil(pixels / 400) * 400);
}
