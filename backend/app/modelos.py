# -*- coding: utf-8 -*-
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Date, ForeignKey, Float, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Usuario(Base):
    """Modelo para representar los usuarios del sistema (Profesores y Alumnos)."""
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    clave_encriptada = Column(String, nullable=False)
    nombre_completo = Column(String, nullable=False)
    rol = Column(String, nullable=False)  # Puede ser: 'profesor' o 'alumno'
    fecha_creacion = Column(DateTime, default=datetime.utcnow)

    # Relaciones
    perfil_alumno = relationship("PerfilAlumno", back_populates="usuario", uselist=False, foreign_keys="PerfilAlumno.id", cascade="all, delete-orphan")
    alumnos_asignados = relationship("PerfilAlumno", back_populates="profesor", foreign_keys="PerfilAlumno.profesor_id")
    rutinas_alumno = relationship("Rutina", back_populates="alumno", foreign_keys="Rutina.alumno_id")
    rutinas_creadas = relationship("Rutina", back_populates="profesor", foreign_keys="Rutina.profesor_id")
    sesiones_entrenamiento = relationship("SesionEntrenamiento", back_populates="alumno")
    registros_biometricos = relationship("RegistroBiometrico", back_populates="alumno")


class PerfilAlumno(Base):
    """Modelo para almacenar los detalles adicionales de un alumno, incluyendo historial de salud."""
    __tablename__ = "perfiles_alumnos"

    id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), primary_key=True)
    fecha_nacimiento = Column(Date, nullable=True)
    genero = Column(String, nullable=True)
    telefono = Column(String, nullable=True)
    contacto_emergencia = Column(String, nullable=True)
    objetivos_iniciales = Column(Text, nullable=True)
    historial_salud = Column(Text, nullable=True)  # Detalles médicos, lesiones, patologías
    profesor_id = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)

    # Relaciones
    usuario = relationship("Usuario", back_populates="perfil_alumno", foreign_keys=[id])
    profesor = relationship("Usuario", back_populates="alumnos_asignados", foreign_keys=[profesor_id])


class Equipamiento(Base):
    """Modelo para el catálogo de equipamientos del gimnasio."""
    __tablename__ = "equipamientos"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, unique=True, index=True, nullable=False)
    descripcion = Column(Text, nullable=True)
    disponible = Column(Boolean, default=True)

    # Relaciones
    ejercicios = relationship("Ejercicio", back_populates="equipamiento")


class Ejercicio(Base):
    """Modelo para el catálogo centralizado de ejercicios."""
    __tablename__ = "ejercicios"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, unique=True, index=True, nullable=False)
    descripcion = Column(Text, nullable=True)
    grupo_muscular = Column(String, nullable=False)  # Pecho, Espalda, Piernas, etc.
    video_url = Column(String, nullable=True)
    equipamiento_id = Column(Integer, ForeignKey("equipamientos.id", ondelete="SET NULL"), nullable=True)
    activo = Column(Boolean, default=True)  # Baja lógica: False = inactivo pero sin borrar historial

    # Relaciones
    equipamiento = relationship("Equipamiento", back_populates="ejercicios")
    rutina_ejercicios = relationship("EjercicioRutina", back_populates="ejercicio")
    series_entrenamiento = relationship("SerieEntrenamiento", back_populates="ejercicio")


class Rutina(Base):
    """Modelo que representa una rutina de entrenamiento creada por un profesor para un alumno."""
    __tablename__ = "rutinas"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)  # Ej: 'Hipertrofia - Fuerza Básica'
    descripcion = Column(Text, nullable=True)
    alumno_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    profesor_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    activo = Column(Boolean, default=True)
    fecha_creacion = Column(DateTime, default=datetime.utcnow)

    # Relaciones
    alumno = relationship("Usuario", back_populates="rutinas_alumno", foreign_keys=[alumno_id])
    profesor = relationship("Usuario", back_populates="rutinas_creadas", foreign_keys=[profesor_id])
    dias = relationship("DiaRutina", back_populates="rutina", cascade="all, delete-orphan", order_by="DiaRutina.orden")
    sesiones = relationship("SesionEntrenamiento", back_populates="rutina")


class DiaRutina(Base):
    """Modelo que representa un día específico dentro de una rutina (ej: Lunes o Día A: Empuje)."""
    __tablename__ = "dias_rutina"

    id = Column(Integer, primary_key=True, index=True)
    rutina_id = Column(Integer, ForeignKey("rutinas.id", ondelete="CASCADE"), nullable=False)
    nombre_dia = Column(String, nullable=False)  # Ej: 'Día 1: Empuje', 'Lunes'
    orden = Column(Integer, nullable=False)  # Orden de ejecución

    # Relaciones
    rutina = relationship("Rutina", back_populates="dias")
    ejercicios_rutina = relationship("EjercicioRutina", back_populates="dia_rutina", cascade="all, delete-orphan", order_by="EjercicioRutina.orden")
    sesiones = relationship("SesionEntrenamiento", back_populates="dia_rutina")


class EjercicioRutina(Base):
    """Modelo de asociación técnica entre un ejercicio y un día de rutina con sus parámetros."""
    __tablename__ = "ejercicios_rutina"

    id = Column(Integer, primary_key=True, index=True)
    dia_rutina_id = Column(Integer, ForeignKey("dias_rutina.id", ondelete="CASCADE"), nullable=False)
    ejercicio_id = Column(Integer, ForeignKey("ejercicios.id", ondelete="CASCADE"), nullable=False)
    series = Column(Integer, nullable=False)  # Número de series planificadas (ej: 4)
    repeticiones = Column(String, nullable=False)  # Rango de repeticiones (ej: '8-12' o '10')
    carga_objetivo = Column(String, nullable=False)  # Carga objetivo (ej: '70% 1RM', '20kg', 'RPE 8')
    descanso_segundos = Column(Integer, default=90)  # Tiempo de descanso sugerido
    orden = Column(Integer, nullable=False)  # Orden del ejercicio dentro del día

    # Relaciones
    dia_rutina = relationship("DiaRutina", back_populates="ejercicios_rutina")
    ejercicio = relationship("Ejercicio", back_populates="rutina_ejercicios")


class SesionEntrenamiento(Base):
    """Modelo para registrar una sesión de entrenamiento ejecutada en tiempo real por el alumno."""
    __tablename__ = "sesiones_entrenamiento"

    id = Column(Integer, primary_key=True, index=True)
    alumno_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    rutina_id = Column(Integer, ForeignKey("rutinas.id", ondelete="SET NULL"), nullable=True)
    dia_rutina_id = Column(Integer, ForeignKey("dias_rutina.id", ondelete="SET NULL"), nullable=True)
    fecha_inicio = Column(DateTime, default=datetime.utcnow)
    fecha_fin = Column(DateTime, nullable=True)
    notas = Column(Text, nullable=True)  # Observaciones de la sesión

    # Relaciones
    alumno = relationship("Usuario", back_populates="sesiones_entrenamiento")
    rutina = relationship("Rutina", back_populates="sesiones")
    dia_rutina = relationship("DiaRutina", back_populates="sesiones")
    series_completadas = relationship("SerieEntrenamiento", back_populates="sesion", cascade="all, delete-orphan")


class SerieEntrenamiento(Base):
    """Modelo para registrar los datos reales levantados en cada serie por el alumno."""
    __tablename__ = "series_entrenamiento"

    id = Column(Integer, primary_key=True, index=True)
    sesion_entrenamiento_id = Column(Integer, ForeignKey("sesiones_entrenamiento.id", ondelete="CASCADE"), nullable=False)
    ejercicio_id = Column(Integer, ForeignKey("ejercicios.id", ondelete="CASCADE"), nullable=False)
    numero_serie = Column(Integer, nullable=False)  # Ej: Serie 1, 2, 3, etc.
    repeticiones_completadas = Column(Integer, nullable=False)  # Repeticiones reales logradas
    peso_levantado = Column(Float, nullable=False)  # Carga real utilizada en kg o lbs
    rpe = Column(Float, nullable=True)  # Esfuerzo percibido real (opcional)
    completado_en = Column(DateTime, default=datetime.utcnow)

    # Relaciones
    sesion = relationship("SesionEntrenamiento", back_populates="series_completadas")
    ejercicio = relationship("Ejercicio", back_populates="series_entrenamiento")


class RegistroBiometrico(Base):
    """Modelo para registrar el progreso físico y las medidas corporales del alumno."""
    __tablename__ = "registros_biometricos"

    id = Column(Integer, primary_key=True, index=True)
    alumno_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    fecha_registro = Column(Date, default=datetime.utcnow().date)
    
    # Composición corporal básica
    peso = Column(Float, nullable=False)  # en kg
    altura = Column(Float, nullable=False)  # en cm
    porcentaje_grasa = Column(Float, nullable=True)
    porcentaje_musculo = Column(Float, nullable=True)

    # Perímetros corporales (antropometría en cm)
    pecho = Column(Float, nullable=True)
    cintura = Column(Float, nullable=True)
    cadera = Column(Float, nullable=True)
    bicep_izq = Column(Float, nullable=True)
    bicep_der = Column(Float, nullable=True)
    muslo_izq = Column(Float, nullable=True)
    muslo_der = Column(Float, nullable=True)

    # Relaciones
    alumno = relationship("Usuario", back_populates="registros_biometricos")
