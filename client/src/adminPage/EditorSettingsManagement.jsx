import { FaCheckCircle, FaExclamationCircle, FaSlidersH } from 'react-icons/fa';
import { FiArrowLeft } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import CaptionDefaultsCard from './editorSettings/CaptionDefaultsCard';
import FramePrintSizesCard from './editorSettings/FramePrintSizesCard';
import TextFieldsCard from './editorSettings/TextFieldsCard';
import TextToolbarCard from './editorSettings/TextToolbarCard';
import { useEditorSettingsForm } from './editorSettings/useEditorSettingsForm';

const FRAME_PICKER_FIELDS = [
    { section: 'orientationLabels', key: 'landscape', label: 'תווית כיוון לרוחב' },
    { section: 'orientationLabels', key: 'portrait', label: 'תווית כיוון לאורך' },
    { section: 'frameFolders', key: 'title', label: 'כותרת המקטע' },
    { section: 'frameFolders', key: 'subtitle', label: 'הסבר מתחת לכותרת' },
    { section: 'frameFolders', key: 'emptyText', label: 'הודעה כשאין מסגרות בתיקייה', wide: true },
];

const ORIENTATION_PROMPT_FIELDS = [
    { section: 'orientationPrompt', key: 'title', label: 'כותרת' },
    { section: 'orientationPrompt', key: 'body', label: 'טקסט ההסבר' },
    { section: 'orientationPrompt', key: 'rotateLabel', label: 'כפתור סיבוב' },
    { section: 'orientationPrompt', key: 'dismissLabel', label: 'כפתור ביטול' },
];

const DRIVE_FIELDS = [
    { section: 'drive', key: 'rootFolderName', label: 'שם תיקיית האב' },
    { section: 'drive', key: 'orderFolderTemplate', label: 'תבנית שם תיקיית הזמנה', hint: '{orderId} יוחלף במספר ההזמנה ו-{date} בתאריך.' },
];

/** Admin: the frame sizes, fonts, colors and texts the customer sees in the editors */
export default function EditorSettingsManagement() {
    const {
        form, loading, saving, message, loadSettings, patchSection,
        updateSize, addSize, removeSize, uploadFont, fontUploading, fontError, fontNotice, save,
    } = useEditorSettingsForm();

    if (loading) {
        return <div className="min-h-screen bg-gray-50 p-10 text-center text-gray-500">טוען הגדרות...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
            <div className="max-w-5xl mx-auto mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                        <FaSlidersH className="text-[#f2665e]" />
                        הגדרות עורך התמונות
                    </h1>
                    <p className="text-gray-500 mt-1">
                        מידות המסגרות, הגופנים, הצבעים והטקסטים שהלקוח רואה בעורך
                    </p>
                </div>
                <Link
                    to="/admindashboard"
                    className="text-[#f2665e] font-bold p-2 gap-2 rounded-lg hover:bg-[#f2665e]/10 flex items-center no-underline"
                >
                    <span>חזרה ללוח הבקרה</span>
                    <FiArrowLeft className="text-xl" />
                </Link>
            </div>

            <form onSubmit={save} className="max-w-5xl mx-auto space-y-6">
                <FramePrintSizesCard
                    sizes={form.framePrintSizes}
                    onUpdate={updateSize}
                    onAdd={addSize}
                    onRemove={removeSize}
                />

                <TextFieldsCard title="תוויות וטקסטים בבורר המסגרות" fields={FRAME_PICKER_FIELDS} form={form} patchSection={patchSection} />

                <TextToolbarCard
                    textToolbar={form.textToolbar}
                    onPatch={(updates) => patchSection('textToolbar', updates)}
                    onFontFile={uploadFont}
                    fontUploading={fontUploading}
                    fontError={fontError}
                    fontNotice={fontNotice}
                />

                <CaptionDefaultsCard
                    captionDefaults={form.captionDefaults}
                    fonts={form.textToolbar.fonts}
                    onPatch={(updates) => patchSection('captionDefaults', updates)}
                />

                <TextFieldsCard
                    title="הודעת התאמת כיוון"
                    description="ההודעה שמופיעה ללקוח כשכיוון התמונה לא תואם לכיוון המסגרת."
                    fields={ORIENTATION_PROMPT_FIELDS}
                    form={form}
                    patchSection={patchSection}
                />

                <TextFieldsCard
                    title="שמירת עיצובים ב-Google Drive"
                    description="קבצי העיצוב הסופיים נשמרים בתיקייה נפרדת לכל הזמנה, והקישור מוצג בניהול ההזמנות."
                    fields={DRIVE_FIELDS}
                    form={form}
                    patchSection={patchSection}
                />

                {message.text && (
                    <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
                        message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                    }`}>
                        {message.type === 'success' ? <FaCheckCircle /> : <FaExclamationCircle />}
                        {message.text}
                    </div>
                )}

                <div className="sticky bottom-4 flex gap-3">
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex-1 bg-[#f2665e] text-white font-bold py-3 rounded-xl shadow-lg hover:bg-[#d95248] disabled:opacity-50"
                    >
                        {saving ? 'שומר...' : 'שמירת הגדרות'}
                    </button>
                    <button
                        type="button"
                        onClick={loadSettings}
                        className="px-6 py-3 bg-white border border-gray-200 rounded-xl text-gray-600 font-bold hover:bg-gray-50"
                    >
                        ביטול שינויים
                    </button>
                </div>
            </form>
        </div>
    );
}
