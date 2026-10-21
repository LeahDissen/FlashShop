import { FaEnvelope, FaFont, FaImages, FaPhone } from 'react-icons/fa';

/** The frame the customer chose in the editor – size, orientation and whether the photo was rotated */
export function FrameSelectionSummary({ selection, orientationLabels }) {
    if (!selection) return null;
    const orientationText = (value) => orientationLabels?.[value] || value || '—';
    const badges = [
        selection.printSizeLabel || selection.printSizeKey,
        selection.frameOrientation && `מסגרת ${orientationText(selection.frameOrientation)}`,
        selection.rotationApplied && 'התמונה סובבה ב-90°',
        selection.isFixedOverlay && 'שכבת Overlay קבועה',
    ].filter(Boolean);

    return (
        <div className="mt-3 rounded-xl border border-gray-100 bg-gray-50 p-3">
            <div className="flex items-center gap-2 mb-2">
                <FaImages className="text-[#f2665e]" size={13} />
                <span className="text-sm font-semibold text-gray-700">
                    מסגרת: {selection.frameTitle || 'ללא שם'}
                </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
                {badges.map((badge) => (
                    <span key={badge} className="text-[11px] bg-white border border-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                        {badge}
                    </span>
                ))}
            </div>
        </div>
    );
}

/** The captions the customer added, with the chosen font, size and color */
export function CaptionsSummary({ captions }) {
    if (!Array.isArray(captions) || captions.length === 0) return null;
    return (
        <div className="mt-3 rounded-xl border border-gray-100 bg-gray-50 p-3">
            <div className="flex items-center gap-2 mb-2">
                <FaFont className="text-[#f2665e]" size={12} />
                <span className="text-sm font-semibold text-gray-700">כתוביות ({captions.length})</span>
            </div>
            <ul className="space-y-2">
                {captions.map((caption, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                        <span
                            className="mt-1 w-3.5 h-3.5 rounded-full border border-gray-300 shrink-0"
                            style={{ backgroundColor: caption.color || '#FFFFFF' }}
                            title={caption.color}
                        />
                        <div className="min-w-0">
                            <p className="text-gray-800 break-words">{caption.content || '—'}</p>
                            <p className="text-xs text-gray-500">
                                {[caption.fontFamily, caption.fontSize && `${caption.fontSize}px`, caption.color]
                                    .filter(Boolean)
                                    .join(' · ')}
                            </p>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}

/** A request for the shop's designer: the customer's contact details, description and attached photo */
export function DesignerRequestBox({ contact }) {
    if (!contact || contact.type !== 'designer-service') return null;
    return (
        <div className="mt-4 rounded-xl border border-[#f2665e]/20 bg-[#fff5f4] p-4 text-sm flex gap-4 items-start">
            {contact.referenceImage && (
                <a href={contact.referenceImage} target="_blank" rel="noreferrer" className="shrink-0">
                    <img
                        src={contact.referenceImage}
                        alt="תמונה מצורפת"
                        className="w-24 h-24 object-cover rounded-lg border border-[#f2665e]/20 bg-white"
                    />
                </a>
            )}
            <div className="min-w-0 flex-1 space-y-1">
                {contact.name && <p className="font-bold text-gray-800">{contact.name}</p>}
                {contact.phone && (
                    <p className="flex items-center gap-2 text-gray-700">
                        <FaPhone className="text-[#f2665e]" size={12} />
                        <a href={`tel:${contact.phone}`} className="hover:underline" dir="ltr">{contact.phone}</a>
                    </p>
                )}
                {contact.email && (
                    <p className="flex items-center gap-2 text-gray-700">
                        <FaEnvelope className="text-[#f2665e]" size={12} />
                        <a href={`mailto:${contact.email}`} className="hover:underline">{contact.email}</a>
                    </p>
                )}
                {contact.description && (
                    <p className="text-gray-600 mt-2 whitespace-pre-wrap">{contact.description}</p>
                )}
            </div>
        </div>
    );
}
