import redis from "../config/redis.js";

// Generic factory for GET handler
const createGetHandler = (key) => {
    return async (req, res) => {
        try {
            const data = await redis.hgetall(key);
            res.json(data);
        } catch (err) {
            console.error(`get ${key} page error:`, err);
            res.status(500).json({ error: err.message });
        }
    };
};

// Generic factory for UPDATE handler
const createUpdateHandler = (key) => {
    return async (req, res) => {
        try {
            const data = req.body || {};
            const existingKeys = await redis.hkeys(key);
            const fieldsToUpdate = {};

            for (const k of existingKeys) {
                if (Object.prototype.hasOwnProperty.call(data, k)) {
                    fieldsToUpdate[k] = data[k];
                }
            }

            if (Object.keys(fieldsToUpdate).length > 0) {
                await redis.hset(key, fieldsToUpdate);
            }

            res.json({ success: true, updatedFields: Object.keys(fieldsToUpdate) });
        } catch (err) {
            console.error(`update ${key} page error:`, err);
            res.status(500).json({ error: err.message });
        }
    };
};

// Exports using factories — שמות פונקציות לא השתנו
export const getHeaderPage = createGetHandler("header");
export const updateHeaderPage = createUpdateHandler("header");

export const getHomePage = createGetHandler("home");
export const updateHomePage = createUpdateHandler("home");

export const getAboutPage = createGetHandler("about");
export const updateAboutPage = createUpdateHandler("about");

export const getTermsPage = createGetHandler("terms");
export const updateTermsPage = createUpdateHandler("terms");

export const getTipsPage = createGetHandler("tips");
export const updateTipsPage = createUpdateHandler("tips");

export const getClubPage = createGetHandler("club");
export const updateClubPage = createUpdateHandler("club");

export const getFooterPage = createGetHandler("footer");
export const updateFooterPage = createUpdateHandler("footer");
