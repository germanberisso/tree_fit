// Contexto de Autenticación de Tree Fit
import React, { createContext, useState, useEffect, useContext } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Intentar restaurar la sesión al montar el componente
  useEffect(() => {
    const restaurarSesion = async () => {
      const token = localStorage.getItem('tree_fit_token');
      if (token) {
        try {
          const perfil = await api.obtenerPerfil();
          setUsuario(perfil);
        } catch (err) {
          console.error("No se pudo restaurar la sesión:", err);
          localStorage.removeItem('tree_fit_token');
          setUsuario(null);
        }
      }
      setCargando(false);
    };

    restaurarSesion();
  }, []);

  // Función para iniciar sesión
  const login = async (email, clave) => {
    setError(null);
    setCargando(true);
    try {
      const datos = await api.login(email, clave);
      localStorage.setItem('tree_fit_token', datos.token_acceso);
      const perfil = await api.obtenerPerfil();
      setUsuario(perfil);
      setCargando(false);
      return perfil;
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión.');
      setCargando(false);
      throw err;
    }
  };

  // Función para registrarse
  const registrar = async (email, clave, nombreCompleto, rol) => {
    setError(null);
    setCargando(true);
    try {
      const nuevoUsuario = await api.registro({ email, clave, nombre_completo: nombreCompleto, rol });
      setCargando(false);
      return nuevoUsuario;
    } catch (err) {
      setError(err.message || 'Error en el registro.');
      setCargando(false);
      throw err;
    }
  };

  // Cerrar sesión
  const logout = () => {
    localStorage.removeItem('tree_fit_token');
    setUsuario(null);
    setError(null);
  };

  const valor = {
    usuario,
    cargando,
    error,
    login,
    registrar,
    logout,
    esProfesor: usuario?.rol === 'profesor',
    esAlumno: usuario?.rol === 'alumno'
  };

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
};

// Hook personalizado para consumir el contexto fácilmente
export const useAuth = () => {
  const contexto = useContext(AuthContext);
  if (!contexto) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return contexto;
};
