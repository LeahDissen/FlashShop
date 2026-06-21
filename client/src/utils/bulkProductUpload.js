import * as XLSX from 'xlsx';
import { addProduct } from '../api/products';
import { getDisplayTypeForCategory } from '../constants/productCategories';
import { uploadImageToCloudinary } from './cloudinaryUpload';

const CONCURRENCY = 3;

/** שורת כותרות העמודות באקסל (מספר שורה 1-based) */
const EXCEL_HEADER_ROW = 5;
/** שורת נתונים ראשונה באקסל */
const EXCEL_FIRST_DATA_ROW = 6;
/** אינדקס שורת הכותרות ב-xlsx (0-based) */
const HEADER_ROW_INDEX = EXCEL_HEADER_ROW - 1;

function excelDataRowNumber(dataRowIndex) {
    return dataRowIndex + EXCEL_FIRST_DATA_ROW;
}

const COLUMN_ALIASES = {
    title: 'title',
    name: 'title',
    productname: 'title',
    כותרת: 'title',
    שם: 'title',
    שםמוצר: 'title',
    שםהמוצר: 'title',
    category: 'category',
    קטגוריה: 'category',
    שםהקטגוריה: 'category',
    description: 'description',
    תיאור: 'description',
    תיאורפרטיהמוצר: 'description',
    price: 'price',
    מחיר: 'price',
    מחירבסיסשח: 'price',
    מחירבסיס: 'price',
    stock: 'stock',
    מלאי: 'stock',
    width: 'width',
    printwidth: 'width',
    רוחב: 'width',
    רוחבשטחהדפסה: 'width',
    height: 'height',
    printheight: 'height',
    גובה: 'height',
    גובהשטחהדפסה: 'height',
    imagefile: 'imageFile',
    image: 'imageFile',
    filename: 'imageFile',
    קובץתמונה: 'imageFile',
    שםקובץ: 'imageFile',
    שםקובץתמונה: 'imageFile',
    שםקובץתמונמדויק: 'imageFile',
    תמונה: 'imageFile',
};

/** סדר עמודות ברירת מחדל כשכותרות חסרות/לא מזוהות */
const POSITIONAL_FIELDS = [
    'category',
    'title',
    'description',
    'price',
    'stock',
    'width',
    'height',
    'imageFile',
];

function normalizeKey(key) {
    const raw = String(key ?? '').trim().replace(/^\ufeff/, '');

    // כותרות בפורמט: "שם המוצר (title)" — משתמשים בשם באנגלית שבסוגריים
    const parenMatch = raw.match(/\(([^)]+)\)/);
    if (parenMatch?.[1]) {
        const inner = parenMatch[1].trim().toLowerCase().replace(/[\s_-]+/g, '');
        if (inner) return inner;
    }

    return raw
        .toLowerCase()
        .replace(/["'״׳]/g, '')
        .replace(/[\s_-]+/g, '');
}

function mapHeaderToField(headerCell, columnIndex) {
    const alias = COLUMN_ALIASES[normalizeKey(headerCell)];
    if (alias) return alias;
    return POSITIONAL_FIELDS[columnIndex] ?? null;
}

function rowHasContent(row) {
    return row.some((cell) => String(cell ?? '').trim() !== '');
}

function normalizeRow(rawRow) {
    const normalized = {};
    for (const [key, value] of Object.entries(rawRow)) {
        const alias = COLUMN_ALIASES[normalizeKey(key)];
        if (alias) {
            normalized[alias] = value;
        }
    }
    return normalized;
}

function parseSheetRows(sheet) {
    const matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    const headerCells = matrix[HEADER_ROW_INDEX] ?? [];
    const dataRows = matrix.slice(HEADER_ROW_INDEX + 1);

    return dataRows
        .filter(rowHasContent)
        .map((rowArray) => {
            const rawRow = {};
            rowArray.forEach((cell, columnIndex) => {
                const field = mapHeaderToField(headerCells[columnIndex], columnIndex);
                if (field) {
                    rawRow[field] = cell;
                }
            });
            return normalizeRow(rawRow);
        });
}

export function parseSpreadsheetFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = new Uint8Array(event.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                if (!sheetName) {
                    reject(new Error('הקובץ ריק או לא תקין'));
                    return;
                }
                const sheet = workbook.Sheets[sheetName];
                const rows = parseSheetRows(sheet);
                resolve(rows);
            } catch (err) {
                reject(new Error('לא ניתן לקרוא את קובץ האקסל/CSV'));
            }
        };
        reader.onerror = () => reject(new Error('שגיאה בקריאת הקובץ'));
        reader.readAsArrayBuffer(file);
    });
}

export function buildImageFileMap(files) {
    const map = new Map();
    for (const file of files) {
        if (!file?.name) continue;
        map.set(file.name, file);
    }
    return map;
}

function toNumber(value, fallback = null) {
    if (value === '' || value === null || value === undefined) return fallback;
    const num = Number(value);
    return Number.isFinite(num) ? num : fallback;
}

function validateRow(row, rowIndex) {
    const label = `שורה ${excelDataRowNumber(rowIndex)}`;
    const title = String(row.title ?? '').trim();
    const category = String(row.category ?? '').trim();
    const description = String(row.description ?? '').trim();
    const imageFile = String(row.imageFile ?? '').trim();
    const price = toNumber(row.price);
    const stock = toNumber(row.stock);

    if (!title) return { valid: false, error: `${label}: חסרה כותרת (title)` };
    if (!category) return { valid: false, error: `${label}: חסרה קטגוריה` };
    if (!description) return { valid: false, error: `${label}: חסר תיאור` };
    if (price === null) return { valid: false, error: `${label}: מחיר לא תקין` };
    if (stock === null) return { valid: false, error: `${label}: מלאי לא תקין` };
    if (!imageFile) return { valid: false, error: `${label}: חסר שם קובץ תמונה (imageFile)` };

    return {
        valid: true,
        data: {
            title,
            category,
            description,
            price,
            stock,
            imageFile,
            width: toNumber(row.width, 12),
            height: toNumber(row.height, 18),
        },
    };
}

async function processRow(rowData, imageMap) {
    const imageFile = imageMap.get(rowData.imageFile);
    if (!imageFile) {
        throw new Error(`התמונה "${rowData.imageFile}" לא נמצאה בתיקייה שהועלתה`);
    }

    const imageUrl = await uploadImageToCloudinary(imageFile);
    const displayType = getDisplayTypeForCategory(rowData.category);

    const payload = {
        name: rowData.title,
        category: rowData.category,
        description: rowData.description,
        price: rowData.price,
        stock: rowData.stock,
        image: imageUrl,
        displayType,
    };

    if (displayType === 'design') {
        payload.printWidth = rowData.width;
        payload.printHeight = rowData.height;
    }

    await addProduct(payload);
    return rowData.title;
}

async function runWithConcurrency(items, limit, worker) {
    const results = new Array(items.length);
    let nextIndex = 0;

    async function runWorker() {
        while (nextIndex < items.length) {
            const currentIndex = nextIndex;
            nextIndex += 1;
            results[currentIndex] = await worker(items[currentIndex], currentIndex);
        }
    }

    const workers = Array.from(
        { length: Math.min(limit, items.length) },
        () => runWorker(),
    );
    await Promise.all(workers);
    return results;
}

export async function runBulkProductUpload({ rows, imageFiles, onProgress }) {
    const imageMap = buildImageFileMap(imageFiles);
    const validated = [];
    const preErrors = [];

    rows.forEach((row, index) => {
        const result = validateRow(row, index);
        if (result.valid) {
            validated.push({ ...result.data, rowIndex: index });
        } else {
            preErrors.push(result.error);
        }
    });

    const total = validated.length;
    let completed = 0;
    const successes = [];
    const failures = [...preErrors];

    const rowResults = await runWithConcurrency(validated, CONCURRENCY, async (rowData) => {
        try {
            const productName = await processRow(rowData, imageMap);
            successes.push(productName);
            return { ok: true };
        } catch (err) {
            const label = `שורה ${excelDataRowNumber(rowData.rowIndex)} (${rowData.title})`;
            failures.push(`${label}: ${err?.message || 'שגיאה לא ידועה'}`);
            return { ok: false };
        } finally {
            completed += 1;
            onProgress?.({
                current: completed,
                total,
                label: rowData.title,
            });
        }
    });

    return {
        successCount: successes.length,
        failureCount: failures.length,
        successes,
        failures,
        processed: rowResults.length,
    };
}

export function downloadBulkProductTemplate() {
    const headerRow = [
        'שם הקטגוריה (category)',
        'שם המוצר (title)',
        'תיאור פרטי המוצר (description)',
        'מחיר בסיס ש"ח (price)',
        'מלאי (stock)',
        'רוחב שטח הדפסה',
        'גובה שטח הדפסה',
        'שם קובץ תמונה מדויק (imageFile)',
    ];
    const dataRows = [
        ['כוסות וספלים', 'ספל מעוצב', 'ספל קרמי עם הדפסה אישית', 45, 100, 12, 18, 'mug.jpg'],
        ['מגנטים', 'מגנט 10x15', 'מגנט עם תמונה אישית', 8, 200, 10, 15, 'magnet.jpg'],
    ];

    const sheetData = [
        ['FlashShop - קובץ דוגמה להעלאת מוצרים מרוכזת'],
        ['מלאו את פרטי המוצרים החל משורה 6. שמות קבצי התמונה חייבים להתאים בדיוק לקבצים שהועלו.'],
        [''],
        [''],
        headerRow,
        ...dataRows,
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'מוצרים');
    XLSX.writeFile(workbook, 'bulk-products-template.xlsx');
}
