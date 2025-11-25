import axios from "axios";

const API_URL = "http://localhost:5000/club";

export const joinClubRequest = async (userData) => {
    const response = await axios.post(`${API_URL}/join`, userData);
    console.log("api is correct: " + response.data);
    return response.data;
};