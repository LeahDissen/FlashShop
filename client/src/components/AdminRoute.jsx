import { Navigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

const AdminRoute = ({ children }) => {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const role = useAuthStore((state) => state.role);
    if (isAuthenticated === null) {
        return <div className="flex justify-center p-10">טוען נתונים...</div>;
    }
    if (!isAuthenticated || role !== 'admin') {
        return <Navigate to="/" replace />;
    }
    return children;
};

export default AdminRoute;