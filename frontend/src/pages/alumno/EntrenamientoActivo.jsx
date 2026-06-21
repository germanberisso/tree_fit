// Vista de Entrenamiento Activo ("Mi Entrenamiento" para Alumnos)
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../../services/api';

export const EntrenamientoActivo = () => {
  const [rutina, setRutina] = useState(null);
  const [diaSeleccionado, setDiaSeleccionado] = useState(null);
  const [cargando, setCargando] = useState(true);
  
  // Estados de sesión activa
  const [sesionActiva, setSesionActiva] = useState(null);
  const [tiempoTranscurrido, setTiempoTranscurrido] = useState(0);
  const [relojCorriendo, setRelojCorriendo] = useState(false);
  const intervaloRef = useRef(null);

  // Registro de cargas reales ingresadas por el usuario
  // Estructura: { [ejercicioId]: { [serieIdx]: { reps: X, peso: Y, completado: true/false } } }
  const [cargasReales, setCargasReales] = useState({});

  // Cronómetro de descanso
  const [tiempoDescanso, setTiempoDescanso] = useState(0);
  const [descansoActivo, setDescansoActivo] = useState(false);
  const descansoIntervaloRef = useRef(null);
  const [descansoObjetivo, setDescansoObjetivo] = useState(90);

  // Estado de finalización de entrenamiento
  const [notas, setNotas] = useState('');
  const [mostrarModalFinalizar, setMostrarModalFinalizar] = useState(false);
  const [resumenExito, setResumenExito] = useState(null);

  // Cargar rutina activa y sesión si ya existe
  const cargarRutinaYSesion = async () => {
    try {
      setCargando(true);
      // Obtener el ID del usuario del token decodificado o del perfil
      const perfil = await api.obtenerPerfil();
      
      // Si el alumno está desvinculado (no tiene profesor asignado), no mostrar rutina
      if (!perfil.perfil_alumno?.profesor_id) {
        setRutina(null);
        setCargando(false);
        return;
      }

      const rut = await api.obtenerRutinaActiva(perfil.id);
      setRutina(rut);
      if (rut && rut.dias.length > 0) {
        setDiaSeleccionado(rut.dias[0]);
      }

      // Verificar si hay una sesión activa sin finalizar
      let idSesionActiva = null;
      try {
        const sesion = await api.obtenerEntrenamientoActivo();
        setSesionActiva(sesion);
        idSesionActiva = sesion.id;
        
        // Reestablecer el dia de rutina si ya estaba activo
        if (sesion.dia_rutina_id && rut) {
          const diaActivo = rut.dias.find(d => d.id === sesion.dia_rutina_id);
          if (diaActivo) {
            setDiaSeleccionado(diaActivo);
            
            // Intentar recuperar progreso guardado en LocalStorage
            const progresoGuardado = localStorage.getItem(`tree_fit_progreso_${sesion.id}`);
            if (progresoGuardado) {
              setCargasReales(JSON.parse(progresoGuardado));
            } else {
              // Inicializar cargasReales por defecto si no hay guardado
              const inicialCargas = {};
              diaActivo.ejercicios_rutina.forEach((ej) => {
                if (ej.habilitado_actual === false) return;

                inicialCargas[ej.ejercicio_id] = Array.from({ length: ej.series }, (_, index) => {
                  // Extraer solo el primer número encontrado, ignorando el resto (ej: '70% RPE 8' -> 70)
                  const matchPeso = ej.carga_objetivo.match(/[0-9.]+/);
                  const pesoSugerido = matchPeso ? parseFloat(matchPeso[0]) : 0;
                  
                  const repeticionesSugeridas = parseInt(ej.repeticiones.split('-')[0]) || 10;

                  return {
                    numero_serie: index + 1,
                    repeticiones: repeticionesSugeridas,
                    peso: pesoSugerido,
                    completado: false
                  };
                });
              });
              setCargasReales(inicialCargas);
            }
          }
        }

        // Calcular el tiempo transcurrido desde que inició (asegurando tratarlo como UTC si falta la Z)
        const fechaInicioValida = sesion.fecha_inicio.endsWith('Z') ? sesion.fecha_inicio : sesion.fecha_inicio + 'Z';
        const inicio = new Date(fechaInicioValida).getTime();
        const ahora = new Date().getTime();
        const transcurrido = Math.floor((ahora - inicio) / 1000);
        setTiempoTranscurrido(transcurrido > 0 ? transcurrido : 0);
        setRelojCorriendo(true);
      } catch (e) {
        // No hay sesión activa, normal
        setSesionActiva(null);
      }

      // Limpieza (Garbage Collection): Borrar progresos viejos en LocalStorage
      // Si el usuario dejó sesiones inconclusas en otros dispositivos,
      // aquí borramos cualquier dato guardado que no pertenezca a la sesión actual.
      const keysParaBorrar = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('tree_fit_progreso_')) {
          const keyId = key.replace('tree_fit_progreso_', '');
          if (String(keyId) !== String(idSesionActiva)) {
            keysParaBorrar.push(key);
          }
        }
      }
      keysParaBorrar.forEach(k => localStorage.removeItem(k));
    } catch (err) {
      console.log('Sin rutina activa cargada:', err.message);
      setRutina(null);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarRutinaYSesion();
    return () => {
      clearInterval(intervaloRef.current);
      clearInterval(descansoIntervaloRef.current);
    };
  }, []);

  // Control del Cronómetro de Entrenamiento
  useEffect(() => {
    if (relojCorriendo) {
      intervaloRef.current = setInterval(() => {
        setTiempoTranscurrido(t => t + 1);
      }, 1000);
    } else {
      clearInterval(intervaloRef.current);
    }
    return () => clearInterval(intervaloRef.current);
  }, [relojCorriendo]);

  // Control del Cronómetro de Descanso
  useEffect(() => {
    if (descansoActivo && tiempoDescanso > 0) {
      descansoIntervaloRef.current = setInterval(() => {
        setTiempoDescanso(t => {
          if (t <= 1) {
            clearInterval(descansoIntervaloRef.current);
            setDescansoActivo(false);
            // Sonar alerta sutil si es posible o vibrar
            if ('vibrate' in navigator) navigator.vibrate(200);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    } else {
      clearInterval(descansoIntervaloRef.current);
    }
    return () => clearInterval(descansoIntervaloRef.current);
  }, [descansoActivo, tiempoDescanso]);

  // Autoguardado de progreso de series en LocalStorage
  useEffect(() => {
    if (sesionActiva && sesionActiva.id && Object.keys(cargasReales).length > 0) {
      localStorage.setItem(`tree_fit_progreso_${sesionActiva.id}`, JSON.stringify(cargasReales));
    }
  }, [cargasReales, sesionActiva]);

  const formatearTiempo = (segundos) => {
    const hrs = Math.floor(segundos / 3600);
    const mins = Math.floor((segundos % 3600) / 60);
    const segs = segundos % 60;
    return [
      hrs > 0 ? String(hrs).padStart(2, '0') : null,
      String(mins).padStart(2, '0'),
      String(segs).padStart(2, '0')
    ].filter(Boolean).join(':');
  };

  const iniciarSesion = async () => {
    if (!diaSeleccionado) return;
    try {
      const sesion = await api.iniciarEntrenamiento(rutina.id, diaSeleccionado.id);
      setSesionActiva(sesion);
      setTiempoTranscurrido(0);
      setRelojCorriendo(true);

      // Inicializar el diccionario de cargas reales solo para ejercicios habilitados
      const inicialCargas = {};
      diaSeleccionado.ejercicios_rutina.forEach((ej) => {
        // Si el ejercicio no está habilitado, no inicializar cargas (no se puede registrar)
        if (ej.habilitado_actual === false) return;

        inicialCargas[ej.ejercicio_id] = Array.from({ length: ej.series }, (_, index) => {
          // Extraer solo el primer número encontrado, ignorando el resto (ej: '70% RPE 8' -> 70)
          const matchPeso = ej.carga_objetivo.match(/[0-9.]+/);
          const pesoSugerido = matchPeso ? parseFloat(matchPeso[0]) : 0;
          
          const repeticionesSugeridas = parseInt(ej.repeticiones.split('-')[0]) || 10;

          return {
            numero_serie: index + 1,
            repeticiones: repeticionesSugeridas,
            peso: pesoSugerido,
            completado: false
          };
        });
      });
      setCargasReales(inicialCargas);
    } catch (err) {
      alert('Error al iniciar entrenamiento: ' + err.message);
    }
  };

  const alternarSerieCompletada = (ejercicioId, serieIdx, tiempoSugerido) => {
    const nuevasCargas = { ...cargasReales };
    const serie = nuevasCargas[ejercicioId][serieIdx];
    
    const nuevoEstado = !serie.completado;
    serie.completado = nuevoEstado;
    setCargasReales(nuevasCargas);

    // Si se marcó como completada, iniciar temporizador de descanso
    if (nuevoEstado) {
      setDescansoObjetivo(tiempoSugerido);
      setTiempoDescanso(tiempoSugerido);
      setDescansoActivo(true);
    }
  };

  const cambiarValorSerie = (ejercicioId, serieIdx, campo, valor) => {
    const nuevasCargas = { ...cargasReales };
    nuevasCargas[ejercicioId][serieIdx][campo] = parseFloat(valor) || 0;
    setCargasReales(nuevasCargas);
  };

  const finalizarSesion = async () => {
    if (!sesionActiva) return;

    // Aplanar las series cargadas (excluir ejercicios no habilitados)
    const seriesPayload = [];
    Object.keys(cargasReales).forEach((ejId) => {
      cargasReales[ejId].forEach((serie) => {
        if (serie.completado) {
          seriesPayload.push({
            ejercicio_id: parseInt(ejId),
            numero_serie: serie.numero_serie,
            repeticiones_completadas: parseInt(serie.repeticiones),
            peso_levantado: parseFloat(serie.peso),
            rpe: null
          });
        }
      });
    });

    // Calcular el total de series habilitadas posibles en este día
    let totalSeriesHabilitadas = 0;
    if (diaSeleccionado && diaSeleccionado.ejercicios_rutina) {
      diaSeleccionado.ejercicios_rutina.forEach(ej => {
        if (ej.habilitado_actual !== false) {
          totalSeriesHabilitadas += ej.series;
        }
      });
    }

    if (seriesPayload.length < totalSeriesHabilitadas) {
      const msj = seriesPayload.length === 0 
        ? 'No has registrado ninguna serie completada. ¿Estás seguro de que quieres finalizar el entrenamiento de todos modos?'
        : 'No completaste todas las series planificadas. ¿Estás seguro de que quieres finalizar el entrenamiento de todos modos?';
      const confirmar = window.confirm(msj);
      if (!confirmar) return;
    }

    try {
      const sesionFinalizada = await api.finalizarEntrenamiento(sesionActiva.id, notas, seriesPayload);
      
      // Calcular volumen levantado (suma de reps * peso)
      const volumen = seriesPayload.reduce((acc, s) => acc + (s.repeticiones_completadas * s.peso_levantado), 0);
      
      setResumenExito({
        tiempo: formatearTiempo(tiempoTranscurrido),
        series: seriesPayload.length,
        volumenTotal: volumen
      });

      // Limpiar progreso guardado de esta sesión
      localStorage.removeItem(`tree_fit_progreso_${sesionActiva.id}`);

      // Resetear
      setRelojCorriendo(false);
      setSesionActiva(null);
      setMostrarModalFinalizar(false);
      setNotas('');
    } catch (err) {
      alert('Error al guardar el entrenamiento: ' + err.message);
    }
  };

  if (cargando) return <div className="cargando-contenedor">Preparando sala de entrenamiento...</div>;

  if (resumenExito) {
    return (
      <div className="resumen-exito-contenedor animacion-aparicion">
        <div className="tarjeta-vidrio resumen-exito-tarjeta">
          <h2>¡Entrenamiento Registrado!</h2>
          <p className="resumen-frase">Excelente trabajo. Cada gota de sudor cuenta.</p>
          
          <div className="metricas-resumen-grilla">
            <div className="tarjeta-metrica-resumen" style={{ margin: '1em 0'}}>
              <div>
                <strong>{resumenExito.tiempo}</strong>
                <span> Duración</span>
              </div>
            </div>
            <div className="tarjeta-metrica-resumen" style={{ margin: '1em 0'}}>
              <div>
                <strong>{resumenExito.series}</strong>
                <span> Series Logradas</span>
              </div>
            </div>
            <div className="tarjeta-metrica-resumen" style={{ margin: '1em 0'}}>
              <div>
                <strong>{resumenExito.volumenTotal} kg</strong>
                <span> Volumen Total</span>
              </div>
            </div>
          </div>

          <button onClick={() => setResumenExito(null)} className="btn btn-primario boton-volver-entrenamientos">
            Aceptar
          </button>
        </div>
      </div>
    );
  }

  if (!rutina) {
    return (
      <div className="sin-rutina-contenedor tarjeta-vidrio animacion-aparicion">
        <h3>No tienes rutinas asignadas</h3>
        <p>Tu profesor de educación física aún no te ha asignado un plan de entrenamiento. Contacta con tu entrenador para comenzar.</p>
      </div>
    );
  }

  return (
    <div className="entrenamiento-activo-seccion animacion-aparicion">
      {/* Cabecera del Módulo */}
      <div className="entrenamiento-cabecera">
        <div>
          <h2>Módulo "Mi Entrenamiento"</h2>
          <p className="nombre-rutina-mi-entrenamiento">Rutina: <strong>{rutina.nombre}</strong></p>
        </div>
        
        {/* Cronómetro Global si está corriendo */}
        {sesionActiva && (
          <div className="cronometro-global tarjeta-vidrio">
            <img
              src="/src/assets/time.svg"
              alt="Peso"
              className="link-icono-img"
            />
            <span className="tiempo-reloj">{formatearTiempo(tiempoTranscurrido)}</span>
          </div>
        )}
      </div>

      {/* Temporizador de Descanso flotante/superior */}
      {tiempoDescanso > 0 && (
        <div className="barra-descanso tarjeta-vidrio animacion-aparicion">
          <div className="barra-descanso-contenido">
            <p>Tiempo de descanso activo: <strong>{tiempoDescanso} segundos</strong></p>
            <button onClick={() => setTiempoDescanso(0)} className="btn-cancelar-descanso">Omitir</button>
          </div>
          <div className="barra-progreso-descanso" style={{ width: `${(tiempoDescanso / descansoObjetivo) * 100}%` }}></div>
        </div>
      )}

      {/* Vista de Selección de Día de Entrenamiento */}
      {!sesionActiva ? (
        <div className="seleccion-dia-contenedor tarjeta-vidrio">
          <h3>Selecciona el Día a Entrenar</h3>
          <p className="sub">Elige el bloque de ejercicios planificado por tu profesor para hoy:</p>
          
          <div className="dias-botones-grilla">
            {rutina.dias.map(d => (
              <button
                key={d.id}
                onClick={() => setDiaSeleccionado(d)}
                className={`btn-dia-selector ${diaSeleccionado?.id === d.id ? 'activo' : ''}`}
              >
                <strong>{d.nombre_dia}</strong>
                <span>{d.ejercicios_rutina.length} ejercicios</span>
              </button>
            ))}
          </div>

          {diaSeleccionado && (
            <div className="vista-previa-dia">
              <h4>Ejercicios Planificados:</h4>
              <div className="lista-previa-ej">
                {diaSeleccionado.ejercicios_rutina.map((ej, idx) => (
                  <div key={ej.id} className={`item-previa-ej ${ej.habilitado_actual === false ? 'item-previa-bloqueado' : ''}`}>
                    <span>
                      {idx + 1}. <strong>{ej.ejercicio.nombre}</strong>
                      {ej.habilitado_actual === false && <span style={{ color: '#f87171', fontSize: '0.78rem', marginLeft: '6px' }}>🚫 No disponible</span>}
                    </span>
                    {ej.habilitado_actual !== false && (
                      <span className="badge badge-primario">{ej.series}x{ej.repeticiones} ({ej.carga_objetivo})</span>
                    )}
                  </div>
                ))}
              </div>
              
              <button onClick={iniciarSesion} className="btn btn-primario btn-iniciar-sesion">
                Iniciar Sesión de Musculación
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Vista de Ejecución de Entrenamiento */
        <div className="sesion-ejecucion-contenedor">
          <div className="ejecucion-cabecera tarjeta-vidrio">
            <h3>Entrenamiento en Curso: {diaSeleccionado.nombre_dia}</h3>
            <button onClick={() => setMostrarModalFinalizar(true)} className="btn btn-exito">
              Finalizar Entrenamiento
            </button>
          </div>

          <div className="lista-ejercicios-ejecucion">
            {diaSeleccionado.ejercicios_rutina.map((ej) => {
              const noHabilitado = ej.habilitado_actual === false;
              const cargasEj = cargasReales[ej.ejercicio_id] || [];
              return (
                <div key={ej.id} className={`tarjeta-vidrio tarjeta-ejercicio-ejecucion ${noHabilitado ? 'ejercicio-bloqueado' : ''}`}>
                  <div className="cabecera-ejercicio-ejecucion">
                    <div>
                      <h4>
                        {ej.ejercicio.nombre}
                        {noHabilitado && <span className="badge-bloqueado">🚫 No habilitado</span>}
                      </h4>
                      {noHabilitado ? (
                        <p className="motivo-no-habilitado">{ej.motivo_no_habilitado}</p>
                      ) : (
                        <p className="objetivo-ejercicio-ejecucion">
                          Objetivo: <strong>{ej.series} Series</strong> x <strong>{ej.repeticiones} Reps</strong> con <strong>{ej.carga_objetivo}</strong> (Descanso: {ej.descanso_segundos}s)
                        </p>
                      )}
                    </div>
                    {ej.ejercicio.video_url && !noHabilitado && (
                      <a href={ej.ejercicio.video_url} target="_blank" rel="noopener noreferrer" className="btn-link-demo">
                        Demo
                      </a>
                    )}
                  </div>

                  {/* Tabla de Series: solo si está habilitado */}
                  {!noHabilitado && (
                    <div className="tabla-contenedor" style={{ marginTop: '15px' }}>
                      <table className="tabla-series-ejecucion" style={{ width: '100%', minWidth: '280px' }}>
                        <thead>
                          <tr>
                            <th style={{ width: '60px' }}>Serie</th>
                            <th>Repeticiones</th>
                            <th>Carga (kg)</th>
                            <th style={{ width: '80px', textAlign: 'center' }}>Hecho</th>
                          </tr>
                        </thead>
                        <tbody>
                          {cargasEj.map((serie, idx) => (
                            <tr key={idx} className={serie.completado ? 'serie-completada-fila' : ''}>
                              <td><strong>#{serie.numero_serie}</strong></td>
                              <td>
                                <input
                                  type="number"
                                  className="input-control-serie"
                                  value={serie.repeticiones}
                                  onChange={(e) => cambiarValorSerie(ej.ejercicio_id, idx, 'repeticiones', e.target.value)}
                                  disabled={serie.completado}
                                />
                              </td>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <input
                                    type="number"
                                    step="0.5"
                                    className="input-control-serie"
                                    value={serie.peso}
                                    onChange={(e) => cambiarValorSerie(ej.ejercicio_id, idx, 'peso', e.target.value)}
                                    disabled={serie.completado}
                                  />
                                  <span style={{ fontSize: '0.75rem', color: 'var(--color-texto-secundario)', whiteSpace: 'nowrap' }}>
                                    (Sug: {ej.carga_objetivo})
                                  </span>
                                </div>
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                <button
                                  onClick={() => alternarSerieCompletada(ej.ejercicio_id, idx, ej.descanso_segundos)}
                                  className={`btn-check-serie ${serie.completado ? 'check-activo' : ''}`}
                                >
                                  {serie.completado ? '✓' : '○'}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal para Finalizar y añadir Notas */}
      {mostrarModalFinalizar && createPortal(
        <div className="modal-pantalla">
          <div className="tarjeta-vidrio modal-contenido animacion-aparicion" style={{ maxWidth: '450px' }}>
            <div className="modal-cabecera">
              <h3>Finalizar Sesión</h3>
              <button onClick={() => setMostrarModalFinalizar(false)} className="btn-cerrar">✕</button>
            </div>
            
            <div className="input-grupo">
              <label>Observaciones del Entrenamiento</label>
              <textarea
                className="input-control"
                placeholder="¿Cómo te sentiste? Ej: Sensaciones excelentes en el pecho. Molestia leve en muñeca izquierda."
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                rows="4"
              />
            </div>

            <div className="modal-acciones">
              <button
                type="button"
                onClick={() => setMostrarModalFinalizar(false)}
                className="btn btn-secundario"
              >
                Volver
              </button>
              <button onClick={finalizarSesion} className="btn btn-primario">
                Finalizar y Guardar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      <style>{`
        .entrenamiento-cabecera {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 15px;
        }

        .nombre-rutina-mi-entrenamiento {
          font-size: 0.95rem;
          color: var(--color-texto-secundario);
        }

        .cronometro-global {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 16px;
          font-family: monospace;
          background: rgba(99, 102, 241, 0.12);
          border-color: var(--color-primario);
        }

        .tiempo-reloj {
          font-size: 1.2rem;
          font-weight: 700;
          color: #a5b4fc;
        }

        .link-icono-img {
          width: 2em;
          height: 2em;
        }

        /* Barra Descanso */
        .barra-descanso {
          position: fixed;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          width: 90%;
          max-width: 450px;
          padding: 12px 18px;
          z-index: 1000;
          background: rgba(13, 17, 28, 0.95);
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
          overflow: hidden;
          border-radius: 12px;
        }

        .barra-descanso-contenido {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.9rem;
        }

        .btn-cancelar-descanso {
          background: none;
          border: none;
          color: var(--color-primario);
          font-weight: 700;
          cursor: pointer;
        }

        .barra-progreso-descanso {
          position: absolute;
          bottom: 0;
          left: 0;
          height: 3px;
          background: var(--color-exito);
          transition: width 1s linear;
        }

        /* Selección de Día */
        .seleccion-dia-contenedor {
          padding: 30px;
        }

        .seleccion-dia-contenedor h3 {
          margin-bottom: 5px;
        }

        .seleccion-dia-contenedor .sub {
          color: var(--color-texto-secundario);
          margin-bottom: 24px;
          font-size: 0.9rem;
        }

        .dias-botones-grilla {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 15px;
          margin-bottom: 30px;
        }

        .btn-dia-selector {
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--color-borde);
          padding: 20px;
          border-radius: var(--radio-esquina);
          color: var(--color-texto-principal);
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          transition: all 0.2s ease;
        }

        .btn-dia-selector:hover {
          background: rgba(255,255,255,0.06);
          border-color: rgba(255,255,255,0.15);
        }

        .btn-dia-selector.activo {
          background: rgba(99, 102, 241, 0.12);
          border-color: var(--color-primario);
          box-shadow: 0 0 10px rgba(99, 102, 241, 0.2);
        }

        .vista-previa-dia {
          border-top: 1px solid var(--color-borde);
          padding-top: 20px;
        }

        .vista-previa-dia h4 {
          margin-bottom: 12px;
          color: var(--color-texto-secundario);
          font-size: 0.95rem;
        }

        .lista-previa-ej {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 24px;
        }

        .item-previa-ej {
          display: flex;
          justify-content: space-between;
          background: rgba(0,0,0,0.15);
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 0.9rem;
        }

        .btn-iniciar-sesion {
          width: 100%;
          padding: 16px;
          font-size: 1.05rem;
        }

        /* Ejecución de Sesión */
        .sesion-ejecucion-contenedor {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .ejecucion-cabecera {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
        }

        .lista-ejercicios-ejecucion {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .tarjeta-ejercicio-ejecucion {
          padding: 20px;
        }

        .cabecera-ejercicio-ejecucion {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 1px solid var(--color-borde);
          padding-bottom: 12px;
          margin-bottom: 15px;
        }

        .objetivo-ejercicio-ejecucion {
          font-size: 0.82rem;
          color: var(--color-texto-secundario);
          margin-top: 4px;
        }

        .tabla-series-ejecucion {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.9rem;
        }

        .tabla-series-ejecucion th {
          text-align: left;
          padding: 8px;
          color: var(--color-texto-secundario);
          border-bottom: 1px solid var(--color-borde);
        }

        .tabla-series-ejecucion td {
          padding: 8px;
          border-bottom: 1px solid var(--color-borde);
          vertical-align: middle;
        }

        .serie-completada-fila td {
          background: rgba(16, 185, 129, 0.04);
          opacity: 0.7;
        }

        .input-control-serie {
          width: 80px;
          background: rgba(0,0,0,0.3);
          border: 1px solid var(--color-borde);
          border-radius: 6px;
          padding: 6px 10px;
          color: white;
          font-weight: 600;
        }

        .input-control-serie:disabled {
          opacity: 0.8;
          color: #9ca3af;
          cursor: not-allowed;
        }

        .btn-check-serie {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(255,255,255,0.05);
          border: 1px solid var(--color-borde);
          color: var(--color-texto-secundario);
          cursor: pointer;
          font-weight: 700;
          font-size: 1.1rem;
          transition: all 0.2s;
        }

        .btn-check-serie.check-activo {
          background: var(--color-exito);
          color: white;
          border-color: transparent;
          box-shadow: 0 0 10px rgba(16,185,129,0.3);
        }

        /* Resumen de éxito */
        .resumen-exito-contenedor {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 80vh;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 1em;
        }

        .resumen-exito-tarjeta {
          max-width: 480px;
          width: 100%;
          text-align: center;
          padding: 40px;
          margin: 3em
        }

        .exito-emoji {
          font-size: 4rem;
          display: block;
          margin-bottom: 15px;
        }

        .resumen-frase {
          color: var(--color-texto-secundario);
          font-size: 0.95rem;
          margin-top: 6px;
          margin-bottom: 30px;
        }

        .metricas-resumen-grilla {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 30px;
          display: flex;
          flex-direction: column;
          gap: 1em;
        }

        .boton-volver-entrenamientos {
          width: 100%;
        }

        .sin-rutina-contenedor {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px;
          text-align: center;
          gap: 15px;
          color: var(--color-texto-secundario);
        }

        /* Ejercicio bloqueado por RF8 */
        .ejercicio-bloqueado {
          opacity: 0.65;
          border-color: rgba(245, 158, 11, 0.35) !important;
          background: rgba(245, 158, 11, 0.03) !important;
        }

        .badge-bloqueado {
          display: inline-block;
          font-size: 0.65rem;
          background: rgba(245, 158, 11, 0.15);
          color: #fbbf24;
          border-radius: 4px;
          padding: 2px 7px;
          margin-left: 10px;
          font-weight: 700;
          vertical-align: middle;
        }

        .motivo-no-habilitado {
          font-size: 0.82rem;
          color: #fbbf24;
          margin-top: 5px;
          font-style: italic;
        }

        .item-previa-bloqueado {
          opacity: 0.6;
          border-left: 2px solid rgba(245, 158, 11, 0.5);
        }

        @media (max-width: 480px) {
          .ejecucion-cabecera {
            flex-direction: column;
            gap: 15px;
            align-items: stretch;
            text-align: center;
          }
          .ejecucion-cabecera .btn-exito {
            width: 100%;
          }
          .cabecera-ejercicio-ejecucion {
            flex-direction: column;
            gap: 10px;
          }
        }
      `}</style>
    </div>
  );
};
