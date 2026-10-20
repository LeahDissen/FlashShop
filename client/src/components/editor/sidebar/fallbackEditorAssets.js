/** The editor's built-in assets, used until (or when) the shop's assets from the dashboard are not loaded */

const FALLBACK_COLORS = [
    { value: '#FFFFFF', class: 'bg-white' }, { value: '#E5E7EB', class: 'bg-gray-200' }, { value: '#9CA3AF', class: 'bg-gray-400' }, { value: '#4B5563', class: 'bg-gray-600' },
    { value: '#1F2937', class: 'bg-gray-800' }, { value: '#000000', class: 'bg-black' }, { value: '#9333EA', class: 'bg-purple-600' }, { value: '#C084FC', class: 'bg-purple-400' },
    { value: '#F472B6', class: 'bg-pink-400' }, { value: '#F87171', class: 'bg-red-400' }, { value: '#DC2626', class: 'bg-red-600' }, { value: '#1E40AF', class: 'bg-blue-800' },
    { value: '#3B82F6', class: 'bg-blue-500' }, { value: '#38BDF8', class: 'bg-sky-400' }, { value: '#67E8F9', class: 'bg-cyan-300' }, { value: '#2DD4BF', class: 'bg-teal-400' },
    { value: '#FB923C', class: 'bg-orange-400' }, { value: '#FBBF24', class: 'bg-amber-400' }, { value: '#FDE047', class: 'bg-yellow-300' }, { value: '#A3E635', class: 'bg-lime-400' },
    { value: '#22C55E', class: 'bg-green-500' },
];

const FALLBACK_CANVAS_BACKGROUNDS = [
    'https://images.unsplash.com/photo-1519750783826-e2420f4d687f?q=80&w=300&h=450&fit=crop',
    'https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?q=80&w=300&h=450&fit=crop',
    'https://images.unsplash.com/photo-1604147706283-d7119b5b822c?q=80&w=300&h=450&fit=crop',
    'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?q=80&w=300&h=450&fit=crop',
];

const svgToDataURL = (svgString) =>
    `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgString)))}`;

const shapeSvgs = {
    tri: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><polygon points="50,5 95,95 5,95" fill="#3B82F6"/></svg>`,
    square: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="5" y="5" width="90" height="90" rx="4" fill="#3B82F6"/></svg>`,
    circle: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="45" fill="#3B82F6"/></svg>`,
    star: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><polygon points="50,5 61,35 95,35 68,55 79,85 50,65 21,85 32,55 5,35 39,35" fill="#3B82F6"/></svg>`,
    heart: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M50 88.9L16.7 55.6C7.2 46.1 7.2 30.9 16.7 21.4s24.7-9.5 33.3 0l0 0 0 0c8.6-9.5 23.8-9.5 33.3 0s9.5 24.7 0 34.2L50 88.9z" fill="#3B82F6"/></svg>`,
    rect: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="5" y="20" width="90" height="60" rx="4" fill="#3B82F6"/></svg>`,
    hexagon: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><polygon points="50,5 95,27.5 95,72.5 50,95 5,72.5 5,27.5" fill="#3B82F6"/></svg>`,
};

const shapes = [
    { id: 'tri', alt: 'Triangle', src: svgToDataURL(shapeSvgs.tri), content: shapeSvgs.tri, type: 'shape' },
    { id: 'square', alt: 'Square', src: svgToDataURL(shapeSvgs.square), content: shapeSvgs.square, type: 'shape' },
    { id: 'circle', alt: 'Circle', src: svgToDataURL(shapeSvgs.circle), content: shapeSvgs.circle, type: 'shape' },
    { id: 'star', alt: 'Star', src: svgToDataURL(shapeSvgs.star), content: shapeSvgs.star, type: 'shape' },
    { id: 'heart', alt: 'Heart', src: svgToDataURL(shapeSvgs.heart), content: shapeSvgs.heart, type: 'shape' },
    { id: 'rect', alt: 'Rectangle', src: svgToDataURL(shapeSvgs.rect), content: shapeSvgs.rect, type: 'shape' },
    { id: 'hexagon', alt: 'Hexagon', src: svgToDataURL(shapeSvgs.hexagon), content: shapeSvgs.hexagon, type: 'shape' },
];

const backgroundAssets = [
    { id: 'grid', alt: 'Grid', src: svgToDataURL(`<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="gray" stroke-width="0.5"/></pattern></defs><rect width="100" height="100" fill="url(#grid)"/></svg>`) },
    { id: 'dots', alt: 'Dots', src: svgToDataURL(`<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="dots" width="10" height="10" patternUnits="userSpaceOnUse"><circle cx="5" cy="5" r="2" fill="gray"/></pattern></defs><rect width="100" height="100" fill="url(#dots)"/></svg>`) },
    { id: 'black', alt: 'Black', src: svgToDataURL(`<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="#333"/></svg>`) },
    { id: 'wood', alt: 'Wood', src: svgToDataURL(`<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="wood" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M0 10 Q5 5 10 10 T20 10" stroke="#8B4513" fill="none"/></pattern></defs><rect width="100" height="100" fill="#DEB887"/><rect width="100" height="100" fill="url(#wood)" opacity="0.5"/></svg>`) },
    { id: 'sky', alt: 'Sky', src: svgToDataURL(`<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#87CEEB"/><stop offset="100%" stop-color="#E0F7FA"/></linearGradient></defs><rect width="100" height="100" fill="url(#sky)"/></svg>`) },
];

const graphics = [
    { id: 'flower1', alt: 'Flower 1', src: svgToDataURL(`<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="20" fill="#FCD34D"/><circle cx="50" cy="20" r="20" fill="#F87171"/><circle cx="80" cy="50" r="20" fill="#F87171"/><circle cx="50" cy="80" r="20" fill="#F87171"/><circle cx="20" cy="50" r="20" fill="#F87171"/></svg>`) },
    { id: 'leaf', alt: 'Leaf', src: svgToDataURL(`<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M50 95 Q50 5 5 5 Q50 5 50 95 Z" fill="#34D399" transform="rotate(-15 50 95)"/></svg>`) },
    { id: 'flower2', alt: 'Flower 2', src: svgToDataURL(`<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M50 50 L30 10 L70 10 Z" fill="#60A5FA"/><path d="M50 50 L90 30 L90 70 Z" fill="#60A5FA"/><path d="M50 50 L70 90 L30 90 Z" fill="#60A5FA"/><path d="M50 50 L10 70 L10 30 Z" fill="#60A5FA"/><circle cx="50" cy="50" r="15" fill="#FEF3C7"/></svg>`) },
    { id: 'sun', alt: 'Sun', src: svgToDataURL(`<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="25" fill="#FDB813"/><g stroke="#FDB813" stroke-width="5" stroke-linecap="round"><line x1="50" y1="10" x2="50" y2="20"/><line x1="50" y1="80" x2="50" y2="90"/><line x1="10" y1="50" x2="20" y2="50"/><line x1="80" y1="50" x2="90" y2="50"/><line x1="22" y1="22" x2="29" y2="29"/><line x1="71" y1="71" x2="78" y2="78"/><line x1="22" y1="78" x2="29" y2="71"/><line x1="71" y1="29" x2="78" y2="22"/></g></svg>`) },
    { id: 'cloud', alt: 'Cloud', src: svgToDataURL(`<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M25,60 a20,20 0 0,1 0,-40 a20,20 0 0,1 30,-10 a20,20 0 0,1 30,10 a20,20 0 0,1 0,40 z" fill="#E0F7FA" stroke="#B2EBF2" stroke-width="2"/></svg>`) },
];


const icons = [
    { id: 'user', alt: 'User', src: svgToDataURL(`<svg viewBox="0 0 24 24" fill="#1F2937" xmlns="http://www.w3.org/2000/svg"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>`) },
    { id: 'home', alt: 'Home', src: svgToDataURL(`<svg viewBox="0 0 24 24" fill="#1F2937" xmlns="http://www.w3.org/2000/svg"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>`) },
    { id: 'star_icon', alt: 'Star', src: svgToDataURL(`<svg viewBox="0 0 24 24" fill="#1F2937" xmlns="http://www.w3.org/2000/svg"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>`) },
    { id: 'arrow', alt: 'Arrow', src: svgToDataURL(`<svg viewBox="0 0 24 24" fill="#1F2937" xmlns="http://www.w3.org/2000/svg"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" transform="rotate(-90 12 12)"/></svg>`) },
    { id: 'plane', alt: 'Plane', src: svgToDataURL(`<svg viewBox="0 0 24 24" fill="#1F2937" xmlns="http://www.w3.org/2000/svg"><path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg>`) },
    { id: 'twitter', alt: 'Twitter', src: svgToDataURL(`<svg viewBox="0 0 24 24" fill="#1F2937" xmlns="http://www.w3.org/2000/svg"><path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05-.78-.83-1.88-1.35-3.09-1.35-2.34 0-4.24 1.9-4.24 4.24 0 .33.04.65.1.96-3.53-.18-6.66-1.87-8.75-4.44-.37.63-.58 1.37-.58 2.15 0 1.47.75 2.77 1.89 3.53-.69-.02-1.35-.21-1.92-.53v.05c0 2.05 1.46 3.76 3.4 4.15-.36.1-.73.15-1.11.15-.27 0-.54-.02-.8-.06.54 1.68 2.1 2.91 3.96 2.94-1.45 1.14-3.27 1.82-5.25 1.82-.34 0-.68-.02-1.02-.06 1.87 1.2 4.09 1.9 6.47 1.9 7.76 0 12.01-6.43 12.01-12.01 0-.18 0-.37-.01-.55.82-.6 1.53-1.34 2.09-2.2z"/></svg>`) },
];

export const FALLBACK_EDITOR_ASSETS = {
    shapes,
    backgroundAssets,
    graphics,
    icons,
    canvasBackgrounds: FALLBACK_CANVAS_BACKGROUNDS,
    colors: FALLBACK_COLORS,
};
