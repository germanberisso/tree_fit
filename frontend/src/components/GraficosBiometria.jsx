// Componente de gráficos interactivos usando SVG nativo para asegurar adaptabilidad y estilo premium
import React, { useState } from 'react';

export const GraficosBiometria = ({ registros }) => {
  const [metricaSeleccionada, setMetricaSeleccionada] = useState('peso');

  if (!registros || registros.length === 0) {
    return (
      <div className="sin-datos-grafico">
        <p>No hay suficientes datos registrados para trazar la evolución biométrica.</p>
      </div>
    );
  }

  // Mapear los nombres amigables de las métricas
  const metricas = [
    { id: 'peso', etiqueta: 'Peso (kg)', etiquetaCorta: 'Peso', color: '#6366f1' },
    { id: 'altura', etiqueta: 'Altura (cm)', etiquetaCorta: 'Altura', color: '#8b5cf6' },
    { id: 'porcentaje_grasa', etiqueta: 'Grasa (%)', etiquetaCorta: 'Grasa', color: '#f59e0b' },
    { id: 'porcentaje_musculo', etiqueta: 'Músculo (%)', etiquetaCorta: 'Músculo', color: '#10b981' },
    { id: 'cintura', etiqueta: 'Cintura (cm)', etiquetaCorta: 'Cintura', color: '#ef4444' },
    { id: 'pecho', etiqueta: 'Pecho (cm)', etiquetaCorta: 'Pecho', color: '#ec4899' },
    { id: 'cadera', etiqueta: 'Cadera (cm)', etiquetaCorta: 'Cadera', color: '#0ea5e9' },
    { id: 'bicep_izq', etiqueta: 'Bícep Izq (cm)', etiquetaCorta: 'Brazo I.', color: '#84cc16' },
    { id: 'bicep_der', etiqueta: 'Bícep Der (cm)', etiquetaCorta: 'Brazo D.', color: '#14b8a6' },
    { id: 'muslo_izq', etiqueta: 'Muslo Izq (cm)', etiquetaCorta: 'Pierna I.', color: '#eab308' },
    { id: 'muslo_der', etiqueta: 'Muslo Der (cm)', etiquetaCorta: 'Pierna D.', color: '#f97316' }
  ];

  // Filtrar los registros que tengan la métrica seleccionada válida
  const datosValidos = registros
    .filter(r => r[metricaSeleccionada] !== undefined && r[metricaSeleccionada] !== null)
    .map(r => ({
      fecha: new Date(`${r.fecha_registro}T12:00:00`).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
      valor: r[metricaSeleccionada]
    }));



  const metricaActualObj = metricas.find(m => m.id === metricaSeleccionada);
  const colorLinea = metricaActualObj ? metricaActualObj.color : '#6366f1';

  // Dimensiones del SVG
  const svgAncho = 600;
  const svgAlto = 240;
  const paddingX = 50;
  const paddingY = 30;

  // Encontrar valores min y max para escalar el gráfico
  const valores = datosValidos.map(d => d.valor);
  const valorMax = Math.max(...valores);
  const valorMin = Math.min(...valores);
  const rango = valorMax - valorMin === 0 ? 10 : valorMax - valorMin;

  // Ajustes de márgenes superior/inferior para el gráfico
  const maxGrafico = valorMax + rango * 0.15;
  const minGrafico = Math.max(0, valorMin - rango * 0.15);
  const rangoGrafico = maxGrafico - minGrafico;

  // Mapeo de coordenadas
  const mapearX = (index) => {
    if (datosValidos.length <= 1) return svgAncho / 2;
    return paddingX + (index / (datosValidos.length - 1)) * (svgAncho - paddingX * 2);
  };

  const mapearY = (valor) => {
    return svgAlto - paddingY - ((valor - minGrafico) / rangoGrafico) * (svgAlto - paddingY * 2);
  };

  // Construir la cadena de puntos para la línea de trazado
  let dPath = '';
  datosValidos.forEach((d, index) => {
    const x = mapearX(index);
    const y = mapearY(d.valor);
    if (index === 0) {
      dPath += `M ${x} ${y}`;
    } else {
      dPath += ` L ${x} ${y}`;
    }
  });

  // Crear trazado de área (sombra abajo de la línea)
  let dAreaPath = '';
  if (datosValidos.length > 0) {
    const xInicio = mapearX(0);
    const xFin = mapearX(datosValidos.length - 1);
    const yCero = svgAlto - paddingY;
    dAreaPath = `${dPath} L ${xFin} ${yCero} L ${xInicio} ${yCero} Z`;
  }

  return (
    <div className="grafico-biometrico-tarjeta">
      <div className="grafico-cabecera">
        <h4>Evolución Biométrica</h4>
        <div className="selectores-metrica">
          {metricas.map(m => (
            <button
              key={m.id}
              onClick={() => setMetricaSeleccionada(m.id)}
              className={`btn-metrica ${metricaSeleccionada === m.id ? 'activo' : ''}`}
              style={{ '--color-accent': m.color }}
            >
              {m.etiquetaCorta || m.etiqueta.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      <div className="svg-contenedor">
        <svg viewBox={`0 0 ${svgAncho} ${svgAlto}`} width="100%" height="100%">
          <defs>
            {/* Gradiente lineal para el sombreado de área */}
            <linearGradient id={`gradiente-${metricaSeleccionada}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colorLinea} stopOpacity="0.3" />
              <stop offset="100%" stopColor={colorLinea} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Líneas horizontales de guía (cuadrícula) */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
            const valorGuia = minGrafico + ratio * rangoGrafico;
            const y = mapearY(valorGuia);
            return (
              <g key={idx}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={svgAncho - paddingX}
                  y2={y}
                  stroke="rgba(255, 255, 255, 0.05)"
                  strokeDasharray="4 4"
                />
                <text
                  x={paddingX - 10}
                  y={y + 4}
                  fill="var(--color-texto-secundario)"
                  fontSize="10"
                  textAnchor="end"
                >
                  {valorGuia.toFixed(1)}
                </text>
              </g>
            );
          })}

          {/* Eje X Etiquetas de Fechas */}
          {datosValidos.map((d, index) => {
            // Mostrar etiquetas espaciadas si hay demasiadas
            const mostrarEtiqueta = 
              datosValidos.length < 8 || 
              index === 0 || 
              index === datosValidos.length - 1 || 
              index === Math.floor(datosValidos.length / 2);
              
            if (!mostrarEtiqueta) return null;

            const x = mapearX(index);
            return (
              <text
                key={index}
                x={x}
                y={svgAlto - paddingY + 18}
                fill="var(--color-texto-secundario)"
                fontSize="10"
                textAnchor="middle"
              >
                {d.fecha}
              </text>
            );
          })}

          {/* Área sombreada */}
          {datosValidos.length > 1 && (
            <path
              d={dAreaPath}
              fill={`url(#gradiente-${metricaSeleccionada})`}
            />
          )}

          {/* Línea del Trazado */}
          {datosValidos.length > 1 && (
            <path
              d={dPath}
              fill="none"
              stroke={colorLinea}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Puntos y Tooltips */}
          {datosValidos.map((d, index) => {
            const x = mapearX(index);
            const y = mapearY(d.valor);
            return (
              <g key={index} className="punto-grafico">
                <circle
                  cx={x}
                  cy={y}
                  r="5"
                  fill="var(--color-fondo)"
                  stroke={colorLinea}
                  strokeWidth="2.5"
                />
                {/* Etiqueta de valor encima del punto */}
                <text
                  x={x}
                  y={y - 10}
                  fill="var(--color-texto-principal)"
                  fontSize="10"
                  fontWeight="600"
                  textAnchor="middle"
                  className="texto-valor-punto"
                >
                  {d.valor}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <style>{`
        .grafico-biometrico-tarjeta {
          margin-top: 15px;
          background: rgba(13, 17, 28, 0.4);
          border: 1px solid var(--color-borde);
          border-radius: var(--radio-esquina);
          padding: 20px;
        }
        .grafico-cabecera {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 10px;
        }
        .selectores-metrica {
          display: flex;
          gap: 6px;
          overflow-x: auto;
          width: 100%;
          padding-bottom: 5px;
        }
        .selectores-metrica::-webkit-scrollbar {
          height: 4px;
        }
        .selectores-metrica::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1);
          border-radius: 4px;
        }
        .btn-metrica {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--color-borde);
          color: var(--color-texto-secundario);
          padding: 6px 12px;
          border-radius: 20px;
          cursor: pointer;
          font-size: 0.8rem;
          font-weight: 600;
          transition: all 0.2s ease;
          flex-shrink: 0;
          white-space: nowrap;
        }
        .btn-metrica:hover {
          color: var(--color-texto-principal);
          background: rgba(255, 255, 255, 0.08);
        }
        .btn-metrica.activo {
          background: var(--color-accent);
          color: white;
          border-color: transparent;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        }
        .svg-contenedor {
          width: 100%;
          position: relative;
        }
        .sin-datos-grafico {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px;
          background: rgba(13, 17, 28, 0.4);
          border: 1px dashed var(--color-borde);
          border-radius: var(--radio-esquina);
          color: var(--color-texto-secundario);
          text-align: center;
          gap: 15px;
        }
        .punto-grafico:hover circle {
          r: 7;
          fill: white;
        }
        .texto-valor-punto {
          opacity: 0;
          transition: opacity 0.2s ease;
          pointer-events: none;
        }
        .punto-grafico:hover .texto-valor-punto {
          opacity: 1;
        }
      `}</style>
    </div>
  );
};
