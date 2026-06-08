// Vista del Catálogo de Ejercicios y Equipamiento
import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

export const CatalogoEjercicios = () => {
  const [ejercicios, setEjercicios] = useState([]);
  const [equipamiento, setEquipamiento] = useState([]);
  const [grupoMuscular, setGrupoMuscular] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);

  // Estado del formulario de equipamiento
  const [mostrarFormEquipo, setMostrarFormEquipo] = useState(false);
  const [equipoEditando, setEquipoEditando] = useState(null); // null = crear nuevo
  const [formNombreEquipo, setFormNombreEquipo] = useState('');
  const [formDescEquipo, setFormDescEquipo] = useState('');
  const [formDisponibleEquipo, setFormDisponibleEquipo] = useState(true);
  const [guardandoEquipo, setGuardandoEquipo] = useState(false);

  // Estado del formulario de ejercicios
  const [mostrarFormEjercicio, setMostrarFormEjercicio] = useState(false);
  const [ejercicioEditando, setEjercicioEditando] = useState(null);
  const [formNombreEj, setFormNombreEj] = useState('');
  const [formDescEj, setFormDescEj] = useState('');
  const [formGrupoEj, setFormGrupoEj] = useState('Pecho');
  const [formVideoEj, setFormVideoEj] = useState('');
  const [formEquipoEj, setFormEquipoEj] = useState('');
  const [guardandoEjercicio, setGuardandoEjercicio] = useState(false);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const dataEjercicios = await api.listarEjercicios(grupoMuscular, busqueda);
      setEjercicios(dataEjercicios);

      const dataEquipamiento = await api.listarEquipamiento();
      setEquipamiento(dataEquipamiento);
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [grupoMuscular, busqueda]);

  const gruposMusculares = ['Pecho', 'Espalda', 'Piernas', 'Hombros', 'Brazos', 'Core'];

  // Abrir formulario para crear nuevo equipamiento
  const abrirCrearEquipo = () => {
    setEquipoEditando(null);
    setFormNombreEquipo('');
    setFormDescEquipo('');
    setFormDisponibleEquipo(true);
    setMostrarFormEquipo(true);
  };

  // Abrir formulario para editar equipamiento existente
  const abrirEditarEquipo = (eq) => {
    setEquipoEditando(eq);
    setFormNombreEquipo(eq.nombre);
    setFormDescEquipo(eq.descripcion || '');
    setFormDisponibleEquipo(eq.disponible);
    setMostrarFormEquipo(true);
  };

  // Guardar (crear o editar) equipamiento
  const guardarEquipamiento = async (e) => {
    e.preventDefault();
    if (!formNombreEquipo.trim()) {
      toast.error('El nombre del equipamiento es obligatorio.');
      return;
    }
    setGuardandoEquipo(true);
    try {
      if (equipoEditando) {
        await api.editarEquipamiento(equipoEditando.id, {
          nombre: formNombreEquipo.trim(),
          descripcion: formDescEquipo.trim() || null,
          disponible: formDisponibleEquipo,
        });
        toast.success('Equipamiento actualizado correctamente.');
      } else {
        await api.crearEquipamiento({
          nombre: formNombreEquipo.trim(),
          descripcion: formDescEquipo.trim() || null,
          disponible: formDisponibleEquipo,
        });
        toast.success('Equipamiento creado correctamente.');
      }
      setMostrarFormEquipo(false);
      cargarDatos();
    } catch (err) {
      // El toast ya se muestra en api.js
    } finally {
      setGuardandoEquipo(false);
    }
  };

  // Toggle rápido de disponibilidad desde la lista
  const toggleDisponibilidad = async (eq) => {
    try {
      await api.cambiarDisponibilidadEquipamiento(eq.id, !eq.disponible);
      toast.success(`"${eq.nombre}" marcado como ${!eq.disponible ? 'disponible' : 'no disponible'}.`);
      cargarDatos();
    } catch (err) {
      // toast ya gestionado
    }
  };

  // --- LÓGICA DE EJERCICIOS ---
  const abrirCrearEjercicio = () => {
    setEjercicioEditando(null);
    setFormNombreEj('');
    setFormDescEj('');
    setFormGrupoEj('Pecho');
    setFormVideoEj('');
    setFormEquipoEj('');
    setMostrarFormEjercicio(true);
  };

  const abrirEditarEjercicio = (ej) => {
    setEjercicioEditando(ej);
    setFormNombreEj(ej.nombre);
    setFormDescEj(ej.descripcion || '');
    setFormGrupoEj(ej.grupo_muscular);
    setFormVideoEj(ej.video_url || '');
    setFormEquipoEj(ej.equipamiento_id ? ej.equipamiento_id.toString() : '');
    setMostrarFormEjercicio(true);
  };

  const guardarEjercicio = async (e) => {
    e.preventDefault();
    if (!formNombreEj.trim()) {
      toast.error('El nombre del ejercicio es obligatorio.');
      return;
    }
    setGuardandoEjercicio(true);
    try {
      const payload = {
        nombre: formNombreEj.trim(),
        descripcion: formDescEj.trim() || null,
        grupo_muscular: formGrupoEj,
        video_url: formVideoEj.trim() || null,
        equipamiento_id: formEquipoEj ? parseInt(formEquipoEj) : null,
      };

      if (ejercicioEditando) {
        await api.editarEjercicio(ejercicioEditando.id, payload);
        toast.success('Ejercicio actualizado correctamente.');
      } else {
        await api.crearEjercicio(payload);
        toast.success('Ejercicio creado correctamente.');
      }
      setMostrarFormEjercicio(false);
      cargarDatos();
    } catch (err) {
      // toast
    } finally {
      setGuardandoEjercicio(false);
    }
  };

  const toggleBajaEjercicio = async (ej) => {
    try {
      if (ej.activo) {
        if (window.confirm(`¿Estás seguro de deshabilitar el ejercicio "${ej.nombre}"? Si está en rutinas activas, ya no se podrá registrar.`)) {
          await api.darDeBajaEjercicio(ej.id);
          toast.success(`Ejercicio "${ej.nombre}" deshabilitado.`);
          cargarDatos();
        }
      } else {
        // Para reactivarlo, usamos el PUT de edición
        await api.editarEjercicio(ej.id, { activo: true });
        toast.success(`Ejercicio "${ej.nombre}" habilitado nuevamente.`);
        cargarDatos();
      }
    } catch (err) {
      // toast
    }
  };

  return (
    <div className="catalogo-seccion animacion-aparicion">
      <div className="seccion-cabecera">
        <h2>Catálogo Central de Ejercicios</h2>
        <p className="descripcion-cabecera">Consulta los ejercicios técnicos del gimnasio y gestiona los equipamientos requeridos.</p>
      </div>

      <div className="controles-busqueda-grilla">
        <div className="input-grupo flex-2">
          <label>Buscar Ejercicio</label>
          <input
            type="text"
            className="input-control"
            placeholder="Ej: Press de banca..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <div className="input-grupo flex-1">
          <label>Grupo Muscular</label>
          <select
            className="input-control"
            value={grupoMuscular}
            onChange={(e) => setGrupoMuscular(e.target.value)}
          >
            <option value="">Todos los grupos</option>
            {gruposMusculares.map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>
      </div>

      {cargando ? (
        <div className="cargando-contenedor">Filtrando catálogo...</div>
      ) : (
        <div className="layout-division-catalogo">
          {/* Listado de Ejercicios */}
          <div className="ejercicios-catalogo-lista flex-3">
            <div className="equipamiento-cabecera-panel">
              <h3>Movimientos ({ejercicios.length})</h3>
              <button className="btn btn-primario btn-nuevo-equipo" onClick={abrirCrearEjercicio}>
                + Nuevo Ejercicio
              </button>
            </div>

            {/* Formulario crear/editar ejercicio */}
            {mostrarFormEjercicio && (
              <div className="form-equipo-panel tarjeta-vidrio animacion-aparicion">
                <h4>{ejercicioEditando ? 'Editar Ejercicio' : 'Nuevo Ejercicio'}</h4>
                <form onSubmit={guardarEjercicio}>
                  <div className="controles-busqueda-grilla" style={{marginBottom: '10px'}}>
                    <div className="input-grupo flex-2">
                      <label>Nombre *</label>
                      <input type="text" className="input-control" value={formNombreEj} onChange={e => setFormNombreEj(e.target.value)} required />
                    </div>
                    <div className="input-grupo flex-1">
                      <label>Grupo Muscular *</label>
                      <select className="input-control" value={formGrupoEj} onChange={e => setFormGrupoEj(e.target.value)}>
                        {gruposMusculares.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="input-grupo">
                    <label>Descripción</label>
                    <input type="text" className="input-control" value={formDescEj} onChange={e => setFormDescEj(e.target.value)} />
                  </div>
                  <div className="controles-busqueda-grilla" style={{marginBottom: '10px'}}>
                    <div className="input-grupo flex-2">
                      <label>URL Video Demo</label>
                      <input type="url" className="input-control" value={formVideoEj} onChange={e => setFormVideoEj(e.target.value)} placeholder="https://youtube.com/..." />
                    </div>
                    <div className="input-grupo flex-2">
                      <label>Equipamiento Requerido</label>
                      <select className="input-control" value={formEquipoEj} onChange={e => setFormEquipoEj(e.target.value)}>
                        <option value="">Sin equipamiento (Peso Corporal)</option>
                        {equipamiento.map(eq => (
                          <option key={eq.id} value={eq.id}>{eq.nombre}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="form-equipo-acciones">
                    <button type="button" className="btn btn-secundario" onClick={() => setMostrarFormEjercicio(false)}>Cancelar</button>
                    <button type="submit" className="btn btn-primario" disabled={guardandoEjercicio}>{guardandoEjercicio ? 'Guardando...' : 'Guardar'}</button>
                  </div>
                </form>
              </div>
            )}

            {ejercicios.length === 0 ? (
              <div className="tarjeta-vidrio sin-ejercicios">
                <p>No se encontraron ejercicios con los criterios seleccionados.</p>
              </div>
            ) : (
              <div className="ejercicios-grilla">
                {ejercicios.map((ej) => (
                  <div key={ej.id} className={`tarjeta-vidrio ejercicio-item-tarjeta ${!ej.activo ? 'ejercicio-inactivo' : ''}`}>
                    <div className="ejercicio-item-cabecera">
                      <h4>
                        {ej.nombre}
                        {!ej.activo && <span className="badge-inactivo">Inactivo</span>}
                      </h4>
                      <span className="badge badge-primario">{ej.grupo_muscular}</span>
                    </div>
                    <p className="ejercicio-descripcion">{ej.descripcion || 'Sin descripción detallada.'}</p>

                    <div className="ejercicio-item-pie">
                      <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                        {ej.equipamiento ? (
                          <span className={`equipamiento-etiqueta-recurso ${!ej.equipamiento.disponible ? 'no-disponible' : ''}`}>
                            🛠️ Requiere: <strong>{ej.equipamiento.nombre}</strong>
                            {!ej.equipamiento.disponible && <span className="etiqueta-no-disp"> (No disponible)</span>}
                          </span>
                        ) : (
                          <span className="equipamiento-etiqueta-recurso libre">
                            🤸 Peso Corporal (Sin equipo)
                          </span>
                        )}

                        {ej.video_url && (
                          <a
                            href={ej.video_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-link-demo"
                          >
                            🎥 Ver Demo
                          </a>
                        )}
                      </div>

                      <div className="equipamiento-acciones">
                        <button className="btn-accion-equipo btn-editar-equipo" onClick={() => abrirEditarEjercicio(ej)}>
                          ✏️ Editar
                        </button>
                        <button
                          className={`btn-accion-equipo ${ej.activo ? 'btn-deshabilitar' : 'btn-habilitar'}`}
                          onClick={() => toggleBajaEjercicio(ej)}
                        >
                          {ej.activo ? '🔴 Deshabilitar' : '🟢 Habilitar'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Listado de Equipamiento / Materiales con gestión */}
          <div className="equipamiento-inventario flex-1">
            <div className="equipamiento-cabecera-panel">
              <h3>Equipamiento</h3>
              <button
                className="btn btn-primario btn-nuevo-equipo"
                onClick={abrirCrearEquipo}
              >
                + Nuevo
              </button>
            </div>

            {/* Formulario crear/editar equipamiento */}
            {mostrarFormEquipo && (
              <div className="form-equipo-panel tarjeta-vidrio animacion-aparicion">
                <h4>{equipoEditando ? 'Editar Equipamiento' : 'Nuevo Equipamiento'}</h4>
                <form onSubmit={guardarEquipamiento}>
                  <div className="input-grupo">
                    <label>Nombre *</label>
                    <input
                      type="text"
                      className="input-control"
                      value={formNombreEquipo}
                      onChange={(e) => setFormNombreEquipo(e.target.value)}
                      placeholder="Ej: Prensa 45°"
                      required
                    />
                  </div>
                  <div className="input-grupo">
                    <label>Descripción</label>
                    <input
                      type="text"
                      className="input-control"
                      value={formDescEquipo}
                      onChange={(e) => setFormDescEquipo(e.target.value)}
                      placeholder="Descripción opcional"
                    />
                  </div>
                  <div className="input-grupo checkbox-grupo">
                    <label>
                      <input
                        type="checkbox"
                        checked={formDisponibleEquipo}
                        onChange={(e) => setFormDisponibleEquipo(e.target.checked)}
                      />
                      {' '}Disponible
                    </label>
                  </div>
                  <div className="form-equipo-acciones">
                    <button
                      type="button"
                      className="btn btn-secundario"
                      onClick={() => setMostrarFormEquipo(false)}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primario"
                      disabled={guardandoEquipo}
                    >
                      {guardandoEquipo ? 'Guardando...' : 'Guardar'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="equipamientos-lista">
              {equipamiento.map((eq) => (
                <div key={eq.id} className="tarjeta-vidrio equipamiento-item-tarjeta">
                  <div className="equipamiento-item-cabecera">
                    <strong>{eq.nombre}</strong>
                    <span className={`estado-recurso ${eq.disponible ? 'disponible' : 'fuera-servicio'}`}>
                      {eq.disponible ? 'Disponible' : 'No disponible'}
                    </span>
                  </div>
                  <p className="equipamiento-desc">{eq.descripcion}</p>
                  <div className="equipamiento-acciones">
                    <button
                      className="btn-accion-equipo btn-editar-equipo"
                      onClick={() => abrirEditarEquipo(eq)}
                      title="Editar"
                    >
                      ✏️ Editar
                    </button>
                    <button
                      className={`btn-accion-equipo ${eq.disponible ? 'btn-deshabilitar' : 'btn-habilitar'}`}
                      onClick={() => toggleDisponibilidad(eq)}
                      title={eq.disponible ? 'Marcar como no disponible' : 'Marcar como disponible'}
                    >
                      {eq.disponible ? '🔴 Deshabilitar' : '🟢 Habilitar'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .controles-busqueda-grilla {
          display: flex;
          gap: 15px;
          margin-bottom: 25px;
          flex-wrap: wrap;
        }

        .flex-1 { flex: 1; }
        .flex-2 { flex: 2; }
        .flex-3 { flex: 3; }

        .layout-division-catalogo {
          display: flex;
          gap: 25px;
        }

        .ejercicios-catalogo-lista h3,
        .equipamiento-inventario h3 {
          font-size: 1.15rem;
          margin-bottom: 15px;
          color: #a5b4fc;
        }

        .ejercicios-grilla {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .ejercicio-item-tarjeta {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .ejercicio-inactivo {
          opacity: 0.55;
          border-color: rgba(239, 68, 68, 0.3) !important;
        }

        .badge-inactivo {
          display: inline-block;
          font-size: 0.65rem;
          background: rgba(239, 68, 68, 0.2);
          color: #f87171;
          border-radius: 4px;
          padding: 2px 6px;
          margin-left: 8px;
          font-weight: 700;
          text-transform: uppercase;
          vertical-align: middle;
        }

        .ejercicio-item-cabecera {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .ejercicio-descripcion {
          font-size: 0.9rem;
          color: var(--color-texto-secundario);
          line-height: 1.4;
        }

        .ejercicio-item-pie {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top: 1px solid var(--color-borde);
          padding-top: 12px;
          margin-top: 5px;
          font-size: 0.82rem;
        }

        .equipamiento-etiqueta-recurso {
          color: var(--color-texto-secundario);
        }

        .equipamiento-etiqueta-recurso.libre {
          color: #a7f3d0;
        }

        .equipamiento-etiqueta-recurso.no-disponible {
          color: #fca5a5;
        }

        .etiqueta-no-disp {
          color: #f87171;
          font-style: italic;
        }

        .btn-link-demo {
          color: var(--color-primario);
          font-weight: 600;
        }

        .sin-ejercicios {
          padding: 40px;
          text-align: center;
          color: var(--color-texto-secundario);
        }

        /* Panel de equipamiento */
        .equipamiento-cabecera-panel {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .btn-nuevo-equipo {
          font-size: 0.8rem;
          padding: 6px 12px;
        }

        .form-equipo-panel {
          padding: 16px;
          margin-bottom: 16px;
          border: 1px solid rgba(99, 102, 241, 0.3);
        }

        .form-equipo-panel h4 {
          margin-bottom: 14px;
          color: #a5b4fc;
          font-size: 0.95rem;
        }

        .form-equipo-panel .input-grupo {
          margin-bottom: 10px;
        }

        .checkbox-grupo label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.9rem;
          color: var(--color-texto-secundario);
          cursor: pointer;
        }

        .form-equipo-acciones {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
          margin-top: 12px;
        }

        .equipamientos-lista {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .equipamiento-item-tarjeta {
          padding: 15px;
        }

        .equipamiento-item-cabecera {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.9rem;
          margin-bottom: 6px;
        }

        .estado-recurso {
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .estado-recurso.disponible {
          background: rgba(16, 185, 129, 0.15);
          color: #34d399;
        }

        .estado-recurso.fuera-servicio {
          background: rgba(239, 68, 68, 0.15);
          color: #f87171;
        }

        .equipamiento-desc {
          font-size: 0.8rem;
          color: var(--color-texto-secundario);
          margin-bottom: 10px;
        }

        .equipamiento-acciones {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .btn-accion-equipo {
          background: none;
          border: 1px solid var(--color-borde);
          border-radius: 6px;
          padding: 4px 10px;
          font-size: 0.75rem;
          cursor: pointer;
          transition: all 0.2s;
          color: var(--color-texto-secundario);
        }

        .btn-editar-equipo:hover {
          border-color: rgba(99, 102, 241, 0.5);
          color: #a5b4fc;
        }

        .btn-deshabilitar:hover {
          border-color: rgba(239, 68, 68, 0.4);
          color: #f87171;
        }

        .btn-habilitar:hover {
          border-color: rgba(16, 185, 129, 0.4);
          color: #34d399;
        }

        @media (max-width: 992px) {
          .layout-division-catalogo {
            flex-direction: column;
          }
        }
        
        @media (max-width: 768px) {
          .controles-busqueda-grilla {
            flex-direction: column;
            gap: 15px;
            margin-top: 15px;
          }
          .ejercicio-item-cabecera {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }
        }
      `}</style>
    </div>
  );
};
