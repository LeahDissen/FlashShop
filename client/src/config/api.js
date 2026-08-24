const RENDER_API = "https://flashshop-ghi0.onrender.com";

const stripSlash = (url = "") => url.replace(/\/$/, "");

export const MONGO_API = import.meta.env.PROD
    ? RENDER_API
    : stripSlash(import.meta.env.VITE_MONGO_API || "http://localhost:5000");

export const REDIS_API = import.meta.env.PROD
    ? RENDER_API
    : stripSlash(import.meta.env.VITE_REDIS_API || "http://localhost:4000");
