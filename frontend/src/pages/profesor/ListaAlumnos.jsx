// Vista del Listado de Alumnos (Panel del Profesor)
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../../services/api';

export const ListaAlumnos = ({ seleccionarAlumno }) => {
  const [alumnos, setAlumnos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  
  // Estados para el Modal de Alta de Alumno
  const [mostrarModal, setMostrarModal] = useState(false);
  const [modoModal, setModoModal] = useState('crear'); // 'crear' o 'vincular'
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

  const manejarAccionModal = async (e) => {
    e.preventDefault();
    setCreando(true);

    try {
      if (modoModal === 'vincular') {
        if (!email.trim()) {
          alert('Por favor ingrese el correo del alumno.');
          setCreando(false);
          return;
        }
        await api.vincularAlumno(email.trim());
        setMostrarModal(false);
        cargarAlumnos();
      } else {
        if (!nombre || !email || !clave) {
          alert('Por favor complete los campos obligatorios.');
          setCreando(false);
          return;
        }

        // 1. Crear usuario alumno
        const nuevoAlumno = await api.crearAlumno({
          email: email.trim(),
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
      }
    } catch (err) {
      alert(err.message || 'Error al procesar la solicitud.');
    } finally {
      setCreando(false);
    }
  };

  const manejarBajaAlumno = async (id, nombre) => {
    if (window.confirm(`¿Está seguro de que desea desvincular al alumno ${nombre}? El usuario conservará su cuenta y su historial.`)) {
      try {
        await api.darDeBajaAlumno(id);
        cargarAlumnos();
      } catch (err) {
        alert(err.message || 'Error al desvincular al alumno.');
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
                {alumno.perfil_alumno?.historial_salud ? (
                  <div className="alerta-salud-tarjeta">
                    <span className="icono-alerta">⚠️</span>
                    <p className="texto-salud-tarjeta" title={alumno.perfil_alumno.historial_salud}>
                      <strong>Salud:</strong> {alumno.perfil_alumno.historial_salud}
                    </p>
                  </div>
                ) : (
                  <p className="sin-alerta-salud">Sin alertas de salud médicas</p>
                )}
                
                {alumno.perfil_alumno?.objetivos_iniciales && (
                  <p className="objetivos-resumen">
                    <strong>Objetivo:</strong> {alumno.perfil_alumno.objetivos_iniciales}
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
                  title="Desvincular"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de alta de alumno */}
      {mostrarModal && createPortal(
        <div className="modal-pantalla">
          <div className="tarjeta-vidrio modal-contenido animacion-aparicion">
            <div className="modal-cabecera">
              <h3>{modoModal === 'crear' ? 'Alta de Nuevo Alumno' : 'Vincular Alumno Existente'}</h3>
              <button onClick={() => setMostrarModal(false)} className="btn-cerrar">✕</button>
            </div>
            
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <button 
                className={`btn ${modoModal === 'crear' ? 'btn-primario' : 'btn-secundario'}`} 
                onClick={() => setModoModal('crear')}
                style={{flex: 1}}
              >
                Crear Nuevo
              </button>
              <button 
                className={`btn ${modoModal === 'vincular' ? 'btn-primario' : 'btn-secundario'}`} 
                onClick={() => setModoModal('vincular')}
                style={{flex: 1}}
              >
                Vincular Existente
              </button>
            </div>

            <form onSubmit={manejarAccionModal} className="modal-formulario">
              
              {modoModal === 'crear' && (
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
              )}

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

              {modoModal === 'crear' && (
                <>
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
                </>
              )}

              {modoModal === 'vincular' && (
                <p style={{fontSize: '0.85rem', color: 'var(--color-texto-secundario)', marginBottom: '15px'}}>
                  El alumno debe haberse registrado previamente por su cuenta para poder vincularlo.
                </p>
              )}

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
                  {creando ? 'Procesando...' : (modoModal === 'crear' ? 'Confirmar Alta' : 'Vincular Alumno')}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
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
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
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

      `}</style>
    </div>
  );
};
