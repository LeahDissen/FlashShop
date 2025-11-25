import axios from "axios";
const API_URL = 'http://localhost:5000/auth';

axios.defaults.withCredentials = true;

export const signUp = async (name, email, password) => {
    const response = await axios.post(`${API_URL}/signup`, {
        name,
        email,
        password
    });
    return response;
};

export const signIn = async (email, password) => {
    const response = await axios.post(`${API_URL}/login`, {
        email,
        password
    });
    return response;
};

export const signOut = async () => {
    const response = await axios.post(`${API_URL}/logout`);
    return response;
};

export const forgotPasswordRequest = async (email) => {
    const response = await axios.post(`${API_URL}/requestPasswordReset`, {
        email
    });
    return response;
}
export const resetPassword = async (token, newPassword) => {
    const response = await axios.post(`${API_URL}/resetPassword`, {
        token,
        newPassword
    });
    return response;
};

export const fetchUserInfo = async () => {
    const response = await axios.get(`${API_URL}/myInfo`);
    return response;
};