// Vista Principal Dashboard (Adaptable por Rol)
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navegacion } from '../components/Navegacion';

// Subvistas de Profesores
import { ListaAlumnos } from './profesor/ListaAlumnos';
import { DetalleAlumno } from './profesor/DetalleAlumno';
import { CatalogoEjercicios } from './profesor/CatalogoEjercicios';
import { EstadisticasProfesor } from './profesor/EstadisticasProfesor';

// Subvistas de Alumnos
import { EntrenamientoActivo } from './alumno/EntrenamientoActivo';
import { HistorialEntrenamientos } from './alumno/HistorialEntrenamientos';
import { ProgresoBiometrico } from './alumno/ProgresoBiometrico';

export const Dashboard = () => {
  const { usuario, esProfesor, esAlumno } = useAuth();
  
  // Vista activa inicial dependiendo del rol
  const [vistaActiva, setVistaActiva] = useState(esProfesor ? 'alumnos' : 'mi_entrenamiento');
  
  // Alumno seleccionado por el profesor para ver detalles
  const [alumnoSeleccionadoId, setAlumnoSeleccionadoId] = useState(null);

  // Resetear alumno seleccionado si cambia de sección en el menú lateral
  useEffect(() => {
    setAlumnoSeleccionadoId(null);
  }, [vistaActiva]);

  // Renderizar la vista correspondiente para el rol de Profesor
  const renderizarProfesor = () => {
    if (alumnoSeleccionadoId) {
      return (
        <DetalleAlumno
          alumnoId={alumnoSeleccionadoId}
          volver={() => setAlumnoSeleccionadoId(null)}
        />
      );
    }

    switch (vistaActiva) {
      case 'alumnos':
        return <ListaAlumnos seleccionarAlumno={setAlumnoSeleccionadoId} />;
      case 'ejercicios':
        return <CatalogoEjercicios />;
      case 'estadisticas':
        return <EstadisticasProfesor />;
      default:
        return <ListaAlumnos seleccionarAlumno={setAlumnoSeleccionadoId} />;
    }
  };

  // Renderizar la vista correspondiente para el rol de Alumno
  const renderizarAlumno = () => {
    switch (vistaActiva) {
      case 'mi_entrenamiento':
        return <EntrenamientoActivo />;
      case 'historial':
        return <HistorialEntrenamientos />;
      case 'biometria':
        return <ProgresoBiometrico />;
      default:
        return <EntrenamientoActivo />;
    }
  };

  return (
    <div className="dashboard-layout">
      {/* Navegación (Sidebar / Mobile bar) */}
      <Navegacion vistaActiva={vistaActiva} setVistaActiva={setVistaActiva} />

      {/* Contenido principal */}
      <main className="dashboard-contenido">
        {esProfesor ? renderizarProfesor() : renderizarAlumno()}
      </main>

      <style>{`
        /* Diseño de Layout Dashboard */
        .dashboard-layout {
          min-height: 100vh;
          display: flex;
          background-color: var(--color-fondo);
        }

        .dashboard-contenido {
          flex: 1;
          margin-left: 300px; /* Ancho de sidebar (260px) + margen (40px) */
          padding: 40px;
          min-width: 0; /* Evitar desbordes flex en tablas */
        }

        @media (max-width: 768px) {
          .dashboard-layout {
            flex-direction: column;
          }
          
          .dashboard-contenido {
            margin-left: 0;
            padding: 20px;
            padding-bottom: 100px; /* Espacio para no chocar con la barra móvil inferior */
          }
        }
      `}</style>
    </div>
  );
};
