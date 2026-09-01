const createImage = (url) =>
    new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener('load', () => resolve(image));
        image.addEventListener('error', (error) => reject(error));
        image.setAttribute('crossOrigin', 'anonymous');
        image.src = url;
    });

function resolveOutputFormat(file) {
    if (file?.type === 'image/png') {
        return { mimeType: 'image/png', quality: 1 };
    }
    if (file?.type === 'image/webp') {
        return { mimeType: 'image/webp', quality: 0.92 };
    }
    return { mimeType: 'image/jpeg', quality: 0.92 };
}

const OUTPUT_LONG_EDGE = 2000;

function resolveOutputDimensions(aspect) {
    if (aspect >= 1) {
        return {
            width: OUTPUT_LONG_EDGE,
            height: Math.round(OUTPUT_LONG_EDGE / aspect),
        };
    }
    return {
        width: Math.round(OUTPUT_LONG_EDGE * aspect),
        height: OUTPUT_LONG_EDGE,
    };
}

/**
 * יוצר Blob באיכות גבוהה מאזור חיתוך שנבחר (react-image-crop)
 */
export function detectTextDirection(text) {
    const sample = String(text || '');
    const rtl = (sample.match(/[\u0590-\u05FF\u0600-\u06FF]/g) || []).length;
    const ltr = (sample.match(/[A-Za-z]/g) || []).length;
    if (ltr > rtl) return 'ltr';
    return 'rtl';
}

function wrapFillText(ctx, text, x, y, maxWidth, lineHeight) {
    const paragraphs = String(text).split(/\n/);
    const lines = [];

    paragraphs.forEach((para) => {
        const words = para.split(/\s+/).filter(Boolean);
        if (words.length === 0) {
            lines.push('');
            return;
        }
        let current = words[0];
        for (let i = 1; i < words.length; i += 1) {
            const next = `${current} ${words[i]}`;
            if (ctx.measureText(next).width <= maxWidth) {
                current = next;
            } else {
                lines.push(current);
                current = words[i];
            }
        }
        lines.push(current);
    });

    const startY = y - (lines.length - 1) * lineHeight;
    lines.forEach((line, index) => {
        ctx.fillText(line, x, startY + index * lineHeight);
    });
}

/** מצייר מסגרת קבועה וכתוביות מעל תמונת ההדפסה */
export async function drawPrintOverlays(ctx, {
    width,
    height,
    frameSrc,
    captions = [],
    previewCropWidth,
}) {
    if (frameSrc) {
        try {
            const frame = await createImage(frameSrc);
            ctx.drawImage(frame, 0, 0, width, height);
        } catch (err) {
            console.warn('Frame overlay failed', err);
        }
    }

    const list = Array.isArray(captions) ? captions : [];
    if (list.length === 0) return;

    const scale = previewCropWidth > 0 ? width / previewCropWidth : 1;
    list.forEach((caption) => {
        const content = String(caption?.content ?? '').trim();
        if (!content) return;

        const fontSize = Math.max(8, (Number(caption.fontSize) || 24) * scale);
        const xRatio = Number.isFinite(Number(caption.x)) ? Number(caption.x) : 0.5;
        const yRatio = Number.isFinite(Number(caption.y)) ? Number(caption.y) : 0.92;

        ctx.save();
        ctx.direction = detectTextDirection(content);
        ctx.font = `${fontSize}px "${caption.fontFamily || 'Rubik'}", Rubik, sans-serif`;
        ctx.fillStyle = caption.color || '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.shadowColor = 'rgba(0,0,0,0.65)';
        ctx.shadowBlur = 4 * scale;
        ctx.shadowOffsetY = Math.max(1, scale);
        wrapFillText(
            ctx,
            content,
            width * xRatio,
            height * yRatio,
            width * 0.9,
            fontSize * 1.25,
        );
        ctx.restore();
    });
}

export async function getPrintCropBlob({
    imageSrc,
    placement,
    aspect,
    backgroundColor = '#FFFFFF',
    file = null,
    frameSrc = null,
    captions = [],
    previewCropWidth,
}) {
    if (!placement?.w || !placement?.h || !aspect) {
        throw new Error('Missing crop layout data');
    }

    const image = await createImage(imageSrc);
    const { width: outputWidth, height: outputHeight } = resolveOutputDimensions(aspect);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = outputWidth;
    canvas.height = outputHeight;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, outputWidth, outputHeight);

    ctx.drawImage(
        image,
        0,
        0,
        image.naturalWidth,
        image.naturalHeight,
        Number(placement.x) * outputWidth,
        Number(placement.y) * outputHeight,
        Number(placement.w) * outputWidth,
        Number(placement.h) * outputHeight,
    );

    await drawPrintOverlays(ctx, {
        width: outputWidth,
        height: outputHeight,
        frameSrc,
        captions,
        previewCropWidth: previewCropWidth || outputWidth,
    });

    const { mimeType, quality } = resolveOutputFormat(file);

    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (!blob) {
                    reject(new Error('Failed to create cropped image'));
                    return;
                }
                resolve(blob);
            },
            mimeType,
            quality,
        );
    });
}

/**
 * יוצר Blob באיכות גבוהה מהאזור שנבחר (react-easy-crop croppedAreaPixels)
 */
export async function getCroppedImageBlob(imageSrc, pixelCrop, file = null) {
    if (!pixelCrop?.width || !pixelCrop?.height) {
        throw new Error('Invalid crop area');
    }

    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = Math.round(pixelCrop.width);
    canvas.height = Math.round(pixelCrop.height);

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height,
    );

    const { mimeType, quality } = resolveOutputFormat(file);

    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (!blob) {
                    reject(new Error('Failed to create cropped image'));
                    return;
                }
                resolve(blob);
            },
            mimeType,
            quality,
        );
    });
}

export function blobToFile(blob, fileName, file = null) {
    const ext = blob.type === 'image/png' ? 'png' : blob.type === 'image/webp' ? 'webp' : 'jpg';
    const name = fileName?.includes('.') ? fileName : `${fileName || 'photo'}.${ext}`;
    return new File([blob], name, { type: blob.type || file?.type || 'image/jpeg' });
}
