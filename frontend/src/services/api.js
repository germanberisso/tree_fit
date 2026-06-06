// Servicio de conexión con la API del Backend (FastAPI)
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
      const mensaje = errorData.detail || 'Ocurrió un error en el servidor.';
      throw new Error(mensaje);
    }

    // Retornar JSON si hay contenido
    if (respuesta.status === 204) return null;
    return await respuesta.json();
  } catch (error) {
    console.error(`Error en API (${endpoint}):`, error);
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
  listarEjercicios: (grupoMuscular = '', busqueda = '') => {
    let query = [];
    if (grupoMuscular) query.push(`grupo_muscular=${encodeURIComponent(grupoMuscular)}`);
    if (busqueda) query.push(`busqueda=${encodeURIComponent(busqueda)}`);
    const queryStr = query.length > 0 ? `?${query.join('&')}` : '';
    return realizarPeticion(`/ejercicios${queryStr}`, { method: 'GET' });
  },

  listarEquipamiento: () => realizarPeticion('/equipamiento', {
    method: 'GET'
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
    method: 'GET'
  }),

  eliminarRutina: (rutinaId) => realizarPeticion(`/rutinas/${rutinaId}`, {
    method: 'DELETE'
  }),

  // Registro de Sesiones en tiempo real ("Mi Entrenamiento")
  obtenerEntrenamientoActivo: () => realizarPeticion('/entrenamientos/activo', {
    method: 'GET'
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
