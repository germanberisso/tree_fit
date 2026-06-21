// Vista de Registro de Cuenta
import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import logoImg from "../assets/logo.png";
import tickIcon from "../assets/tick.svg";

export const Register = ({ irALogin }) => {
  const { registrar } = useAuth();
  const [nombreCompleto, setNombreCompleto] = useState("");
  const [email, setEmail] = useState("");
  const [clave, setClave] = useState("");
  const [rol, setRol] = useState("profesor"); // 'profesor' o 'alumno'
  const [cargando, setCargando] = useState(false);
  const [errorLocal, setErrorLocal] = useState("");
  const [exito, setExito] = useState(false);

  const manejarEnvio = async (e) => {
    e.preventDefault();
    if (!nombreCompleto || !email || !clave) {
      setErrorLocal("Por favor complete todos los campos.");
      return;
    }

    setErrorLocal("");
    setCargando(true);
    try {
      await registrar(email, clave, nombreCompleto, rol);
      setExito(true);
      setTimeout(() => {
        irALogin();
      }, 4000);
    } catch (err) {
      setErrorLocal(err.message || "Error en el registro de la cuenta.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="registro-pantalla animacion-aparicion">
      <div className="tarjeta-vidrio registro-tarjeta">
        <div className="registro-cabecera">
          <img src={logoImg} alt="Logo" className="logo" />
          <h2>Crear Cuenta</h2>
          <p className="subtitulo">Regístrate en Tree Fit para comenzar</p>
        </div>

        {exito ? (
          <div className="alerta-exito">
            <div className="mensaje-exito">
              <img
                src={tickIcon}
                alt="Éxito"
                className="icono-exito"
              />
              <p>¡Cuenta creada exitosamente!</p>
            </div>
            <p className="mini-subtitulo">
              Redireccionando al inicio de sesión...
            </p>
          </div>
        ) : (
          <>
            {errorLocal && <div className="alerta-error">{errorLocal}</div>}

            <form onSubmit={manejarEnvio}>
              <div className="input-grupo">
                <label htmlFor="nombre">Nombre Completo</label>
                <input
                  id="nombre"
                  type="text"
                  placeholder="Juan Pérez"
                  value={nombreCompleto}
                  onChange={(e) => setNombreCompleto(e.target.value)}
                  className="input-control"
                  required
                />
              </div>

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
                  placeholder="Mínimo 6 caracteres"
                  value={clave}
                  onChange={(e) => setClave(e.target.value)}
                  className="input-control"
                  minLength="6"
                  required
                />
              </div>

              <div className="input-grupo">
                <label>Soy:</label>
                <div className="selectores-rol">
                  <button
                    type="button"
                    onClick={() => setRol("profesor")}
                    className={`selector-rol-btn ${rol === "profesor" ? "activo" : ""}`}
                  >
                    Profesor / Personal Trainer
                  </button>
                  <button
                    type="button"
                    onClick={() => setRol("alumno")}
                    className={`selector-rol-btn ${rol === "alumno" ? "activo" : ""}`}
                  >
                    Alumno
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={cargando}
                className="btn btn-primario boton-registro"
              >
                {cargando ? "Creando cuenta..." : "Registrarse"}
              </button>
            </form>
          </>
        )}

        <div className="registro-pie">
          <p>¿Ya tienes una cuenta?</p>
          <button onClick={irALogin} className="btn-enlace">
            Inicia sesión aquí
          </button>
        </div>
      </div>

      <style>{`
        .registro-pantalla {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          padding: 20px;
          background: radial-gradient(circle at 10% 20%, rgba(99, 102, 241, 0.1) 0%, transparent 40%),
                      radial-gradient(circle at 90% 80%, rgba(16, 185, 129, 0.15) 0%, transparent 40%);
        }
        
        .registro-tarjeta {
          width: 100%;
          max-width: 480px;
          padding: 40px;
        }

        .registro-cabecera {
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

        .alerta-exito {
          background: rgba(16, 185, 129, 0.12);
          border: 1px solid rgba(16, 185, 129, 0.25);
          color: #34d399;
          padding: 24px;
          border-radius: var(--radio-esquina);
          margin-bottom: 20px;
          font-size: 1rem;
          text-align: center;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .mensaje-exito {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .icono-exito {
          width: 32px;
          height: 32px;
        }

        .mini-subtitulo {
          font-size: 0.8rem;
          color: var(--color-texto-secundario);
        }

        .selectores-rol {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 5px;
        }

        .selector-rol-btn {
          background: rgba(13, 17, 28, 0.6);
          border: 1px solid var(--color-borde);
          color: var(--color-texto-secundario);
          padding: 12px 16px;
          border-radius: var(--radio-boton);
          cursor: pointer;
          font-size: 0.95rem;
          font-weight: 500;
          text-align: left;
          transition: all 0.2s ease;
        }

        .selector-rol-btn:hover {
          color: var(--color-texto-principal);
          background: rgba(13, 17, 28, 0.8);
          border-color: rgba(255, 255, 255, 0.15);
        }

        .selector-rol-btn.activo {
          background: rgba(99, 102, 241, 0.1);
          color: var(--color-texto-principal);
          border-color: var(--color-primario);
          box-shadow: 0 0 0 1px var(--color-primario);
        }

        .boton-registro {
          width: 100%;
          margin-top: 25px;
        }

        .registro-pie {
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
