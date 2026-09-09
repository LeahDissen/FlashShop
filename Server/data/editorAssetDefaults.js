/**
 * העתק של רכיבי עורך העיצוב העצמי כפי שהם מוגדרים היום ב-
 * client/src/components/editor/EditorSidebar.jsx
 * משמש לזריעה ראשונית בלבד.
 */

const svgToDataURL = (svgString) =>
    `data:image/svg+xml;base64,${Buffer.from(svgString, "utf8").toString("base64")}`;

const shapeSvgs = {
    tri: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><polygon points="50,5 95,95 5,95" fill="#3B82F6"/></svg>`,
    square: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="5" y="5" width="90" height="90" rx="4" fill="#3B82F6"/></svg>`,
    circle: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="45" fill="#3B82F6"/></svg>`,
    star: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><polygon points="50,5 61,35 95,35 68,55 79,85 50,65 21,85 32,55 5,35 39,35" fill="#3B82F6"/></svg>`,
    heart: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M50 88.9L16.7 55.6C7.2 46.1 7.2 30.9 16.7 21.4s24.7-9.5 33.3 0l0 0 0 0c8.6-9.5 23.8-9.5 33.3 0s9.5 24.7 0 34.2L50 88.9z" fill="#3B82F6"/></svg>`,
    rect: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="5" y="20" width="90" height="60" rx="4" fill="#3B82F6"/></svg>`,
    hexagon: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><polygon points="50,5 95,27.5 95,72.5 50,95 5,72.5 5,27.5" fill="#3B82F6"/></svg>`,
};

const elementBackgroundSvgs = {
    grid: `<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="gray" stroke-width="0.5"/></pattern></defs><rect width="100" height="100" fill="url(#grid)"/></svg>`,
    dots: `<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="dots" width="10" height="10" patternUnits="userSpaceOnUse"><circle cx="5" cy="5" r="2" fill="gray"/></pattern></defs><rect width="100" height="100" fill="url(#dots)"/></svg>`,
    black: `<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="#333"/></svg>`,
    wood: `<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="wood" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M0 10 Q5 5 10 10 T20 10" stroke="#8B4513" fill="none"/></pattern></defs><rect width="100" height="100" fill="#DEB887"/><rect width="100" height="100" fill="url(#wood)" opacity="0.5"/></svg>`,
    sky: `<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#87CEEB"/><stop offset="100%" stop-color="#E0F7FA"/></linearGradient></defs><rect width="100" height="100" fill="url(#sky)"/></svg>`,
};

const graphicSvgs = {
    flower1: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="20" fill="#FCD34D"/><circle cx="50" cy="20" r="20" fill="#F87171"/><circle cx="80" cy="50" r="20" fill="#F87171"/><circle cx="50" cy="80" r="20" fill="#F87171"/><circle cx="20" cy="50" r="20" fill="#F87171"/></svg>`,
    leaf: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M50 95 Q50 5 5 5 Q50 5 50 95 Z" fill="#34D399" transform="rotate(-15 50 95)"/></svg>`,
    flower2: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M50 50 L30 10 L70 10 Z" fill="#60A5FA"/><path d="M50 50 L90 30 L90 70 Z" fill="#60A5FA"/><path d="M50 50 L70 90 L30 90 Z" fill="#60A5FA"/><path d="M50 50 L10 70 L10 30 Z" fill="#60A5FA"/><circle cx="50" cy="50" r="15" fill="#FEF3C7"/></svg>`,
    sun: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="25" fill="#FDB813"/><g stroke="#FDB813" stroke-width="5" stroke-linecap="round"><line x1="50" y1="10" x2="50" y2="20"/><line x1="50" y1="80" x2="50" y2="90"/><line x1="10" y1="50" x2="20" y2="50"/><line x1="80" y1="50" x2="90" y2="50"/><line x1="22" y1="22" x2="29" y2="29"/><line x1="71" y1="71" x2="78" y2="78"/><line x1="22" y1="78" x2="29" y2="71"/><line x1="71" y1="29" x2="78" y2="22"/></g></svg>`,
    cloud: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M25,60 a20,20 0 0,1 0,-40 a20,20 0 0,1 30,-10 a20,20 0 0,1 30,10 a20,20 0 0,1 0,40 z" fill="#E0F7FA" stroke="#B2EBF2" stroke-width="2"/></svg>`,
};

const iconSvgs = {
    user: `<svg viewBox="0 0 24 24" fill="#1F2937" xmlns="http://www.w3.org/2000/svg"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>`,
    home: `<svg viewBox="0 0 24 24" fill="#1F2937" xmlns="http://www.w3.org/2000/svg"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>`,
    star_icon: `<svg viewBox="0 0 24 24" fill="#1F2937" xmlns="http://www.w3.org/2000/svg"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>`,
    arrow: `<svg viewBox="0 0 24 24" fill="#1F2937" xmlns="http://www.w3.org/2000/svg"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" transform="rotate(-90 12 12)"/></svg>`,
    plane: `<svg viewBox="0 0 24 24" fill="#1F2937" xmlns="http://www.w3.org/2000/svg"><path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg>`,
    twitter: `<svg viewBox="0 0 24 24" fill="#1F2937" xmlns="http://www.w3.org/2000/svg"><path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05-.78-.83-1.88-1.35-3.09-1.35-2.34 0-4.24 1.9-4.24 4.24 0 .33.04.65.1.96-3.53-.18-6.66-1.87-8.75-4.44-.37.63-.58 1.37-.58 2.15 0 1.47.75 2.77 1.89 3.53-.69-.02-1.35-.21-1.92-.53v.05c0 2.05 1.46 3.76 3.4 4.15-.36.1-.73.15-1.11.15-.27 0-.54-.02-.8-.06.54 1.68 2.1 2.91 3.96 2.94-1.45 1.14-3.27 1.82-5.25 1.82-.34 0-.68-.02-1.02-.06 1.87 1.2 4.09 1.9 6.47 1.9 7.76 0 12.01-6.43 12.01-12.01 0-.18 0-.37-.01-.55.82-.6 1.53-1.34 2.09-2.2z"/></svg>`,
};

const buildSvgAsset = ({ seedKey, category, title, svg, type = "image", sortOrder }) => ({
    seedKey,
    category,
    title,
    type,
    content: type === "shape" ? svg : "",
    src: svgToDataURL(svg),
    isActive: true,
    sortOrder,
});

const DEFAULT_EDITOR_ASSETS = [
    buildSvgAsset({ seedKey: "shape:tri", category: "shape", title: "משולש", svg: shapeSvgs.tri, type: "shape", sortOrder: 0 }),
    buildSvgAsset({ seedKey: "shape:square", category: "shape", title: "ריבוע", svg: shapeSvgs.square, type: "shape", sortOrder: 1 }),
    buildSvgAsset({ seedKey: "shape:circle", category: "shape", title: "עיגול", svg: shapeSvgs.circle, type: "shape", sortOrder: 2 }),
    buildSvgAsset({ seedKey: "shape:star", category: "shape", title: "כוכב", svg: shapeSvgs.star, type: "shape", sortOrder: 3 }),
    buildSvgAsset({ seedKey: "shape:heart", category: "shape", title: "לב", svg: shapeSvgs.heart, type: "shape", sortOrder: 4 }),
    buildSvgAsset({ seedKey: "shape:rect", category: "shape", title: "מלבן", svg: shapeSvgs.rect, type: "shape", sortOrder: 5 }),
    buildSvgAsset({ seedKey: "shape:hexagon", category: "shape", title: "משושה", svg: shapeSvgs.hexagon, type: "shape", sortOrder: 6 }),

    buildSvgAsset({ seedKey: "elementBackground:grid", category: "elementBackground", title: "רשת", svg: elementBackgroundSvgs.grid, sortOrder: 0 }),
    buildSvgAsset({ seedKey: "elementBackground:dots", category: "elementBackground", title: "נקודות", svg: elementBackgroundSvgs.dots, sortOrder: 1 }),
    buildSvgAsset({ seedKey: "elementBackground:black", category: "elementBackground", title: "שחור", svg: elementBackgroundSvgs.black, sortOrder: 2 }),
    buildSvgAsset({ seedKey: "elementBackground:wood", category: "elementBackground", title: "עץ", svg: elementBackgroundSvgs.wood, sortOrder: 3 }),
    buildSvgAsset({ seedKey: "elementBackground:sky", category: "elementBackground", title: "שמיים", svg: elementBackgroundSvgs.sky, sortOrder: 4 }),

    buildSvgAsset({ seedKey: "graphic:flower1", category: "graphic", title: "פרח 1", svg: graphicSvgs.flower1, sortOrder: 0 }),
    buildSvgAsset({ seedKey: "graphic:leaf", category: "graphic", title: "עלה", svg: graphicSvgs.leaf, sortOrder: 1 }),
    buildSvgAsset({ seedKey: "graphic:flower2", category: "graphic", title: "פרח 2", svg: graphicSvgs.flower2, sortOrder: 2 }),
    buildSvgAsset({ seedKey: "graphic:sun", category: "graphic", title: "שמש", svg: graphicSvgs.sun, sortOrder: 3 }),
    buildSvgAsset({ seedKey: "graphic:cloud", category: "graphic", title: "ענן", svg: graphicSvgs.cloud, sortOrder: 4 }),

    buildSvgAsset({ seedKey: "icon:user", category: "icon", title: "משתמש", svg: iconSvgs.user, sortOrder: 0 }),
    buildSvgAsset({ seedKey: "icon:home", category: "icon", title: "בית", svg: iconSvgs.home, sortOrder: 1 }),
    buildSvgAsset({ seedKey: "icon:star_icon", category: "icon", title: "כוכב", svg: iconSvgs.star_icon, sortOrder: 2 }),
    buildSvgAsset({ seedKey: "icon:arrow", category: "icon", title: "חץ", svg: iconSvgs.arrow, sortOrder: 3 }),
    buildSvgAsset({ seedKey: "icon:plane", category: "icon", title: "מטוס", svg: iconSvgs.plane, sortOrder: 4 }),
    buildSvgAsset({ seedKey: "icon:twitter", category: "icon", title: "טוויטר", svg: iconSvgs.twitter, sortOrder: 5 }),

    {
        seedKey: "canvasBackground:unsplash-watercolor",
        category: "canvasBackground",
        title: "רקע צבעי מים",
        type: "image",
        src: "https://images.unsplash.com/photo-1519750783826-e2420f4d687f?q=80&w=300&h=450&fit=crop",
        isActive: true,
        sortOrder: 0,
    },
    {
        seedKey: "canvasBackground:unsplash-abstract",
        category: "canvasBackground",
        title: "רקע מופשט",
        type: "image",
        src: "https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?q=80&w=300&h=450&fit=crop",
        isActive: true,
        sortOrder: 1,
    },
    {
        seedKey: "canvasBackground:unsplash-texture",
        category: "canvasBackground",
        title: "רקע טקסטורה",
        type: "image",
        src: "https://images.unsplash.com/photo-1604147706283-d7119b5b822c?q=80&w=300&h=450&fit=crop",
        isActive: true,
        sortOrder: 2,
    },
    {
        seedKey: "canvasBackground:unsplash-soft",
        category: "canvasBackground",
        title: "רקע רך",
        type: "image",
        src: "https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?q=80&w=300&h=450&fit=crop",
        isActive: true,
        sortOrder: 3,
    },

    { seedKey: "color:#FFFFFF", category: "color", title: "לבן", type: "color", colorValue: "#FFFFFF", colorClass: "bg-white", isActive: true, sortOrder: 0 },
    { seedKey: "color:#E5E7EB", category: "color", title: "אפור בהיר", type: "color", colorValue: "#E5E7EB", colorClass: "bg-gray-200", isActive: true, sortOrder: 1 },
    { seedKey: "color:#9CA3AF", category: "color", title: "אפור", type: "color", colorValue: "#9CA3AF", colorClass: "bg-gray-400", isActive: true, sortOrder: 2 },
    { seedKey: "color:#4B5563", category: "color", title: "אפור כהה", type: "color", colorValue: "#4B5563", colorClass: "bg-gray-600", isActive: true, sortOrder: 3 },
    { seedKey: "color:#1F2937", category: "color", title: "אפור פחם", type: "color", colorValue: "#1F2937", colorClass: "bg-gray-800", isActive: true, sortOrder: 4 },
    { seedKey: "color:#000000", category: "color", title: "שחור", type: "color", colorValue: "#000000", colorClass: "bg-black", isActive: true, sortOrder: 5 },
    { seedKey: "color:#9333EA", category: "color", title: "סגול", type: "color", colorValue: "#9333EA", colorClass: "bg-purple-600", isActive: true, sortOrder: 6 },
    { seedKey: "color:#C084FC", category: "color", title: "סגול בהיר", type: "color", colorValue: "#C084FC", colorClass: "bg-purple-400", isActive: true, sortOrder: 7 },
    { seedKey: "color:#F472B6", category: "color", title: "ורוד", type: "color", colorValue: "#F472B6", colorClass: "bg-pink-400", isActive: true, sortOrder: 8 },
    { seedKey: "color:#F87171", category: "color", title: "אדום בהיר", type: "color", colorValue: "#F87171", colorClass: "bg-red-400", isActive: true, sortOrder: 9 },
    { seedKey: "color:#DC2626", category: "color", title: "אדום", type: "color", colorValue: "#DC2626", colorClass: "bg-red-600", isActive: true, sortOrder: 10 },
    { seedKey: "color:#1E40AF", category: "color", title: "כחול כהה", type: "color", colorValue: "#1E40AF", colorClass: "bg-blue-800", isActive: true, sortOrder: 11 },
    { seedKey: "color:#3B82F6", category: "color", title: "כחול", type: "color", colorValue: "#3B82F6", colorClass: "bg-blue-500", isActive: true, sortOrder: 12 },
    { seedKey: "color:#38BDF8", category: "color", title: "תכלת", type: "color", colorValue: "#38BDF8", colorClass: "bg-sky-400", isActive: true, sortOrder: 13 },
    { seedKey: "color:#67E8F9", category: "color", title: "ציאן", type: "color", colorValue: "#67E8F9", colorClass: "bg-cyan-300", isActive: true, sortOrder: 14 },
    { seedKey: "color:#2DD4BF", category: "color", title: "טורקיז", type: "color", colorValue: "#2DD4BF", colorClass: "bg-teal-400", isActive: true, sortOrder: 15 },
    { seedKey: "color:#FB923C", category: "color", title: "כתום", type: "color", colorValue: "#FB923C", colorClass: "bg-orange-400", isActive: true, sortOrder: 16 },
    { seedKey: "color:#FBBF24", category: "color", title: "ענבר", type: "color", colorValue: "#FBBF24", colorClass: "bg-amber-400", isActive: true, sortOrder: 17 },
    { seedKey: "color:#FDE047", category: "color", title: "צהוב", type: "color", colorValue: "#FDE047", colorClass: "bg-yellow-300", isActive: true, sortOrder: 18 },
    { seedKey: "color:#A3E635", category: "color", title: "ליים", type: "color", colorValue: "#A3E635", colorClass: "bg-lime-400", isActive: true, sortOrder: 19 },
    { seedKey: "color:#22C55E", category: "color", title: "ירוק", type: "color", colorValue: "#22C55E", colorClass: "bg-green-500", isActive: true, sortOrder: 20 },
];

module.exports = { DEFAULT_EDITOR_ASSETS, svgToDataURL };
