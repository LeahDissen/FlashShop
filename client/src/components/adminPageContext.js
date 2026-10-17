import { createContext, useContext } from 'react';

/** true בתוך עמודי הניהול (AdminRoute) – רכיבים של החנות יכולים לדלג על עצמם שם */
export const AdminPageContext = createContext(false);

export const useIsAdminPage = () => useContext(AdminPageContext);
