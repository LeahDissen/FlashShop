import { ClockIcon, TrashIcon, XIcon } from '../icons';

const productLabelOf = (product) => product?.name || (typeof product === 'string' ? product : 'מוצר');

/** One saved project: click to open it on the canvas, or add it to the cart / delete it */
function SavedProjectCard({ project, onOpen, onDelete, onAddToCart }) {
    return (
        <div
            onClick={(e) => {
                e.preventDefault();
                onOpen(project);
            }}
            className="bg-white rounded-xl shadow-sm hover:shadow-md border border-gray-200 overflow-hidden cursor-pointer transition-all hover:border-red-300 group relative flex flex-col"
        >
            <div className="h-40 bg-gray-100 flex items-center justify-center overflow-hidden relative">
                {project.preview ? (
                    <img src={project.preview} alt={project.name} className="w-full h-full object-cover" />
                ) : (
                    <span className="text-gray-400">אין תצוגה מקדימה</span>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
            </div>
            <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                    <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-gray-800 truncate flex-1 ml-2">{project.name}</h4>
                        <button
                            onClick={(e) => onDelete(e, project._id)}
                            className="text-gray-400 hover:text-red-500 p-1 hover:bg-red-50 rounded transition-colors"
                            title="מחק פרויקט"
                        >
                            <TrashIcon className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="flex items-center text-xs text-gray-500 mt-1">
                        <ClockIcon className="w-3 h-3 ml-1" />
                        {project.updatedAt ? new Date(project.updatedAt).toLocaleDateString('he-IL') : 'תאריך לא ידוע'}
                    </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                    {project.selectedProduct ? (
                        <span className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded-full max-w-[50%] truncate">
                            {productLabelOf(project.selectedProduct)}
                        </span>
                    ) : (
                        <span className="text-xs text-gray-400">מוצר כללי</span>
                    )}

                    <button
                        onClick={(e) => onAddToCart(e, project)}
                        className="flex items-center bg-red-500 text-white text-xs font-bold py-1.5 px-3 rounded-lg hover:bg-red-600 transition-colors shadow-sm"
                    >
                        <span>הוסף לסל</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

/** "הפרויקטים שלי": the customer's saved designs */
export default function SavedProjectsModal({ projects, onClose, onOpen, onDelete, onAddToCart }) {
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black bg-opacity-75 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden">
                <div className="p-5 border-b flex justify-between items-center bg-gray-50">
                    <h3 className="text-xl font-bold text-gray-800">הפרויקטים שלי</h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                        <XIcon className="w-6 h-6 text-gray-500" />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto flex-1 bg-gray-100">
                    {projects.length === 0 ? (
                        <div className="text-center py-20 text-gray-500">
                            <p className="text-xl mb-2">אין פרויקטים שמורים</p>
                            <p className="text-sm">שמור את העיצוב הנוכחי שלך כדי לראות אותו כאן</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {projects.map((project) => (
                                <SavedProjectCard
                                    key={project._id}
                                    project={project}
                                    onOpen={onOpen}
                                    onDelete={onDelete}
                                    onAddToCart={onAddToCart}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
