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
