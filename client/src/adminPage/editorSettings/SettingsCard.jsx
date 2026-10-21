/** Building blocks of the editor settings page */
export const Card = ({ title, description, children }) => (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-gray-800">{title}</h2>
        {description && <p className="text-sm text-gray-500 mt-1 mb-4">{description}</p>}
        <div className={description ? '' : 'mt-4'}>{children}</div>
    </section>
);

export const Field = ({ label, hint, children }) => (
    <label className="block">
        <span className="block text-sm font-medium text-gray-700 mb-1">{label}</span>
        {children}
        {hint && <span className="block text-xs text-gray-500 mt-1">{hint}</span>}
    </label>
);
