// Servicio de conexión con la API del Backend (FastAPI)
import toast from 'react-hot-toast';
const URL_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8050/api';

// Helper para obtener el token del almacenamiento local
const obtenerToken = () => localStorage.getItem('tree_fit_token');

// Configuración general de peticiones HTTP
const realizarPeticion = async (endpoint, opciones = {}) => {
  const token = obtenerToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...opciones.headers,
  };

  const configuracion = {
    ...opciones,
    headers,
  };

  try {
    const respuesta = await fetch(`${URL_BASE}${endpoint}`, configuracion);

    // Si la respuesta no es exitosa, arrojar un error con los detalles
    if (!respuesta.ok) {
      const errorData = await respuesta.json().catch(() => ({}));
      // si el error tiene estructura {mensaje, errores[]}, propagarlo tal cual
      if (errorData.detail && typeof errorData.detail === 'object' && errorData.detail.errores) {
        const err = new Error(errorData.detail.mensaje || 'Error de validación.');
        err.erroresValidacion = errorData.detail.errores;
        throw err;
      }
      const mensaje = errorData.detail || 'Ocurrió un error en el servidor.';
      throw new Error(mensaje);
    }

    // Retornar JSON si hay contenido
    if (respuesta.status === 204) return null;
    return await respuesta.json();
  } catch (error) {
    console.error(`Error en API (${endpoint}):`, error);
    // Solo mostrar toast si no es un error de validación estructurado y si no está silenciado
    if (!error.erroresValidacion && !opciones.silencioso) {
      toast.error(error.message || 'Error de conexión con el servidor.');
    }
    throw error;
  }
};

export const api = {
  // Autenticación
  registro: (datos) => realizarPeticion('/auth/registro', {
    method: 'POST',
    body: JSON.stringify(datos)
  }),

  login: (email, clave) => realizarPeticion('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, clave })
  }),

  obtenerPerfil: () => realizarPeticion('/auth/perfil', {
    method: 'GET'
  }),

  // Gestión de Alumnos (solo Profesores)
  listarAlumnos: () => realizarPeticion('/alumnos', {
    method: 'GET'
  }),

  crearAlumno: (datos) => realizarPeticion('/alumnos', {
    method: 'POST',
    body: JSON.stringify(datos)
  }),

  vincularAlumno: (email) => realizarPeticion('/alumnos/vincular', {
    method: 'POST',
    body: JSON.stringify({ email })
  }),

  obtenerDetalleAlumno: (alumnoId) => realizarPeticion(`/alumnos/${alumnoId}`, {
    method: 'GET'
  }),

  modificarPerfilAlumno: (alumnoId, datosPerfil) => realizarPeticion(`/alumnos/${alumnoId}`, {
    method: 'PUT',
    body: JSON.stringify(datosPerfil)
  }),

  darDeBajaAlumno: (alumnoId) => realizarPeticion(`/alumnos/${alumnoId}`, {
    method: 'DELETE'
  }),

  // Ejercicios y Equipamiento
  listarEjercicios: (grupoMuscular = '', busqueda = '', soloActivos = false) => {
    let query = [];
    if (grupoMuscular) query.push(`grupo_muscular=${encodeURIComponent(grupoMuscular)}`);
    if (busqueda) query.push(`busqueda=${encodeURIComponent(busqueda)}`);
    if (soloActivos) query.push(`solo_activos=true`);
    const queryStr = query.length > 0 ? `?${query.join('&')}` : '';
    return realizarPeticion(`/ejercicios${queryStr}`, { method: 'GET' });
  },

  listarEquipamiento: () => realizarPeticion('/equipamiento', {
    method: 'GET'
  }),

  crearEquipamiento: (datos) => realizarPeticion('/equipamiento', {
    method: 'POST',
    body: JSON.stringify(datos)
  }),

  editarEquipamiento: (id, datos) => realizarPeticion(`/equipamiento/${id}`, {
    method: 'PUT',
    body: JSON.stringify(datos)
  }),

  cambiarDisponibilidadEquipamiento: (id, disponible) =>
    realizarPeticion(`/equipamiento/${id}/disponibilidad?disponible=${disponible}`, {
      method: 'PATCH'
    }),

  crearEjercicio: (datos) => realizarPeticion('/ejercicios', {
    method: 'POST',
    body: JSON.stringify(datos)
  }),

  darDeBajaEjercicio: (id) => realizarPeticion(`/ejercicios/${id}`, {
    method: 'DELETE'
  }),

  // Rutinas
  crearRutina: (datosRutina) => realizarPeticion('/rutinas', {
    method: 'POST',
    body: JSON.stringify(datosRutina)
  }),

  obtenerRutinasAlumno: (alumnoId) => realizarPeticion(`/rutinas/alumno/${alumnoId}`, {
    method: 'GET'
  }),

  obtenerRutinaActiva: (alumnoId) => realizarPeticion(`/rutinas/activa/${alumnoId}`, {
    method: 'GET',
    silencioso: true
  }),

  eliminarRutina: (rutinaId) => realizarPeticion(`/rutinas/${rutinaId}`, {
    method: 'DELETE'
  }),

  // Registro de Sesiones en tiempo real ("Mi Entrenamiento")
  obtenerEntrenamientoActivo: () => realizarPeticion('/entrenamientos/activo', {
    method: 'GET',
    silencioso: true
  }),

  iniciarEntrenamiento: (rutinaId = null, diaRutinaId = null) => realizarPeticion('/entrenamientos/iniciar', {
    method: 'POST',
    body: JSON.stringify({ rutina_id: rutinaId, dia_rutina_id: diaRutinaId })
  }),

  finalizarEntrenamiento: (sesionId, notas, series) => realizarPeticion(`/entrenamientos/finalizar/${sesionId}`, {
    method: 'POST',
    body: JSON.stringify({ notas, series })
  }),

  obtenerHistorialEntrenamientos: (alumnoId) => realizarPeticion(`/entrenamientos/historial/${alumnoId}`, {
    method: 'GET'
  }),

  // Seguimiento Biométrico
  registrarBiometria: (alumnoId, datosBiometricos) => realizarPeticion(`/biometria/${alumnoId}`, {
    method: 'POST',
    body: JSON.stringify(datosBiometricos)
  }),

  obtenerBiometriaAlumno: (alumnoId) => realizarPeticion(`/biometria/${alumnoId}`, {
    method: 'GET'
  }),

  eliminarRegistroBiometrico: (alumnoId, registroId) => realizarPeticion(`/biometria/${alumnoId}/${registroId}`, {
    method: 'DELETE'
  })
};
