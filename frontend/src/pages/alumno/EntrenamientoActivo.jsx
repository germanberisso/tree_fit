// Vista de Entrenamiento Activo ("Mi Entrenamiento" para Alumnos)
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../../services/api';

export const EntrenamientoActivo = () => {
  const { usuario } = { usuario: JSON.parse(localStorage.getItem('tree_fit_user_data') || '{}') }; // Fallback o mock local
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
      
      const rut = await api.obtenerRutinaActiva(perfil.id);
      setRutina(rut);
      if (rut && rut.dias.length > 0) {
        setDiaSeleccionado(rut.dias[0]);
      }

      // Verificar si hay una sesión activa sin finalizar
      try {
        const sesion = await api.obtenerEntrenamientoActivo();
        setSesionActiva(sesion);
        
        // Reestablecer el dia de rutina si ya estaba activo
        if (sesion.dia_rutina_id && rut) {
          const diaActivo = rut.dias.find(d => d.id === sesion.dia_rutina_id);
          if (diaActivo) setDiaSeleccionado(diaActivo);
        }

        // Calcular el tiempo transcurrido desde que inició
        const inicio = new Date(sesion.fecha_inicio).getTime();
        const ahora = new Date().getTime();
        setTiempoTranscurrido(Math.floor((ahora - inicio) / 1000));
        setRelojCorriendo(true);
      } catch (e) {
        // No hay sesión activa, normal
        setSesionActiva(null);
      }
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

      // Inicializar el diccionario de cargas reales con los valores objetivo
      const inicialCargas = {};
      diaSeleccionado.ejercicios_rutina.forEach((ej) => {
        inicialCargas[ej.ejercicio_id] = Array.from({ length: ej.series }, (_, index) => {
          // Extraer número sugerido de la carga objetivo (ej: '20kg' -> 20)
          const pesoSugerido = parseFloat(ej.carga_objetivo.replace(/[^0-9.]/g, '')) || 10;
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

    // Aplanar las series cargadas
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

    if (seriesPayload.length === 0) {
      alert('Debes registrar al menos una serie completada para finalizar el entrenamiento.');
      return;
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
          <span className="exito-emoji">🏆</span>
          <h2>¡Entrenamiento Registrado!</h2>
          <p className="resumen-frase">Excelente trabajo. Cada gota de sudor cuenta.</p>
          
          <div className="metricas-resumen-grilla">
            <div className="tarjeta-metrica-resumen">
              <span className="icono">⏱️</span>
              <div>
                <strong>{resumenExito.tiempo}</strong>
                <span>Duración</span>
              </div>
            </div>
            <div className="tarjeta-metrica-resumen">
              <span className="icono">💪</span>
              <div>
                <strong>{resumenExito.series}</strong>
                <span>Series Logradas</span>
              </div>
            </div>
            <div className="tarjeta-metrica-resumen">
              <span className="icono">🏋️</span>
              <div>
                <strong>{resumenExito.volumenTotal} kg</strong>
                <span>Volumen Total</span>
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
        <span style={{ fontSize: '3rem' }}>📋</span>
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
            <span className="emoji-reloj">⏱️</span>
            <span className="tiempo-reloj">{formatearTiempo(tiempoTranscurrido)}</span>
          </div>
        )}
      </div>

      {/* Temporizador de Descanso flotante/superior */}
      {tiempoDescanso > 0 && (
        <div className="barra-descanso tarjeta-vidrio animacion-aparicion">
          <div className="barra-descanso-contenido">
            <span className="emoji-descanso">🧘</span>
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
                  <div key={ej.id} className="item-previa-ej">
                    <span>{idx + 1}. <strong>{ej.ejercicio.nombre}</strong></span>
                    <span className="badge badge-primario">{ej.series}x{ej.repeticiones} ({ej.carga_objetivo})</span>
                  </div>
                ))}
              </div>
              
              <button onClick={iniciarSesion} className="btn btn-primario btn-iniciar-sesion">
                🚀 Iniciar Sesión de Musculación
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
              🏁 Finalizar Entrenamiento
            </button>
          </div>

          <div className="lista-ejercicios-ejecucion">
            {diaSeleccionado.ejercicios_rutina.map((ej) => {
              const cargasEj = cargasReales[ej.ejercicio_id] || [];
              return (
                <div key={ej.id} className="tarjeta-vidrio tarjeta-ejercicio-ejecucion">
                  <div className="cabecera-ejercicio-ejecucion">
                    <div>
                      <h4>{ej.ejercicio.nombre}</h4>
                      <p className="objetivo-ejercicio-ejecucion">
                        Objetivo: <strong>{ej.series} Series</strong> x <strong>{ej.repeticiones} Reps</strong> con <strong>{ej.carga_objetivo}</strong> (Descanso: {ej.descanso_segundos}s)
                      </p>
                    </div>
                    {ej.ejercicio.video_url && (
                      <a href={ej.ejercicio.video_url} target="_blank" rel="noopener noreferrer" className="btn-link-demo">
                        🎬 Demo
                      </a>
                    )}
                  </div>

                  {/* Tabla de Series de Entrada */}
                  <table className="tabla-series-ejecucion">
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
                            <input
                              type="number"
                              step="0.5"
                              className="input-control-serie"
                              value={serie.peso}
                              onChange={(e) => cambiarValorSerie(ej.ejercicio_id, idx, 'peso', e.target.value)}
                              disabled={serie.completado}
                            />
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
        }

        .resumen-exito-tarjeta {
          max-width: 480px;
          width: 100%;
          text-align: center;
          padding: 40px;
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
        }

        .tarjeta-metrica-resumen {
          background: rgba(0,0,0,0.2);
          border: 1px solid var(--color-borde);
          border-radius: 10px;
          padding: 15px 10px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .tarjeta-metrica-resumen .icono {
          font-size: 1.5rem;
        }

        .tarjeta-metrica-resumen strong {
          display: block;
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--color-texto-principal);
        }

        .tarjeta-metrica-resumen span {
          font-size: 0.72rem;
          color: var(--color-texto-secundario);
          text-transform: uppercase;
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
      `}</style>
    </div>
  );
};
