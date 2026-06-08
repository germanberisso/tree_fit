// Vista de Progreso Biométrico (para Alumnos)
import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { GraficosBiometria } from '../../components/GraficosBiometria';

export const ProgresoBiometrico = () => {
  const [registros, setRegistros] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  // Formulario de Nueva Medición
  const [peso, setPeso] = useState('');
  const [altura, setAltura] = useState('');
  const [porcentajeGrasa, setPorcentajeGrasa] = useState('');
  const [porcentajeMusculo, setPorcentajeMusculo] = useState('');
  const [cintura, setCintura] = useState('');
  const [guardando, setGuardando] = useState(false);

  const cargarBiometria = async () => {
    try {
      const perfil = await api.obtenerPerfil();
      const data = await api.obtenerBiometriaAlumno(perfil.id);
      setRegistros(data);
      if (data.length > 0) {
        // Pre-cargar todos los valores de la última medición registrada
        const ultima = data[data.length - 1];
        setPeso(ultima.peso || '');
        setAltura(ultima.altura || '');
        setPorcentajeGrasa(ultima.porcentaje_grasa || '');
        setPorcentajeMusculo(ultima.porcentaje_musculo || '');
        setCintura(ultima.cintura || '');
      }
    } catch (err) {
      setError(err.message || 'Error al cargar los datos biométricos.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarBiometria();
  }, []);

  const manejarGuardar = async (e) => {
    e.preventDefault();
    if (!peso || !altura) {
      alert('Peso y altura son campos requeridos.');
      return;
    }

    setGuardando(true);
    try {
      const perfil = await api.obtenerPerfil();
      await api.registrarBiometria(perfil.id, {
        peso: parseFloat(peso),
        altura: parseFloat(altura),
        porcentaje_grasa: porcentajeGrasa ? parseFloat(porcentajeGrasa) : null,
        porcentaje_musculo: porcentajeMusculo ? parseFloat(porcentajeMusculo) : null,
        cintura: cintura ? parseFloat(cintura) : null
      });

      // Limpiar campos de medición
      setPeso('');
      setPorcentajeGrasa('');
      setPorcentajeMusculo('');
      setCintura('');

      cargarBiometria();
    } catch (err) {
      alert('Error al registrar medidas: ' + err.message);
    } finally {
      setGuardando(false);
    }
  };

  const manejarEliminar = async (id) => {
    if (window.confirm('¿Está seguro de que desea eliminar este registro biométrico?')) {
      try {
        const perfil = await api.obtenerPerfil();
        await api.eliminarRegistroBiometrico(perfil.id, id);
        cargarBiometria();
      } catch (err) {
        alert('Error al eliminar: ' + err.message);
      }
    }
  };

  if (cargando) return <div className="cargando-contenedor">Cargando panel de evolución corporal...</div>;

  return (
    <div className="biometria-seccion animacion-aparicion">
      <div className="seccion-cabecera">
        <h2>Panel de Evolución Biométrica</h2>
        <p className="descripcion-cabecera">Registra tus medidas corporales periódicamente para visualizar tus progresos gráficos en tiempo real.</p>
      </div>

      <div className="layout-division-biometria">
        {/* Formulario de registro a la izquierda */}
        <div className="formulario-registro-biometria flex-1">
          <div className="tarjeta-vidrio">
            <h3>Nueva Medición</h3>
            <form onSubmit={manejarGuardar} style={{ marginTop: '15px' }}>
              <div className="input-grupo">
                <label>Peso Corporal (kg) *</label>
                <input
                  type="number"
                  step="0.1"
                  className="input-control"
                  placeholder="Ej: 78.4"
                  value={peso}
                  onChange={(e) => setPeso(e.target.value)}
                  required
                />
              </div>

              <div className="input-grupo">
                <label>Altura (cm) *</label>
                <input
                  type="number"
                  className="input-control"
                  placeholder="Ej: 178"
                  value={altura}
                  onChange={(e) => setAltura(e.target.value)}
                  required
                />
              </div>

              <div className="input-grupo">
                <label>% Grasa Corporal (Opcional)</label>
                <input
                  type="number"
                  step="0.1"
                  className="input-control"
                  placeholder="Ej: 14.5"
                  value={porcentajeGrasa}
                  onChange={(e) => setPorcentajeGrasa(e.target.value)}
                />
              </div>

              <div className="input-grupo">
                <label>% Masa Muscular (Opcional)</label>
                <input
                  type="number"
                  step="0.1"
                  className="input-control"
                  placeholder="Ej: 41.2"
                  value={porcentajeMusculo}
                  onChange={(e) => setPorcentajeMusculo(e.target.value)}
                />
              </div>

              <div className="input-grupo">
                <label>Medida de Cintura (cm) (Opcional)</label>
                <input
                  type="number"
                  step="0.1"
                  className="input-control"
                  placeholder="Ej: 84"
                  value={cintura}
                  onChange={(e) => setCintura(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={guardando}
                className="btn btn-primario boton-guardar-medidas"
              >
                {guardando ? 'Guardando...' : 'Registrar Medidas'}
              </button>
            </form>
          </div>
        </div>

        {/* Gráfico e historial a la derecha */}
        <div className="visualizacion-biometria flex-2">
          <div className="tarjeta-vidrio">
            <GraficosBiometria registros={registros} />
            
            {registros.length > 0 && (
              <div className="tabla-contenedor" style={{ marginTop: '20px' }}>
                <table className="tabla-premium">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Peso</th>
                      <th>Altura</th>
                      <th>Grasa</th>
                      <th>Músculo</th>
                      <th>Cintura</th>
                      <th style={{ width: '50px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...registros].reverse().map((reg) => (
                      <tr key={reg.id}>
                        <td>{new Date(reg.fecha_registro).toLocaleDateString()}</td>
                        <td><strong>{reg.peso} kg</strong></td>
                        <td>{reg.altura} cm</td>
                        <td>{reg.porcentaje_grasa ? `${reg.porcentaje_grasa}%` : '-'}</td>
                        <td>{reg.porcentaje_musculo ? `${reg.porcentaje_musculo}%` : '-'}</td>
                        <td>{reg.cintura ? `${reg.cintura} cm` : '-'}</td>
                        <td>
                          <button
                            onClick={() => manejarEliminar(reg.id)}
                            className="btn-eliminar-registro-tabla"
                            title="Eliminar registro"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .layout-division-biometria {
          display: flex;
          gap: 25px;
        }

        .formulario-registro-biometria h3 {
          font-size: 1.1rem;
          color: #a5b4fc;
        }

        .boton-guardar-medidas {
          width: 100%;
          margin-top: 10px;
        }

        .btn-eliminar-registro-tabla {
          background: none;
          border: none;
          color: var(--color-texto-desvanecido);
          cursor: pointer;
          font-size: 0.95rem;
        }

        .btn-eliminar-registro-tabla:hover {
          color: var(--color-peligro);
        }

        @media (max-width: 992px) {
          .layout-division-biometria {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};
