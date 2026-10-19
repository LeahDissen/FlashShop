import { useEffect } from 'react';
import AppRoutes from './AppRoutes.jsx';
import useAuthStore from './store/authStore';
import { useCartStore } from './store/cartStore';
import { initProductCategories } from './utils/initProductCategories';
import './App.css';

function App() {
  const initializeAuth = useAuthStore(state => state.initialize);
  const loadCart = useCartStore(state => state.loadCart);
  const dropOtherAccountCart = useCartStore(state => state.dropOtherAccountCart);

  useEffect(() => {
    const boot = async () => {
      const user = await initializeAuth();
      if (user?._id) {
        await loadCart(user._id);
      } else {
        dropOtherAccountCart();
      }
    };
    boot();
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
