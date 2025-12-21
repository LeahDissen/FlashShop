import { GoogleOAuthProvider } from '@react-oauth/google';
import axios from 'axios';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';

axios.defaults.withCredentials = true;
const GOOGLE_CLIENT_ID = "211014983714-kr4ivfi7ar04vj1k26p77298p3pijckg.apps.googleusercontent.com";

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <App />
    </GoogleOAuthProvider>
  </StrictMode>,
)