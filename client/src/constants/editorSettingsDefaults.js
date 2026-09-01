/**
 * ברירות מחדל לעורך – נשמרות בצד הלקוח כרשת ביטחון בלבד.
 * המקור האמיתי הוא מסמך ההגדרות שהמנהלת עורכת (GET /editor-settings).
 */
export const DEFAULT_EDITOR_SETTINGS = {
    framePrintSizes: [
        { key: '10x15', label: '10×15 ס״מ', widthCm: 10, heightCm: 15, sortOrder: 0, isActive: true },
        { key: '13x18', label: '13×18 ס״מ', widthCm: 13, heightCm: 18, sortOrder: 1, isActive: true },
        { key: '15x20', label: '15×20 ס״מ', widthCm: 15, heightCm: 20, sortOrder: 2, isActive: true },
    ],
    orientationLabels: {
        landscape: 'לרוחב',
        portrait: 'לאורך',
        any: 'מתאים לשניהם',
    },
    frameFolders: {
        title: 'מסגרות עיצוב',
        subtitle: 'בחרו תיקיית מידה ואז מסגרת לרוחב או לאורך',
        emptyText: 'אין מסגרות זמינות במידה זו',
    },
    textToolbar: {
        fonts: [
            { label: 'Arial', value: 'Arial' },
            { label: 'Rubik', value: 'Rubik' },
            { label: 'Varela Round', value: 'Varela Round' },
            { label: 'Times New Roman', value: 'Times New Roman' },
            { label: 'Georgia', value: 'Georgia' },
            { label: 'Tahoma', value: 'Tahoma' },
            { label: 'Verdana', value: 'Verdana' },
            { label: 'Trebuchet MS', value: 'Trebuchet MS' },
            { label: 'Courier New', value: 'Courier New' },
            { label: 'Impact', value: 'Impact' },
        ],
        colorPresets: [
            '#FFFFFF', '#E5E7EB', '#9CA3AF', '#4B5563', '#1F2937', '#000000',
            '#9333EA', '#C084FC', '#E879F9', '#F472B6', '#F87171', '#DC2626',
            '#1D4ED8', '#3B82F6', '#38BDF8', '#67E8F9', '#2DD4BF', '#10B981',
            '#FB923C', '#FBBF24', '#FDE047', '#A3E635', '#4ADE80', '#16A34A',
        ],
        minFontSize: 8,
        maxFontSize: 200,
    },
    captionDefaults: {
        buttonLabel: 'הוסף כתובית לתמונה',
        placeholder: 'כתובית לתמונה',
        fontFamily: 'Rubik',
        fontSize: 24,
        color: '#FFFFFF',
    },
    orientationPrompt: {
        title: 'כיוון התמונה לא תואם למסגרת',
        body: 'אפשר לסובב את התמונה ב-90° כדי שתתאים לכיוון המסגרת שנבחרה.',
        rotateLabel: 'סובב ב-90°',
        dismissLabel: 'השאר כמו שזה',
    },
    drive: {
        rootFolderName: 'FlashShop Orders',
        orderFolderTemplate: 'הזמנה {orderId} - {date}',
    },
};

/** ממזג הגדרות מהשרת עם ברירות המחדל, כדי שחסר שדה לא ישבור את העורך */
export const mergeEditorSettings = (incoming) => {
    if (!incoming || typeof incoming !== 'object') return DEFAULT_EDITOR_SETTINGS;

    const activeSizes = Array.isArray(incoming.framePrintSizes)
        ? incoming.framePrintSizes.filter((size) => size?.isActive !== false)
        : [];

    return {
        ...DEFAULT_EDITOR_SETTINGS,
        ...incoming,
        framePrintSizes: activeSizes.length
            ? [...activeSizes].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
            : DEFAULT_EDITOR_SETTINGS.framePrintSizes,
        orientationLabels: {
            ...DEFAULT_EDITOR_SETTINGS.orientationLabels,
            ...(incoming.orientationLabels || {}),
        },
        frameFolders: {
            ...DEFAULT_EDITOR_SETTINGS.frameFolders,
            ...(incoming.frameFolders || {}),
        },
        textToolbar: {
            ...DEFAULT_EDITOR_SETTINGS.textToolbar,
            ...(incoming.textToolbar || {}),
            fonts: incoming.textToolbar?.fonts?.length
                ? incoming.textToolbar.fonts
                : DEFAULT_EDITOR_SETTINGS.textToolbar.fonts,
            colorPresets: incoming.textToolbar?.colorPresets?.length
                ? incoming.textToolbar.colorPresets
                : DEFAULT_EDITOR_SETTINGS.textToolbar.colorPresets,
        },
        captionDefaults: {
            ...DEFAULT_EDITOR_SETTINGS.captionDefaults,
            ...(incoming.captionDefaults || {}),
        },
        orientationPrompt: {
            ...DEFAULT_EDITOR_SETTINGS.orientationPrompt,
            ...(incoming.orientationPrompt || {}),
        },
        drive: {
            ...DEFAULT_EDITOR_SETTINGS.drive,
            ...(incoming.drive || {}),
        },
    };
};
