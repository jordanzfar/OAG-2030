import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App';
import '@/index.css';

// 👇 1. AÑADE ESTAS IMPORTACIONES 👇
import { createClient } from '@supabase/supabase-js';
import { SessionContextProvider } from '@supabase/auth-helpers-react';

// 👇 2. CREA EL CLIENTE DE SUPABASE AQUÍ 👇
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* 👇 3. ENVUELVE TU APP CON EL PROVEEDOR AQUÍ 👇 */}
    <SessionContextProvider supabaseClient={supabase}>
      <App />
    </SessionContextProvider>
  </React.StrictMode>
);