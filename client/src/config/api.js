const MONGO_RENDER_API = "https://flashshop-ghi0.onrender.com";
const REDIS_RENDER_API = "https://flashshop-redis.onrender.com";

const stripSlash = (url = "") => url.replace(/\/$/, "");

export const MONGO_API = import.meta.env.PROD
    ? MONGO_RENDER_API
    : stripSlash(import.meta.env.VITE_MONGO_API || "http://localhost:5000");

export const REDIS_API = import.meta.env.PROD
    ? REDIS_RENDER_API
    : stripSlash(import.meta.env.VITE_REDIS_API || "http://localhost:4000");
