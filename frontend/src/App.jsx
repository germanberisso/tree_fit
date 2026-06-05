// Componente Principal de la Aplicación
import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';

const ContenidoApp = () => {
  const { usuario, cargando } = useAuth();
  const [vistaAuth, setVistaAuth] = useState('login'); // 'login' o 'registro'

  // Pantalla de carga premium inicial
  if (cargando) {
    return (
      <div className="pantalla-carga">
        <div className="cargador-spinner"></div>
        <p className="cargador-texto">Iniciando Tree Fit...</p>
        <style>{`
          .pantalla-carga {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background-color: var(--color-fondo);
            gap: 20px;
          }
          .cargador-spinner {
            width: 50px;
            height: 50px;
            border: 4px solid var(--color-borde);
            border-top: 4px solid var(--color-primario);
            border-radius: 50%;
            animation: girar 1s linear infinite;
          }
          .cargador-texto {
            color: var(--color-texto-secundario);
            font-size: 1rem;
            font-weight: 500;
          }
          @keyframes girar {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Si no hay sesión iniciada, mostrar login o registro
  if (!usuario) {
    return vistaAuth === 'login' ? (
      <Login irARegistro={() => setVistaAuth('registro')} />
    ) : (
      <Register irALogin={() => setVistaAuth('login')} />
    );
  }

  // Si hay sesión iniciada, mostrar el dashboard interactivo
  return <Dashboard />;
};

function App() {
  return (
    <AuthProvider>
      <ContenidoApp />
    </AuthProvider>
  );
}

export default App;
