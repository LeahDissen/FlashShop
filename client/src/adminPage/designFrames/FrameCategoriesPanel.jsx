import { useState } from 'react';
import { FaTrash } from 'react-icons/fa';
import { createFrameCategory, deleteFrameCategory, updateFrameCategory } from '../../api/frameCategories';

/** The frame categories: add, rename and delete. `onChanged` reloads the page's data. */
export default function FrameCategoriesPanel({ categories, onChanged }) {
    const [name, setName] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [message, setMessage] = useState({ type: '', text: '' });

    const resetForm = () => {
        setName('');
        setEditingId(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const trimmed = name.trim();
        if (!trimmed) {
            setMessage({ type: 'error', text: 'יש להזין שם קטגוריה' });
            return;
        }
        setMessage({ type: '', text: '' });
        try {
            if (editingId) {
                await updateFrameCategory(editingId, { name: trimmed });
                setMessage({ type: 'success', text: 'הקטגוריה עודכנה' });
            } else {
                await createFrameCategory({ name: trimmed });
                setMessage({ type: 'success', text: 'הקטגוריה נוספה' });
            }
            resetForm();
            await onChanged();
        } catch (err) {
            setMessage({ type: 'error', text: err?.response?.data?.msg || 'שגיאה בשמירת הקטגוריה' });
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('האם למחוק קטגוריה זו?')) return;
        try {
            await deleteFrameCategory(id);
            if (editingId === id) resetForm();
            await onChanged();
            setMessage({ type: 'success', text: 'הקטגוריה נמחקה' });
        } catch (err) {
            setMessage({ type: 'error', text: err?.response?.data?.msg || 'שגיאה במחיקת הקטגוריה' });
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-3">ניהול קטגוריות</h2>
            <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="שם קטגוריה חדשה"
                    className="flex-1 border border-gray-200 rounded-lg p-2.5 text-sm"
                />
                <button type="submit" className="px-4 py-2 bg-gray-800 text-white text-sm font-bold rounded-lg hover:bg-gray-700">
                    {editingId ? 'עדכון' : 'הוסף'}
                </button>
                {editingId && (
                    <button type="button" onClick={resetForm} className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600">
                        ביטול
                    </button>
                )}
            </form>

            {message.text && (
                <p className={`text-sm mb-3 ${message.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>{message.text}</p>
            )}

            <div className="space-y-2 max-h-48 overflow-y-auto">
                {categories.map((cat) => (
                    <div key={cat._id} className="flex items-center justify-between gap-2 p-2 rounded-lg border border-gray-100 hover:bg-gray-50">
                        <span className="text-sm font-medium text-gray-800">{cat.name}</span>
                        <div className="flex gap-1">
                            <button
                                type="button"
                                onClick={() => {
                                    setEditingId(cat._id);
                                    setName(cat.name);
                                }}
                                className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200"
                            >
                                עריכה
                            </button>
                            <button
                                type="button"
                                onClick={() => handleDelete(cat._id)}
                                className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                                aria-label="מחק קטגוריה"
                            >
                                <FaTrash size={12} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
