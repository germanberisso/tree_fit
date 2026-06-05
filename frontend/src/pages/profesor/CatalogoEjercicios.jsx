// Vista del Catálogo de Ejercicios y Equipamiento
import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';

export const CatalogoEjercicios = () => {
  const [ejercicios, setEjercicios] = useState([]);
  const [equipamiento, setEquipamiento] = useState([]);
  const [grupoMuscular, setGrupoMuscular] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);

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

  return (
    <div className="catalogo-seccion animacion-aparicion">
      <div className="seccion-cabecera">
        <h2>Catálogo Central de Ejercicios</h2>
        <p className="descripcion-cabecera">Consulta los ejercicios técnicos del gimnasio y los equipamientos requeridos.</p>
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
            <h3>Movimientos ({ejercicios.length})</h3>
            {ejercicios.length === 0 ? (
              <div className="tarjeta-vidrio sin-ejercicios">
                <p>No se encontraron ejercicios con los criterios seleccionados.</p>
              </div>
            ) : (
              <div className="ejercicios-grilla">
                {ejercicios.map((ej) => (
                  <div key={ej.id} className="tarjeta-vidrio ejercicio-item-tarjeta">
                    <div className="ejercicio-item-cabecera">
                      <h4>{ej.nombre}</h4>
                      <span className="badge badge-primario">{ej.grupo_muscular}</span>
                    </div>
                    <p className="ejercicio-descripcion">{ej.descripcion || 'Sin descripción detallada.'}</p>
                    
                    <div className="ejercicio-item-pie">
                      {ej.equipamiento ? (
                        <span className="equipamiento-etiqueta-recurso">
                          🛠️ Requiere: <strong>{ej.equipamiento.nombre}</strong>
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
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Listado de Equipamiento / Materiales */}
          <div className="equipamiento-inventario flex-1">
            <h3>Equipamiento Disponible</h3>
            <div className="equipamientos-lista">
              {equipamiento.map((eq) => (
                <div key={eq.id} className="tarjeta-vidrio equipamiento-item-tarjeta">
                  <div className="equipamiento-item-cabecera">
                    <strong>{eq.nombre}</strong>
                    <span className={`estado-recurso ${eq.disponible ? 'disponible' : 'fuera-servicio'}`}>
                      {eq.disponible ? 'Disponible' : 'En Reparación'}
                    </span>
                  </div>
                  <p className="equipamiento-desc">{eq.descripcion}</p>
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

        .btn-link-demo {
          color: var(--color-primario);
          font-weight: 600;
        }

        .sin-ejercicios {
          padding: 40px;
          text-align: center;
          color: var(--color-texto-secundario);
        }

        /* Equipamientos */
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
        }

        @media (max-width: 992px) {
          .layout-division-catalogo {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};
