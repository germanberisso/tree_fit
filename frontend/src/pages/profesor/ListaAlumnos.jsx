// Vista del Listado de Alumnos (Panel del Profesor)
import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';

export const ListaAlumnos = ({ seleccionarAlumno }) => {
  const [alumnos, setAlumnos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  
  // Estados para el Modal de Alta de Alumno
  const [mostrarModal, setMostrarModal] = useState(false);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [clave, setClave] = useState('');
  const [objetivos, setObjetivos] = useState('');
  const [historialSalud, setHistorialSalud] = useState('');
  const [creando, setCreando] = useState(false);

  const cargarAlumnos = async () => {
    try {
      const data = await api.listarAlumnos();
      setAlumnos(data);
    } catch (err) {
      setError(err.message || 'Error al cargar la cartera de alumnos.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarAlumnos();
  }, []);

  const abrirModal = () => {
    setNombre('');
    setEmail('');
    setClave('');
    setObjetivos('');
    setHistorialSalud('');
    setMostrarModal(true);
  };

  const manejarCrearAlumno = async (e) => {
    e.preventDefault();
    if (!nombre || !email || !clave) {
      alert('Por favor complete los campos obligatorios.');
      return;
    }

    setCreando(true);
    try {
      // 1. Crear usuario alumno
      const nuevoAlumno = await api.crearAlumno({
        email,
        clave,
        nombre_completo: nombre,
        rol: 'alumno'
      });

      // 2. Modificar perfil con objetivos e historial de salud
      await api.modificarPerfilAlumno(nuevoAlumno.id, {
        objetivos_iniciales: objetivos,
        historial_salud: historialSalud
      });

      setMostrarModal(false);
      cargarAlumnos();
    } catch (err) {
      alert(err.message || 'Error al registrar al alumno.');
    } finally {
      setCreando(false);
    }
  };

  const manejarBajaAlumno = async (id, nombre) => {
    if (window.confirm(`¿Está seguro de que desea dar de baja al alumno ${nombre}? Esta acción es permanente.`)) {
      try {
        await api.darDeBajaAlumno(id);
        cargarAlumnos();
      } catch (err) {
        alert(err.message || 'Error al dar de baja al alumno.');
      }
    }
  };

  return (
    <div className="alumnos-listado-seccion animacion-aparicion">
      <div className="seccion-cabecera">
        <div>
          <h2>Cartera de Alumnos</h2>
          <p className="descripcion-cabecera">Administra tus alumnos, crea rutinas técnicas y monitorea sus progresos biométricos.</p>
        </div>
        <button onClick={abrirModal} className="btn btn-primario">
          <span>➕</span> Nuevo Alumno
        </button>
      </div>

      {cargando ? (
        <div className="cargando-contenedor">Cargando alumnos...</div>
      ) : error ? (
        <div className="alerta-error">{error}</div>
      ) : alumnos.length === 0 ? (
        <div className="tarjeta-vidrio sin-alumnos">
          <h3>No tienes alumnos asignados todavía</h3>
          <p>Comienza dando de alta a tu primer alumno usando el botón superior.</p>
          <span style={{ fontSize: '3rem', marginTop: '10px' }}>🏋️‍♂️</span>
        </div>
      ) : (
        <div className="alumnos-grilla">
          {alumnos.map((alumno) => (
            <div key={alumno.id} className="tarjeta-vidrio tarjeta-vidrio-interactiva alumno-tarjeta">
              <div className="alumno-tarjeta-cabecera">
                <div className="avatar-alumno">
                  {alumno.nombre_completo.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                </div>
                <div>
                  <h3>{alumno.nombre_completo}</h3>
                  <p className="email-alumno">{alumno.email}</p>
                </div>
              </div>

              <div className="alumno-tarjeta-detalles">
                {alumno.perfil?.historial_salud ? (
                  <div className="alerta-salud-tarjeta">
                    <span className="icono-alerta">⚠️</span>
                    <p className="texto-salud-tarjeta" title={alumno.perfil.historial_salud}>
                      <strong>Salud:</strong> {alumno.perfil.historial_salud}
                    </p>
                  </div>
                ) : (
                  <p className="sin-alerta-salud">Sin alertas de salud médicas</p>
                )}
                
                {alumno.perfil?.objetivos_iniciales && (
                  <p className="objetivos-resumen">
                    <strong>Objetivo:</strong> {alumno.perfil.objetivos_iniciales}
                  </p>
                )}
              </div>

              <div className="alumno-tarjeta-acciones">
                <button
                  onClick={() => seleccionarAlumno(alumno.id)}
                  className="btn btn-primario btn-tarjeta"
                >
                  Planificar y Monitorear
                </button>
                <button
                  onClick={() => manejarBajaAlumno(alumno.id, alumno.nombre_completo)}
                  className="btn btn-peligro btn-icono"
                  title="Dar de baja"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de alta de alumno */}
      {mostrarModal && (
        <div className="modal-pantalla">
          <div className="tarjeta-vidrio modal-contenido animacion-aparicion">
            <div className="modal-cabecera">
              <h3>Alta de Nuevo Alumno</h3>
              <button onClick={() => setMostrarModal(false)} className="btn-cerrar">✕</button>
            </div>
            
            <form onSubmit={manejarCrearAlumno} className="modal-formulario">
              <div className="input-grupo">
                <label>Nombre Completo *</label>
                <input
                  type="text"
                  className="input-control"
                  placeholder="Ej: Marcelo Gallardo"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                />
              </div>

              <div className="input-grupo">
                <label>Correo Electrónico *</label>
                <input
                  type="email"
                  className="input-control"
                  placeholder="marcelo@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="input-grupo">
                <label>Contraseña Temporal *</label>
                <input
                  type="password"
                  className="input-control"
                  placeholder="Clave para primer acceso"
                  value={clave}
                  onChange={(e) => setClave(e.target.value)}
                  required
                />
              </div>

              <div className="input-grupo">
                <label>Objetivos Iniciales</label>
                <textarea
                  className="input-control"
                  placeholder="Ej: Aumento de masa muscular, hipertrofia general."
                  value={objetivos}
                  onChange={(e) => setObjetivos(e.target.value)}
                  rows="2"
                />
              </div>

              <div className="input-grupo">
                <label>Historial de Salud / Lesiones</label>
                <textarea
                  className="input-control"
                  placeholder="Ej: Hernia de disco L5-S1, molestia en rodilla derecha."
                  value={historialSalud}
                  onChange={(e) => setHistorialSalud(e.target.value)}
                  rows="2"
                />
              </div>

              <div className="modal-acciones">
                <button
                  type="button"
                  onClick={() => setMostrarModal(false)}
                  className="btn btn-secundario"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creando}
                  className="btn btn-primario"
                >
                  {creando ? 'Registrando...' : 'Confirmar Alta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .seccion-cabecera {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          flex-wrap: wrap;
          gap: 15px;
        }

        .descripcion-cabecera {
          color: var(--color-texto-secundario);
          font-size: 0.95rem;
          margin-top: 4px;
        }

        .cargando-contenedor {
          text-align: center;
          padding: 40px;
          color: var(--color-texto-secundario);
        }

        .sin-alumnos {
          text-align: center;
          padding: 60px;
          color: var(--color-texto-secundario);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }

        .alumnos-grilla {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 20px;
        }

        .alumno-tarjeta {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .alumno-tarjeta-cabecera {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .avatar-alumno {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--color-primario), #312e81);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1.2rem;
          box-shadow: 0 4px 10px rgba(0,0,0,0.2);
        }

        .email-alumno {
          font-size: 0.85rem;
          color: var(--color-texto-secundario);
        }

        .alumno-tarjeta-detalles {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 10px;
          font-size: 0.9rem;
        }

        .alerta-salud-tarjeta {
          background: rgba(239, 68, 68, 0.08);
          border: 1px dashed rgba(239, 68, 68, 0.2);
          border-radius: 8px;
          padding: 8px 12px;
          display: flex;
          align-items: flex-start;
          gap: 8px;
        }

        .icono-alerta {
          font-size: 1rem;
        }

        .texto-salud-tarjeta {
          color: #fca5a5;
          font-size: 0.82rem;
          line-height: 1.25;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }

        .sin-alerta-salud {
          color: var(--color-texto-desvanecido);
          font-style: italic;
          font-size: 0.85rem;
        }

        .objetivos-resumen {
          color: var(--color-texto-secundario);
          font-size: 0.85rem;
        }

        .alumno-tarjeta-acciones {
          display: flex;
          gap: 10px;
          margin-top: 10px;
        }

        .btn-tarjeta {
          flex: 1;
          padding: 10px;
          font-size: 0.85rem;
        }

        .btn-icono {
          padding: 10px 14px;
        }

        /* Modal estilos */
        .modal-pantalla {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(5px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal-contenido {
          width: 100%;
          max-width: 550px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.5);
          overflow-y: auto;
          max-height: 90vh;
        }

        .modal-cabecera {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--color-borde);
          padding-bottom: 15px;
          margin-bottom: 20px;
        }

        .btn-cerrar {
          background: none;
          border: none;
          color: var(--color-texto-secundario);
          font-size: 1.2rem;
          cursor: pointer;
        }

        .btn-cerrar:hover {
          color: white;
        }

        .modal-formulario {
          display: flex;
          flex-direction: column;
        }

        .modal-acciones {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 20px;
          border-top: 1px solid var(--color-borde);
          padding-top: 15px;
        }
      `}</style>
    </div>
  );
};
