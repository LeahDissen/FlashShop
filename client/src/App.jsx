import { useEffect } from 'react';
import AppRoutes from './AppRoutes.jsx';
import useAuthStore from './store/authStore';
import { initProductCategories } from './utils/initProductCategories';
import './App.css';

function App() {
  const initializeAuth = useAuthStore(state => state.initialize);

  useEffect(() => {
    initializeAuth();
    initProductCategories();
  }, []);

  return (
    <>
      <div className="App">
        <AppRoutes />
      </div>
    </>
  )
}

export default App
