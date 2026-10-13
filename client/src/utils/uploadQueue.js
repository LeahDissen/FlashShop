import { uploadImageDetailed } from './cloudinaryUpload';

const DEFAULT_CONCURRENCY = 5;
const DEFAULT_RETRIES = 2;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** ניסיון חוזר רק לכשלים זמניים (רשת / שרת); קובץ פגום או גדול מדי לא ייעזר מזה */
const uploadWithRetry = async (file, retries) => {
    let lastError;
    for (let attempt = 0; attempt <= retries; attempt += 1) {
        try {
            return await uploadImageDetailed(file);
        } catch (error) {
            lastError = error;
            if (error?.retryable === false || attempt === retries) break;
            await wait(800 * (attempt + 1));
        }
    }
    throw lastError;
};

/**
 * מעלה הרבה קבצים במקביל (כמה בבת אחת, לא הכל) עם התקדמות וניסיון חוזר.
 * הזמנת פיתוח תמונות טיפוסית היא מאות תמונות, אז כל תמונה שהסתיימה
 * מדווחת מיד דרך onUploaded כדי שהגלריה תתמלא תוך כדי.
 */
export async function uploadFilesInParallel(files, {
    concurrency = DEFAULT_CONCURRENCY,
    retries = DEFAULT_RETRIES,
    onProgress,
    onUploaded,
} = {}) {
    const queue = Array.from(files).map((file, index) => ({ file, index }));
    const uploaded = [];
    const failed = [];
    let done = 0;
    const total = queue.length;

    const report = () => onProgress?.({ done, total, failed: failed.length });

    const worker = async () => {
        while (queue.length > 0) {
            const { file, index } = queue.shift();
            try {
                const result = await uploadWithRetry(file, retries);
                uploaded.push({ file, index, ...result });
                onUploaded?.({ file, index, ...result });
            } catch (error) {
                failed.push({ file, index, error });
            } finally {
                done += 1;
                report();
            }
        }
    };

    report();
    await Promise.all(Array.from({ length: Math.min(concurrency, total) }, worker));

    // שומרים על סדר הבחירה המקורי בלי קשר לסדר הסיום
    uploaded.sort((a, b) => a.index - b.index);
    failed.sort((a, b) => a.index - b.index);
    return { uploaded, failed };
}
