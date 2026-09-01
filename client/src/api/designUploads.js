import axios from "axios";

import { MONGO_API } from "../config/api";
const API_URL = `${MONGO_API}/design-uploads`;

export const getDriveStatus = async () => {
    const response = await axios.get(`${API_URL}/status`);
    return response.data;
};

/**
 * מעלה את קובץ העיצוב הסופי לענן לפני יצירת ההזמנה.
 * @returns {Promise<{configured: boolean, file?: {id: string, name: string, url: string}}>}
 */
export const uploadFinalDesign = async ({ image, projectName }) => {
    const response = await axios.post(
        API_URL,
        { image, projectName },
        { withCredentials: true },
    );
    return response.data;
};
