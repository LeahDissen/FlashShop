import { useCallback, useEffect, useState } from 'react';
import { FaImage, FaPlus } from 'react-icons/fa';
import { FiArrowLeft } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { createDesignFrame, deleteDesignFrame, getDesignFrames, updateDesignFrame } from '../api/designFrames';
import { getEditorSettings } from '../api/editorSettings';
import { getFrameCategories } from '../api/frameCategories';
import { DEFAULT_EDITOR_SETTINGS } from '../constants/editorSettingsDefaults';
import { detectEmptyPhotoSlots } from '../utils/detectEmptyPhotoSlots';
import { DROPZONE_PRESETS, normalizeDropzones } from '../utils/dropzoneUtils';
import FormMessage from './designFrames/FormMessage';
import FrameCard from './designFrames/FrameCard';
import FrameCategoriesPanel from './designFrames/FrameCategoriesPanel';
import FrameFormFields from './designFrames/FrameFormFields';
import {
    EMPTY_FRAME_FORM,
    MULTI_DROPZONE,
    buildFramePayload,
    createEmptyZone,
    frameToForm,
    loadImageDimensions,
    orientationFromDimensions,
    ratioFromDimensions,
    zoneFieldValue,
} from './designFrames/frameForm';

const NO_MESSAGE = { type: '', text: '' };

/** The design frames available in the editor for every product: the frame form, the categories and the list */
export default function DesignFramesManagement() {
    const [frames, setFrames] = useState([]);
    const [categories, setCategories] = useState([]);
    const [printSizes, setPrintSizes] = useState(DEFAULT_EDITOR_SETTINGS.framePrintSizes);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(NO_MESSAGE);
    const [form, setForm] = useState(EMPTY_FRAME_FORM);
    const [editingId, setEditingId] = useState(null);
    const [detectingSlots, setDetectingSlots] = useState(false);

    /** Changes some fields; a function receives the previous form */
    const patchForm = (fields) => setForm((prev) => ({ ...prev, ...(typeof fields === 'function' ? fields(prev) : fields) }));

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [framesData, categoriesData, settingsData] = await Promise.all([
                getDesignFrames(true),
                getFrameCategories(),
                getEditorSettings().catch(() => null),
            ]);
            setFrames(framesData);
            setCategories(categoriesData);
            if (settingsData?.framePrintSizes?.length) setPrintSizes(settingsData.framePrintSizes);
        } catch (err) {
            console.error(err);
            setMessage({ type: 'error', text: 'שגיאה בטעינת נתונים' });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    /** A new image: its proportions and orientation are read from it (kept as typed if it cannot be read) */
    const handleImageUrlChange = async (url) => {
        patchForm((prev) => ({ imageUrl: url, thumbnailUrl: url || prev.thumbnailUrl }));
        if (!url) return;
        try {
            const { width, height } = await loadImageDimensions(url);
            patchForm({ aspectRatio: ratioFromDimensions(width, height), orientation: orientationFromDimensions(width, height) });
        } catch {
            // keep the manual aspect ratio
        }
    };

    const resetForm = () => {
        setForm(EMPTY_FRAME_FORM);
        setEditingId(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const { payload, error } = buildFramePayload(form);
        if (error) {
            setMessage({ type: 'error', text: error });
            return;
        }
        setSaving(true);
        setMessage(NO_MESSAGE);
        try {
            if (editingId) {
                await updateDesignFrame(editingId, payload);
                setMessage({ type: 'success', text: 'המסגרת עודכנה בהצלחה' });
            } else {
                await createDesignFrame(payload);
                setMessage({ type: 'success', text: 'המסגרת נוספה בהצלחה' });
            }
            resetForm();
            await loadData();
        } catch (err) {
            console.error(err);
            setMessage({ type: 'error', text: err?.response?.data?.msg || 'שגיאה בשמירת המסגרת' });
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (frame) => {
        setEditingId(frame._id);
        setForm(frameToForm(frame));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id) => {
        if (!confirm('האם למחוק מסגרת זו?')) return;
        try {
            await deleteDesignFrame(id);
            if (editingId === id) resetForm();
            await loadData();
            setMessage({ type: 'success', text: 'המסגרת נמחקה' });
        } catch (err) {
            console.error(err);
            setMessage({ type: 'error', text: 'שגיאה במחיקת המסגרת' });
        }
    };

    const detectSlotsFromImage = async () => {
        if (!form.imageUrl) {
            setMessage({ type: 'error', text: 'יש להעלות תמונת מסגרת לפני זיהוי חלונות' });
            return;
        }
        setDetectingSlots(true);
        setMessage(NO_MESSAGE);
        try {
            const slots = await detectEmptyPhotoSlots(form.imageUrl);
            if (!slots.length) {
                setMessage({ type: 'error', text: 'לא נמצאו ריבועים ריקים. ודאו שיש חלונות לבנים ברורים בתמונה.' });
                return;
            }
            patchForm({ layoutType: MULTI_DROPZONE, dropzones: normalizeDropzones(slots) });
            setMessage({ type: 'success', text: `זוהו ${slots.length} חלונות תמונה אוטומטית` });
        } catch (err) {
            console.error(err);
            setMessage({ type: 'error', text: 'שגיאה בזיהוי חלונות מהתמונה' });
        } finally {
            setDetectingSlots(false);
        }
    };

    const zones = {
        detecting: detectingSlots,
        onDetect: detectSlotsFromImage,
        onApplyPreset: (presetId) => {
            const preset = DROPZONE_PRESETS.find((p) => p.id === presetId);
            if (preset) patchForm({ layoutType: MULTI_DROPZONE, dropzones: normalizeDropzones(preset.dropzones) });
        },
        onAddZone: () => patchForm((prev) => ({
            layoutType: MULTI_DROPZONE,
            dropzones: [...(prev.dropzones || []), createEmptyZone(prev.dropzones?.length || 0)],
        })),
        onUpdateZone: (index, field, value) => patchForm((prev) => {
            const dropzones = [...(prev.dropzones || [])];
            dropzones[index] = { ...dropzones[index], [field]: zoneFieldValue(field, value) };
            return { dropzones };
        }),
        onRemoveZone: (index) => patchForm((prev) => ({ dropzones: (prev.dropzones || []).filter((_, i) => i !== index) })),
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
            <div className="max-w-6xl mx-auto mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">ניהול מסגרות עיצוב גלובליות</h1>
                    <p className="text-gray-500 mt-1">מסגרות אלו זמינות לכל המוצרים בעורך העיצוב</p>
                </div>
                <Link
                    to="/admindashboard"
                    className="text-[#f2665e] font-bold p-2 gap-2 rounded-lg hover:bg-[#f2665e]/10 flex items-center no-underline"
                >
                    <span>חזרה ללוח הבקרה</span>
                    <FiArrowLeft className="text-xl" />
                </Link>
            </div>

            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-fit">
                        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <FaPlus className="text-[#f2665e]" />
                            {editingId ? 'עריכת מסגרת' : 'הוספת מסגרת חדשה'}
                        </h2>
                        <div className="space-y-4">
                            <FrameFormFields
                                form={form}
                                patchForm={patchForm}
                                onImageUrlChange={handleImageUrlChange}
                                categories={categories}
                                printSizes={printSizes}
                                zones={zones}
                            />
                            <FormMessage message={message} />
                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 bg-[#f2665e] text-white font-bold py-2.5 rounded-lg hover:bg-[#d95248] disabled:opacity-50"
                                >
                                    {saving ? 'שומר...' : (editingId ? 'עדכון' : 'הוספה')}
                                </button>
                                {editingId && (
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className="px-4 py-2.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
                                    >
                                        ביטול
                                    </button>
                                )}
                            </div>
                        </div>
                    </form>

                    <FrameCategoriesPanel categories={categories} onChanged={loadData} />
                </div>

                <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">מסגרות קיימות ({frames.length})</h2>
                    {loading ? (
                        <p className="text-gray-500 text-center py-12">טוען...</p>
                    ) : frames.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                            <FaImage className="mx-auto text-4xl mb-3 opacity-40" />
                            <p>אין מסגרות עדיין. הוסיפי מסגרת ראשונה בטופס.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto">
                            {frames.map((frame) => (
                                <FrameCard
                                    key={frame._id}
                                    frame={frame}
                                    printSizes={printSizes}
                                    isBeingEdited={editingId === frame._id}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
