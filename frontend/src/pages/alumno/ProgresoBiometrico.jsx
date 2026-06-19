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
  
  // Perímetros detallados
  const [pecho, setPecho] = useState('');
  const [cadera, setCadera] = useState('');
  const [bicepIzq, setBicepIzq] = useState('');
  const [bicepDer, setBicepDer] = useState('');
  const [musloIzq, setMusloIzq] = useState('');
  const [musloDer, setMusloDer] = useState('');
  const [mostrarPerimetros, setMostrarPerimetros] = useState(false);

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
        setPecho(ultima.pecho || '');
        setCadera(ultima.cadera || '');
        setBicepIzq(ultima.bicep_izq || '');
        setBicepDer(ultima.bicep_der || '');
        setMusloIzq(ultima.muslo_izq || '');
        setMusloDer(ultima.muslo_der || '');
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
        cintura: cintura ? parseFloat(cintura) : null,
        pecho: pecho ? parseFloat(pecho) : null,
        cadera: cadera ? parseFloat(cadera) : null,
        bicep_izq: bicepIzq ? parseFloat(bicepIzq) : null,
        bicep_der: bicepDer ? parseFloat(bicepDer) : null,
        muslo_izq: musloIzq ? parseFloat(musloIzq) : null,
        muslo_der: musloDer ? parseFloat(musloDer) : null
      });

      // Limpiar campos de medición
      setPeso('');
      setPorcentajeGrasa('');
      setPorcentajeMusculo('');
      setCintura('');
      setPecho('');
      setCadera('');
      setBicepIzq('');
      setBicepDer('');
      setMusloIzq('');
      setMusloDer('');

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



              {/* Accordion de Perímetros Detallados */}
              <div className="accordion-perimetros">
                <button 
                  type="button" 
                  className="btn-accordion"
                  onClick={() => setMostrarPerimetros(!mostrarPerimetros)}
                >
                  <span>{mostrarPerimetros ? '▼' : '▶'} Perímetros Detallados (Opcionales)</span>
                </button>
                
                {mostrarPerimetros && (
                  <div className="contenido-accordion animacion-aparicion">
                    <div className="input-grupo">
                      <label>Cintura (cm)</label>
                      <input
                        type="number"
                        step="0.1"
                        className="input-control"
                        placeholder="Ej: 84"
                        value={cintura}
                        onChange={(e) => setCintura(e.target.value)}
                      />
                    </div>
                    <div className="input-grupo">
                      <label>Pecho (cm)</label>
                      <input
                        type="number"
                        step="0.1"
                        className="input-control"
                        placeholder="Ej: 105"
                        value={pecho}
                        onChange={(e) => setPecho(e.target.value)}
                      />
                    </div>
                    <div className="input-grupo">
                      <label>Cadera (cm)</label>
                      <input
                        type="number"
                        step="0.1"
                        className="input-control"
                        placeholder="Ej: 90"
                        value={cadera}
                        onChange={(e) => setCadera(e.target.value)}
                      />
                    </div>
                    <div className="fila-inputs">
                      <div className="input-grupo flex-1">
                        <label>Bícep Izq. (cm)</label>
                        <input
                          type="number"
                          step="0.1"
                          className="input-control"
                          placeholder="Ej: 35"
                          value={bicepIzq}
                          onChange={(e) => setBicepIzq(e.target.value)}
                        />
                      </div>
                      <div className="input-grupo flex-1">
                        <label>Bícep Der. (cm)</label>
                        <input
                          type="number"
                          step="0.1"
                          className="input-control"
                          placeholder="Ej: 35.5"
                          value={bicepDer}
                          onChange={(e) => setBicepDer(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="fila-inputs">
                      <div className="input-grupo flex-1">
                        <label>Muslo Izq. (cm)</label>
                        <input
                          type="number"
                          step="0.1"
                          className="input-control"
                          placeholder="Ej: 60"
                          value={musloIzq}
                          onChange={(e) => setMusloIzq(e.target.value)}
                        />
                      </div>
                      <div className="input-grupo flex-1">
                        <label>Muslo Der. (cm)</label>
                        <input
                          type="number"
                          step="0.1"
                          className="input-control"
                          placeholder="Ej: 60.5"
                          value={musloDer}
                          onChange={(e) => setMusloDer(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}
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
                      <th>Perímetros</th>
                      <th style={{ width: '50px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...registros].reverse().map((reg) => (
                      <tr key={reg.id}>
                        <td>{new Date(`${reg.fecha_registro}T12:00:00`).toLocaleDateString()}</td>
                        <td><strong>{reg.peso} kg</strong></td>
                        <td>{reg.altura} cm</td>
                        <td>{reg.porcentaje_grasa ? `${reg.porcentaje_grasa}%` : '-'}</td>
                        <td>{reg.porcentaje_musculo ? `${reg.porcentaje_musculo}%` : '-'}</td>
                        <td>
                          <div className="tooltip-contenedor">
                            <span className="icono-perimetros">📏 Ver</span>
                            <div className="tooltip-texto">
                              {reg.cintura ? `Cintura: ${reg.cintura} cm` : ''}
                              {reg.pecho ? `\nPecho: ${reg.pecho} cm` : ''}
                              {reg.cadera ? `\nCadera: ${reg.cadera} cm` : ''}
                              {reg.bicep_izq ? `\nBrazo I: ${reg.bicep_izq} cm` : ''}
                              {reg.bicep_der ? `\nBrazo D: ${reg.bicep_der} cm` : ''}
                              {reg.muslo_izq ? `\nPierna I: ${reg.muslo_izq} cm` : ''}
                              {reg.muslo_der ? `\nPierna D: ${reg.muslo_der} cm` : ''}
                              {!reg.cintura && !reg.pecho && !reg.cadera && !reg.bicep_izq && !reg.bicep_der && !reg.muslo_izq && !reg.muslo_der && 'Sin datos registrados'}
                            </div>
                          </div>
                        </td>
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

        .accordion-perimetros {
          margin-top: 15px;
          margin-bottom: 15px;
          border: 1px solid var(--color-borde);
          border-radius: var(--radio-esquina);
          overflow: hidden;
        }

        .btn-accordion {
          width: 100%;
          background: rgba(255, 255, 255, 0.03);
          border: none;
          padding: 12px 15px;
          text-align: left;
          color: #a5b4fc;
          font-weight: 600;
          cursor: pointer;
          font-size: 0.9rem;
          transition: background 0.2s;
        }

        .btn-accordion:hover {
          background: rgba(255, 255, 255, 0.08);
        }

        .contenido-accordion {
          padding: 15px;
          background: rgba(0, 0, 0, 0.2);
          border-top: 1px solid var(--color-borde);
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .fila-inputs {
          display: flex;
          gap: 12px;
        }

        .flex-1 {
          flex: 1;
          min-width: 320px;
        }
        
        .flex-2 {
          flex: 2;
          min-width: 0;
        }

        .tooltip-contenedor {
          position: relative;
          display: inline-block;
          cursor: help;
        }

        .icono-perimetros {
          background: rgba(255,255,255,0.05);
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 0.85rem;
          color: #a5b4fc;
        }

        .tooltip-texto {
          visibility: hidden;
          width: 160px;
          background-color: rgba(13, 17, 28, 0.95);
          color: #fff;
          text-align: left;
          border-radius: 8px;
          padding: 10px;
          position: absolute;
          z-index: 10;
          top: 50%;
          right: 100%;
          transform: translateY(-50%);
          margin-right: 10px;
          opacity: 0;
          transition: opacity 0.3s;
          border: 1px solid var(--color-borde);
          box-shadow: 0 4px 15px rgba(0,0,0,0.5);
          white-space: pre-line;
          font-size: 0.8rem;
          line-height: 1.4;
        }

        .tooltip-contenedor:hover .tooltip-texto {
          visibility: visible;
          opacity: 1;
        }

        @media (max-width: 1200px) {
          .layout-division-biometria {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};
