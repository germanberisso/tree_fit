-- =========================================================================
-- SCRIPT DE CREACIÓN DE BASE DE DATOS - TREE FIT (POSTGRESQL / SUPABASE)
-- Materia: Práctica Profesionalizante IV - IFTS N° 29
-- Grupo 10: Rodríguez, Germán; Dualibe, Juan; Gómez, Rocío; Weibel, Nicolás; Gasbarro, Juan Manuel.
-- =========================================================================

-- 1. Tabla: usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    clave_encriptada VARCHAR(255) NOT NULL,
    nombre_completo VARCHAR(255) NOT NULL,
    rol VARCHAR(50) NOT NULL, -- 'profesor' o 'alumno'
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);

-- 2. Tabla: perfiles_alumnos
CREATE TABLE IF NOT EXISTS perfiles_alumnos (
    id INTEGER PRIMARY KEY,
    fecha_nacimiento DATE,
    genero VARCHAR(50),
    telefono VARCHAR(50),
    contacto_emergencia VARCHAR(255),
    objetivos_iniciales TEXT,
    historial_salud TEXT, -- Detalles médicos, lesiones, patologías
    profesor_id INTEGER,
    CONSTRAINT fk_perfiles_usuarios FOREIGN KEY (id) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT fk_perfiles_profesor FOREIGN KEY (profesor_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- 3. Tabla: equipamientos (Catálogo de recursos del gimnasio - RF8)
CREATE TABLE IF NOT EXISTS equipamientos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL UNIQUE,
    descripcion TEXT,
    disponible BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_equipamientos_nombre ON equipamientos(nombre);

-- 4. Tabla: ejercicios (Catálogo centralizado)
CREATE TABLE IF NOT EXISTS ejercicios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL UNIQUE,
    descripcion TEXT,
    grupo_muscular VARCHAR(100) NOT NULL, -- 'Pecho', 'Espalda', 'Piernas', etc.
    video_url VARCHAR(500),
    equipamiento_id INTEGER,
    activo BOOLEAN DEFAULT TRUE, -- Baja lógica
    CONSTRAINT fk_ejercicios_equipamiento FOREIGN KEY (equipamiento_id) REFERENCES equipamientos(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_ejercicios_nombre ON ejercicios(nombre);

-- 5. Tabla: rutinas
CREATE TABLE IF NOT EXISTS rutinas (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    alumno_id INTEGER NOT NULL,
    profesor_id INTEGER NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_rutinas_alumno FOREIGN KEY (alumno_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT fk_rutinas_profesor FOREIGN KEY (profesor_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- 6. Tabla: dias_rutina
CREATE TABLE IF NOT EXISTS dias_rutina (
    id SERIAL PRIMARY KEY,
    rutina_id INTEGER NOT NULL,
    nombre_dia VARCHAR(100) NOT NULL, -- Ej: 'Día A: Empuje', 'Lunes'
    orden INTEGER NOT NULL,
    CONSTRAINT fk_dias_rutina FOREIGN KEY (rutina_id) REFERENCES rutinas(id) ON DELETE CASCADE
);

-- 7. Tabla: ejercicios_rutina (Asociación con parámetros planificados)
CREATE TABLE IF NOT EXISTS ejercicios_rutina (
    id SERIAL PRIMARY KEY,
    dia_rutina_id INTEGER NOT NULL,
    ejercicio_id INTEGER NOT NULL,
    series INTEGER NOT NULL,
    repeticiones VARCHAR(50) NOT NULL, -- Rango o fijas (Ej: '8-12' o '10')
    carga_objetivo VARCHAR(100) NOT NULL, -- Parámetro de intensidad (Ej: '70% 1RM', 'RPE 8')
    descanso_segundos INTEGER DEFAULT 90,
    orden INTEGER NOT NULL,
    CONSTRAINT fk_ejercicios_rutina_dia FOREIGN KEY (dia_rutina_id) REFERENCES dias_rutina(id) ON DELETE CASCADE,
    CONSTRAINT fk_ejercicios_rutina_ejercicio FOREIGN KEY (ejercicio_id) REFERENCES ejercicios(id) ON DELETE CASCADE
);

-- 8. Tabla: sesiones_entrenamiento (Registro Real-Time)
CREATE TABLE IF NOT EXISTS sesiones_entrenamiento (
    id SERIAL PRIMARY KEY,
    alumno_id INTEGER NOT NULL,
    rutina_id INTEGER,
    dia_rutina_id INTEGER,
    fecha_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_fin TIMESTAMP, -- Nullable mientras la sesión esté activa
    notas TEXT, -- Observaciones cualitativas finales
    CONSTRAINT fk_sesiones_alumno FOREIGN KEY (alumno_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT fk_sesiones_rutina FOREIGN KEY (rutina_id) REFERENCES rutinas(id) ON DELETE SET NULL,
    CONSTRAINT fk_sesiones_dia FOREIGN KEY (dia_rutina_id) REFERENCES dias_rutina(id) ON DELETE SET NULL
);

-- 9. Tabla: series_entrenamiento (Datos reales levantados)
CREATE TABLE IF NOT EXISTS series_entrenamiento (
    id SERIAL PRIMARY KEY,
    sesion_entrenamiento_id INTEGER NOT NULL,
    ejercicio_id INTEGER NOT NULL,
    numero_serie INTEGER NOT NULL,
    repeticiones_completadas INTEGER NOT NULL,
    peso_levantado FLOAT NOT NULL, -- Carga real en kg o lbs
    rpe FLOAT,
    completado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_series_sesion FOREIGN KEY (sesion_entrenamiento_id) REFERENCES sesiones_entrenamiento(id) ON DELETE CASCADE,
    CONSTRAINT fk_series_ejercicio FOREIGN KEY (ejercicio_id) REFERENCES ejercicios(id) ON DELETE CASCADE
);

-- 10. Tabla: registros_biometricos (Antropometría y peso)
CREATE TABLE IF NOT EXISTS registros_biometricos (
    id SERIAL PRIMARY KEY,
    alumno_id INTEGER NOT NULL,
    fecha_registro DATE DEFAULT CURRENT_DATE,
    peso FLOAT NOT NULL,
    altura FLOAT NOT NULL,
    porcentaje_grasa FLOAT,
    porcentaje_musculo FLOAT,
    pecho FLOAT,
    cintura FLOAT,
    cadera FLOAT,
    bicep_izq FLOAT,
    bicep_der FLOAT,
    muslo_izq FLOAT,
    muslo_der FLOAT,
    CONSTRAINT fk_biometria_alumno FOREIGN KEY (alumno_id) REFERENCES usuarios(id) ON DELETE CASCADE
);