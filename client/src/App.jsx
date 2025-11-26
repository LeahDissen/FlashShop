import { useEffect } from 'react'
import './App.css'
import AppRoutes from './AppRoutes.jsx';
import useAuthStore from './store/authStore';

function App() {
  const initializeAuth = useAuthStore(state => state.initialize);

  useEffect(() => {
    initializeAuth();
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
