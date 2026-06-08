// Componente de navegación responsiva
import React from 'react';
import { useAuth } from '../context/AuthContext';

export const Navegacion = ({ vistaActiva, setVistaActiva }) => {
  const { usuario, logout, esProfesor } = useAuth();

  if (!usuario) return null;

  const itemsNavegacion = esProfesor
    ? [
        { id: 'alumnos', etiqueta: 'Alumnos', icono: '👥' },
        { id: 'ejercicios', etiqueta: 'Ejercicios', icono: '💪' },
      ]
    : [
        { id: 'mi_entrenamiento', etiqueta: 'Entrenar', icono: '⚡' },
        { id: 'historial', etiqueta: 'Historial', icono: '📅' },
        { id: 'biometria', etiqueta: 'Biometría', icono: '📊' },
      ];

  return (
    <>
      {/* Barra lateral para pantallas de Escritorio */}
      <aside className="sidebar-escritorio tarjeta-vidrio">
        <div className="sidebar-cabecera">
          <div className="logo-treefit">
            <span className="logo-icono">🌲</span>
            <span className="logo-texto">Tree<span className="color-resaltado">Fit</span></span>
          </div>
          <p className="usuario-info">
            {usuario.nombre_completo}
            <span className="usuario-rol">{usuario.rol}</span>
            {!esProfesor && (
              <span style={{ fontSize: '0.75rem', marginTop: '2px', opacity: 0.8, fontWeight: 'normal' }}>
                👨‍🏫 Prof: {usuario.perfil_alumno?.profesor?.nombre_completo || 'No asignado'}
              </span>
            )}
          </p>
        </div>

        <nav className="sidebar-menu">
          {itemsNavegacion.map((item) => (
            <button
              key={item.id}
              onClick={() => setVistaActiva(item.id)}
              className={`sidebar-link ${vistaActiva === item.id ? 'activo' : ''}`}
            >
              <span className="link-icono">{item.icono}</span>
              <span className="link-texto">{item.etiqueta}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-pie">
          <button onClick={logout} className="btn btn-secundario boton-logout">
            <span>🚪</span> Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Barra de navegación inferior para dispositivos Móviles */}
      <nav className="mobile-nav tarjeta-vidrio">
        {itemsNavegacion.map((item) => (
          <button
            key={item.id}
            onClick={() => setVistaActiva(item.id)}
            className={`mobile-nav-link ${vistaActiva === item.id ? 'activo' : ''}`}
          >
            <span className="mobile-icono">{item.icono}</span>
            <span className="mobile-texto">{item.etiqueta}</span>
          </button>
        ))}
        <button onClick={logout} className="mobile-nav-link mobile-logout">
          <span className="mobile-icono">🚪</span>
          <span className="mobile-texto">Salir</span>
        </button>
      </nav>

      <style>{`
        /* Estilos CSS locales de Navegación */
        .sidebar-escritorio {
          position: fixed;
          top: 20px;
          left: 20px;
          bottom: 20px;
          width: 260px;
          display: flex;
          flex-direction: column;
          z-index: 100;
          border-radius: var(--radio-esquina);
          padding: 24px 16px;
        }

        .sidebar-cabecera {
          margin-bottom: 30px;
          border-bottom: 1px solid var(--color-borde);
          padding-bottom: 20px;
        }

        .logo-treefit {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
        }

        .logo-icono {
          font-size: 1.8rem;
        }

        .logo-texto {
          font-size: 1.5rem;
          font-weight: 800;
          letter-spacing: -0.03em;
        }

        .color-resaltado {
          color: var(--color-primario);
        }

        .usuario-info {
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--color-texto-principal);
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .usuario-rol {
          font-size: 0.75rem;
          font-weight: 500;
          text-transform: uppercase;
          color: var(--color-primario);
          letter-spacing: 0.05em;
        }

        .sidebar-menu {
          display: flex;
          flex-direction: column;
          gap: 8px;
          flex: 1;
        }

        .sidebar-link {
          background: transparent;
          border: none;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: var(--radio-boton);
          font-weight: 500;
          color: var(--color-texto-secundario);
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: left;
          width: 100%;
        }

        .sidebar-link:hover {
          background: rgba(255, 255, 255, 0.03);
          color: var(--color-texto-principal);
        }

        .sidebar-link.activo {
          background: rgba(99, 102, 241, 0.12);
          color: #a5b4fc;
          border-left: 3px solid var(--color-primario);
        }

        .link-icono {
          font-size: 1.2rem;
        }

        .boton-logout {
          width: 100%;
          padding: 10px;
          font-size: 0.9rem;
        }

        /* Estilos móviles */
        .mobile-nav {
          display: none;
        }

        @media (max-width: 768px) {
          .sidebar-escritorio {
            display: none;
          }

          .mobile-nav {
            display: flex;
            position: fixed;
            bottom: 10px;
            left: 10px;
            right: 10px;
            height: 70px;
            z-index: 100;
            padding: 8px 12px;
            justify-content: space-around;
            align-items: center;
            border-radius: 20px;
            background: rgba(13, 17, 28, 0.85);
          }

          .mobile-nav-link {
            background: transparent;
            border: none;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: var(--color-texto-secundario);
            cursor: pointer;
            transition: all 0.2s ease;
            gap: 2px;
            flex: 1;
          }

          .mobile-icono {
            font-size: 1.3rem;
          }

          .mobile-texto {
            font-size: 0.7rem;
            font-weight: 500;
          }

          .mobile-nav-link.activo {
            color: var(--color-primario);
          }

          .mobile-logout {
            color: var(--color-peligro);
            opacity: 0.8;
          }
        }
      `}</style>
    </>
  );
};
