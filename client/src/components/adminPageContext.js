import { createContext, useContext } from 'react';

/** true inside the admin pages (AdminRoute) – shop components can skip themselves there */
export const AdminPageContext = createContext(false);

export const useIsAdminPage = () => useContext(AdminPageContext);
