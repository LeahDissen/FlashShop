import { uploadImageDetailed } from './cloudinaryUpload';

const DEFAULT_CONCURRENCY = 5;
const DEFAULT_RETRIES = 2;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Retry only transient failures (network / server); a corrupt or oversized file won't benefit from it */
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
 * Uploads many files in parallel (a few at a time, not all at once) with progress and retries.
 * A typical photo development order is hundreds of photos, so each finished photo
 * is reported right away through onUploaded so the gallery fills up as it goes.
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

    // Keep the original selection order regardless of the completion order
    uploaded.sort((a, b) => a.index - b.index);
    failed.sort((a, b) => a.index - b.index);
    return { uploaded, failed };
}
