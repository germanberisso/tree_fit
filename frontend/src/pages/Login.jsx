// Vista de Inicio de Sesión
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import logoImg from '../assets/logo.png';

export const Login = ({ irARegistro }) => {
  const { login, error: authError } = useAuth();
  const [email, setEmail] = useState('');
  const [clave, setClave] = useState('');
  const [cargando, setCargando] = useState(false);
  const [errorLocal, setErrorLocal] = useState('');

  const manejarEnvio = async (e) => {
    e.preventDefault();
    if (!email || !clave) {
      setErrorLocal('Por favor complete todos los campos.');
      return;
    }

    setErrorLocal('');
    setCargando(true);
    try {
      await login(email, clave);
    } catch (err) {
      setErrorLocal(err.message || 'Error al iniciar sesión. Compruebe sus credenciales.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="login-pantalla animacion-aparicion">
      <div className="tarjeta-vidrio login-tarjeta">
        <div className="login-cabecera">
          <img src={logoImg} alt="Logo" className="logo" />
          <h2>Iniciar Sesión</h2>
          <p className="subtitulo">Ingresa a tu portal de entrenamiento Tree Fit</p>
        </div>

        {errorLocal && <div className="alerta-error">{errorLocal}</div>}

        <form onSubmit={manejarEnvio}>
          <div className="input-grupo">
            <label htmlFor="email">Correo Electrónico</label>
            <input
              id="email"
              type="email"
              placeholder="ejemplo@gimnasio.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-control"
              required
            />
          </div>

          <div className="input-grupo">
            <label htmlFor="clave">Contraseña</label>
            <input
              id="clave"
              type="password"
              placeholder="••••••••"
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              className="input-control"
              required
            />
          </div>

          <button
            type="submit"
            disabled={cargando}
            className="btn btn-primario boton-login"
          >
            {cargando ? 'Iniciando...' : 'Entrar'}
          </button>
        </form>

        <div className="login-pie">
          <p>¿No tienes una cuenta?</p>
          <button onClick={irARegistro} className="btn-enlace">
            Registrarse aquí
          </button>
        </div>
      </div>

      <style>{`
        .login-pantalla {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          padding: 20px;
          background: radial-gradient(circle at 10% 20%, rgba(99, 102, 241, 0.15) 0%, transparent 40%),
                      radial-gradient(circle at 90% 80%, rgba(16, 185, 129, 0.1) 0%, transparent 40%);
        }
        
        .login-tarjeta {
          width: 100%;
          max-width: 440px;
          padding: 40px;
        }

        .login-cabecera {
          text-align: center;
          margin-bottom: 30px;
        }

        .subtitulo {
          color: var(--color-texto-secundario);
          font-size: 0.9rem;
          margin-top: 6px;
        }

        .alerta-error {
          background: rgba(239, 68, 68, 0.12);
          border: 1px solid rgba(239, 68, 68, 0.25);
          color: #f87171;
          padding: 12px;
          border-radius: var(--radio-boton);
          margin-bottom: 20px;
          font-size: 0.9rem;
          text-align: center;
        }

        .boton-login {
          width: 100%;
          margin-top: 10px;
        }

        .login-pie {
          margin-top: 25px;
          text-align: center;
          font-size: 0.9rem;
          color: var(--color-texto-secundario);
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .btn-enlace {
          background: none;
          border: none;
          color: var(--color-primario);
          font-weight: 600;
          cursor: pointer;
          font-size: 0.9rem;
          transition: filter 0.2s;
        }

        .btn-enlace:hover {
          filter: brightness(1.2);
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
};
