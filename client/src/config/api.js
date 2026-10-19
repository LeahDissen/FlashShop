const stripSlash = (url = "") => url.replace(/\/$/, "");

/**
 * Server URLs are set at build time from environment variables (VITE_*) –
 * see client/.env.development / .env.production / .env.example.
 */
export const MONGO_API = stripSlash(import.meta.env.VITE_MONGO_API || "http://localhost:10000");
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
/** The "sign in with Google" button is shown only once a Client ID for this site is configured */
export const GOOGLE_LOGIN_ENABLED = Boolean(GOOGLE_CLIENT_ID);
export const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "";
export const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "ml_default";
