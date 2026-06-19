# -*- coding: utf-8 -*-
from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from datetime import datetime, date

# --- ESQUEMAS DE AUTENTICACIÓN ---

class Token(BaseModel):
    token_acceso: str
    tipo_token: str

class DatosToken(BaseModel):
    email: Optional[str] = None
    id_usuario: Optional[int] = None
    rol: Optional[str] = None


# --- ESQUEMAS DE USUARIO Y PERFIL ---

class UsuarioBase(BaseModel):
    email: EmailStr
    nombre_completo: str
    rol: str = Field(..., description="Debe ser 'profesor' o 'alumno'")

class UsuarioCrear(UsuarioBase):
    clave: str

class VincularAlumno(BaseModel):
    email: EmailStr

class UsuarioRespuesta(BaseModel):
    id: int
    email: EmailStr
    nombre_completo: str
    rol: str
    fecha_creacion: datetime
    perfil_alumno: Optional["PerfilAlumnoRespuesta"] = None

    class Config:
        from_attributes = True

class PerfilAlumnoBase(BaseModel):
    fecha_nacimiento: Optional[date] = None
    genero: Optional[str] = None
    telefono: Optional[str] = None
    contacto_emergencia: Optional[str] = None
    objetivos_iniciales: Optional[str] = None
    historial_salud: Optional[str] = None
    profesor_id: Optional[int] = None

class PerfilAlumnoCrear(BaseModel):
    fecha_nacimiento: Optional[date] = None
    genero: Optional[str] = None
    telefono: Optional[str] = None
    contacto_emergencia: Optional[str] = None
    objetivos_iniciales: Optional[str] = None
    historial_salud: Optional[str] = None

class PerfilAlumnoRespuesta(BaseModel):
    fecha_nacimiento: Optional[date] = None
    genero: Optional[str] = None
    telefono: Optional[str] = None
    contacto_emergencia: Optional[str] = None
    objetivos_iniciales: Optional[str] = None
    historial_salud: Optional[str] = None
    profesor_id: Optional[int] = None
    profesor: Optional[UsuarioRespuesta] = None

    class Config:
        from_attributes = True

class DetalleAlumnoCompleto(BaseModel):
    id: int
    email: EmailStr
    nombre_completo: str
    fecha_creacion: datetime
    perfil_alumno: Optional[PerfilAlumnoRespuesta] = None

    class Config:
        from_attributes = True


# --- ESQUEMAS DE EQUIPAMIENTO Y EJERCICIOS ---

class EquipamientoBase(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    disponible: bool = True

class EquipamientoCrear(EquipamientoBase):
    pass

class EquipamientoActualizar(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    disponible: Optional[bool] = None

class EquipamientoRespuesta(EquipamientoBase):
    id: int

    class Config:
        from_attributes = True


class EjercicioBase(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    grupo_muscular: str
    video_url: Optional[str] = None
    equipamiento_id: Optional[int] = None

class EjercicioCrear(EjercicioBase):
    pass

class EjercicioActualizar(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    grupo_muscular: Optional[str] = None
    video_url: Optional[str] = None
    equipamiento_id: Optional[int] = None
    activo: Optional[bool] = None

class EjercicioRespuesta(EjercicioBase):
    id: int
    activo: bool = True
    equipamiento: Optional[EquipamientoRespuesta] = None

    class Config:
        from_attributes = True


# --- ESQUEMAS DE RUTINAS ---

class EjercicioRutinaBase(BaseModel):
    ejercicio_id: int
    series: int
    repeticiones: str
    carga_objetivo: str
    descanso_segundos: int = 90
    orden: int

class EjercicioRutinaCrear(EjercicioRutinaBase):
    pass

class EjercicioRutinaRespuesta(EjercicioRutinaBase):
    id: int
    dia_rutina_id: int
    ejercicio: Optional[EjercicioRespuesta] = None
    # Campos RF8: estado de habilitación en tiempo real (calculado al consultar)
    habilitado_actual: bool = True
    motivo_no_habilitado: Optional[str] = None

    class Config:
        from_attributes = True


class DiaRutinaBase(BaseModel):
    nombre_dia: str
    orden: int

class DiaRutinaCrear(DiaRutinaBase):
    ejercicios_rutina: List[EjercicioRutinaCrear]

class DiaRutinaRespuesta(DiaRutinaBase):
    id: int
    rutina_id: int
    ejercicios_rutina: List[EjercicioRutinaRespuesta]

    class Config:
        from_attributes = True


class RutinaBase(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    alumno_id: int
    activo: bool = True

class RutinaCrear(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    alumno_id: int
    dias: List[DiaRutinaCrear]

class RutinaRespuesta(RutinaBase):
    id: int
    profesor_id: int
    fecha_creacion: datetime
    dias: List[DiaRutinaRespuesta]

    class Config:
        from_attributes = True


# --- ESQUEMAS DE SESIÓN DE ENTRENAMIENTO ---

class SerieEntrenamientoCrear(BaseModel):
    ejercicio_id: int
    numero_serie: int
    repeticiones_completadas: int
    peso_levantado: float
    rpe: Optional[float] = None

class SerieEntrenamientoRespuesta(BaseModel):
    id: int
    sesion_entrenamiento_id: int
    ejercicio_id: int
    numero_serie: int
    repeticiones_completadas: int
    peso_levantado: float
    rpe: Optional[float] = None
    completado_en: datetime
    ejercicio: Optional[EjercicioRespuesta] = None

    class Config:
        from_attributes = True


class SesionEntrenamientoCrear(BaseModel):
    rutina_id: Optional[int] = None
    dia_rutina_id: Optional[int] = None

class SesionEntrenamientoFinalizar(BaseModel):
    notas: Optional[str] = None
    series: List[SerieEntrenamientoCrear]

class SesionEntrenamientoRespuesta(BaseModel):
    id: int
    alumno_id: int
    rutina_id: Optional[int] = None
    dia_rutina_id: Optional[int] = None
    fecha_inicio: datetime
    fecha_fin: Optional[datetime] = None
    notas: Optional[str] = None
    series_completadas: List[SerieEntrenamientoRespuesta]

    class Config:
        from_attributes = True


# --- ESQUEMAS BIOMÉTRICOS ---

class RegistroBiometricoCrear(BaseModel):
    fecha_registro: Optional[date] = None
    peso: float
    altura: float
    porcentaje_grasa: Optional[float] = None
    porcentaje_musculo: Optional[float] = None
    pecho: Optional[float] = None
    cintura: Optional[float] = None
    cadera: Optional[float] = None
    bicep_izq: Optional[float] = None
    bicep_der: Optional[float] = None
    muslo_izq: Optional[float] = None
    muslo_der: Optional[float] = None

class RegistroBiometricoRespuesta(RegistroBiometricoCrear):
    id: int
    alumno_id: int
    fecha_registro: date

    class Config:
        from_attributes = True
