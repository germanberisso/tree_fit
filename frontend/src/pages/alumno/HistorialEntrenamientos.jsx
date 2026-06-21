// Vista de Historial de Entrenamientos (para Alumnos)
import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import timeIcon from '../../assets/time.svg';
import weightIcon from '../../assets/weight.svg';

export const HistorialEntrenamientos = () => {
  const [historial, setHistorial] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const cargarHistorial = async () => {
    try {
      setCargando(true);
      // Obtener perfil para sacar ID
      const perfil = await api.obtenerPerfil();
      const data = await api.obtenerHistorialEntrenamientos(perfil.id);
      setHistorial(data);
    } catch (err) {
      setError(err.message || 'Error al cargar el historial.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarHistorial();
  }, []);

  if (cargando) return <div className="cargando-contenedor">Cargando historial de sesiones...</div>;

  return (
    <div className="historial-seccion animacion-aparicion">
      <div className="seccion-cabecera">
        <h2>Historial de Entrenamientos</h2>
        <p className="descripcion-cabecera">Consulta el registro técnico de tus sesiones de musculación anteriores.</p>
      </div>

      {error ? (
        <div className="alerta-error">{error}</div>
      ) : historial.length === 0 ? (
        <div className="tarjeta-vidrio sin-sesiones-al">
          <h3>Aún no has registrado entrenamientos</h3>
          <p>Tus entrenamientos finalizados aparecerán aquí una vez que inicies y completes tu primera sesión.</p>
        </div>
      ) : (
        <div className="historial-linea-tiempo">
          {historial.map((sesion) => {
            const fecha = new Date(sesion.fecha_inicio);
            const fechaFin = sesion.fecha_fin ? new Date(sesion.fecha_fin) : null;
            const duracionMins = fechaFin ? Math.round((fechaFin.getTime() - fecha.getTime()) / 60000) : null;

            // Calcular volumen levantado en esta sesión específica
            const volumenTotal = sesion.series_completadas.reduce(
              (acc, s) => acc + (s.repeticiones_completadas * s.peso_levantado),
              0
            );

            return (
              <div key={sesion.id} className="tarjeta-vidrio sesion-cronologia-item">
                <div className="item-cronologia-cabecera">
                  <div>
                    <span className="badge badge-primario">
                      {fecha.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </span>
                    <h3 className="titulo-dia-sesion">{sesion.dia_rutina?.nombre_dia || 'Sesión de Musculación'}</h3>
                  </div>

                  <div className="metrica-rapida-sesion">
                    {duracionMins >= 0 && <span className="duracion"><img
                      src={timeIcon}
                      alt="Tiempo"
                      className="icono-metrica-pequeno"
                    /> {duracionMins} min</span>}
                    <span className="volumen"><img
                      src={weightIcon}
                      alt="Peso"
                      className="icono-metrica-pequeno"
                    /> {volumenTotal} kg levantados</span>
                  </div>
                </div>

                {sesion.notas && (
                  <div className="observacion-sesion">
                    <strong>Comentarios:</strong> {sesion.notas}
                  </div>
                )}

                <div className="series-desglose">
                  <h4>Desglose de Ejercicios Realizados:</h4>

                  {/* Agrupar series por ejercicio */}
                  <div className="ejercicios-agrupados-lista">
                    {Object.values(
                      sesion.series_completadas.reduce((grupos, serie) => {
                        const ejNombre = serie.ejercicio.nombre;
                        if (!grupos[ejNombre]) {
                          grupos[ejNombre] = { nombre: ejNombre, series: [] };
                        }
                        grupos[ejNombre].series.push(serie);
                        return grupos;
                      }, {})
                    ).map((grupo, gIdx) => (
                      <div key={gIdx} className="grupo-ejercicio-desglose">
                        <span className="nombre-ejercicio-grupo">✓ {grupo.nombre}</span>
                        <div className="lista-series-valores">
                          {grupo.series.map((s, sIdx) => (
                            <span key={s.id} className="badge-serie-valor">
                              Serie {s.numero_serie}: <strong>{s.repeticiones_completadas} reps</strong> x <strong>{s.peso_levantado} kg</strong>
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        .sin-sesiones-al {
          text-align: center;
          padding: 60px;
          color: var(--color-texto-secundario);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .historial-linea-tiempo {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .sesion-cronologia-item {
          padding: 24px;
        }

        .item-cronologia-cabecera {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 1px solid var(--color-borde);
          padding-bottom: 15px;
          margin-bottom: 15px;
          flex-wrap: wrap;
          gap: 15px;
        }

        .titulo-dia-sesion {
          font-size: 1.25rem;
          margin-top: 8px;
        }

        .metrica-rapida-sesion {
          display: flex;
          gap: 12px;
          font-size: 0.85rem;
          font-weight: 600;
        }

        .metrica-rapida-sesion .duracion {
          display: flex;
          align-items: center;
          gap: 5px;
          color: #a5b4fc;
          background: rgba(99, 102, 241, 0.1);
          padding: 4px 10px;
          border-radius: 6px;
        }

        .icono-metrica-pequeno {
          width: 1rem;
          height: 1rem;
        }

        .metrica-rapida-sesion .volumen {
          display: flex;
          align-items: center;
          gap: 5px;
          color: #34d399;
          background: rgba(16, 185, 129, 0.1);
          padding: 4px 10px;
          border-radius: 6px;
        }

        .observacion-sesion {
          background: rgba(0, 0, 0, 0.15);
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 0.88rem;
          color: var(--color-texto-secundario);
          margin-bottom: 15px;
          border-left: 3px solid var(--color-primario);
        }

        .series-desglose h4 {
          font-size: 0.9rem;
          color: var(--color-texto-secundario);
          margin-bottom: 10px;
        }

        .ejercicios-agrupados-lista {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .grupo-ejercicio-desglose {
          background: rgba(255,255,255,0.01);
          border: 1px solid rgba(255, 255, 255, 0.03);
          border-radius: 10px;
          padding: 12px 16px;
        }

        .nombre-ejercicio-grupo {
          font-weight: 700;
          font-size: 0.9rem;
          color: #a5b4fc;
          display: block;
          margin-bottom: 8px;
        }

        .lista-series-valores {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .badge-serie-valor {
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid var(--color-borde);
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 0.78rem;
          color: var(--color-texto-secundario);
        }
      `}</style>
    </div>
  );
};
