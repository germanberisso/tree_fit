import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';

export const EstadisticasProfesor = () => {
  const [estadisticas, setEstadisticas] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const cargarEstadisticas = async () => {
    try {
      setCargando(true);
      const data = await api.obtenerEstadisticasProfesor();
      setEstadisticas(data);
    } catch (err) {
      setError(err.message || 'Error al cargar las estadísticas.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  if (cargando) return <div className="cargando-contenedor">Cargando métricas y KPIs...</div>;
  if (error) return <div className="alerta-error" style={{ margin: '20px' }}>{error}</div>;
  if (!estadisticas) return null;

  return (
    <div className="estadisticas-seccion animacion-aparicion">
      <div className="seccion-cabecera">
        <h2>Panel de Estadísticas y KPIs</h2>
        <p className="descripcion-cabecera">Métricas clave de rendimiento de tus alumnos y adherencia al entrenamiento.</p>
      </div>

      <div className="metricas-grilla">
        <div className="tarjeta-vidrio tarjeta-kpi">
          <div className="kpi-icono" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#a5b4fc' }}>👥</div>
          <div className="kpi-info">
            <h3>{estadisticas.total_alumnos}</h3>
            <span>Alumnos Activos</span>
          </div>
        </div>

        <div className="tarjeta-vidrio tarjeta-kpi">
          <div className="kpi-icono" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#34d399' }}>📋</div>
          <div className="kpi-info">
            <h3>{estadisticas.rutinas_activas}</h3>
            <span>Rutinas Asignadas</span>
          </div>
        </div>

        <div className="tarjeta-vidrio tarjeta-kpi">
          <div className="kpi-icono" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#fbbf24' }}>⚡</div>
          <div className="kpi-info">
            <h3>{estadisticas.entrenamientos_semana}</h3>
            <span>Entrenamientos esta semana</span>
          </div>
        </div>

        <div className="tarjeta-vidrio tarjeta-kpi">
          <div className="kpi-icono" style={{ background: 'rgba(236, 72, 153, 0.1)', color: '#f472b6' }}>🏋️</div>
          <div className="kpi-info">
            <h3>{estadisticas.volumen_total_kg} kg</h3>
            <span>Volumen Total Levantado</span>
          </div>
        </div>

        <div className="tarjeta-vidrio tarjeta-kpi">
          <div className="kpi-icono" style={{ background: 'rgba(14, 165, 233, 0.1)', color: '#38bdf8' }}>🏆</div>
          <div className="kpi-info">
            <h3>{estadisticas.alumno_mas_activo ? estadisticas.alumno_mas_activo.nombre : '-'}</h3>
            <span>Alumno Destacado ({estadisticas.alumno_mas_activo ? estadisticas.alumno_mas_activo.sesiones : 0} sesiones)</span>
          </div>
        </div>

        <div className="tarjeta-vidrio tarjeta-kpi">
          <div className="kpi-icono" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#a78bfa' }}>📊</div>
          <div className="kpi-info">
            <h3>{estadisticas.total_registros_biometricos}</h3>
            <span>Registros Biométricos Totales</span>
          </div>
        </div>
      </div>

      <style>{`
        .metricas-grilla {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-top: 20px;
        }

        .tarjeta-kpi {
          display: flex;
          align-items: center;
          padding: 24px;
          gap: 20px;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .tarjeta-kpi:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 25px rgba(0,0,0,0.3);
          border-color: rgba(99, 102, 241, 0.4);
        }

        .kpi-icono {
          width: 60px;
          height: 60px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.8rem;
          flex-shrink: 0;
        }

        .kpi-info {
          display: flex;
          flex-direction: column;
        }

        .kpi-info h3 {
          font-size: 1.8rem;
          margin: 0;
          color: var(--color-texto-principal);
          line-height: 1.2;
        }

        .kpi-info span {
          font-size: 0.85rem;
          color: var(--color-texto-secundario);
          font-weight: 500;
          margin-top: 4px;
        }
      `}</style>
    </div>
  );
};
