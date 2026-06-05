# -*- coding: utf-8 -*-
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import obtener_db
from app.modelos import Usuario, PerfilAlumno
from app.esquemas import UsuarioCrear, DetalleAlumnoCompleto, PerfilAlumnoCrear, PerfilAlumnoRespuesta
from app.rutas.autenticacion import obtener_usuario_actual
from app.seguridad import obtener_clave_hash

router = APIRouter(prefix="/alumnos", tags=["Gestión de Alumnos"])

@router.get("", response_model=List[DetalleAlumnoCompleto])
def listar_alumnos(
    db: Session = Depends(obtener_db),
    usuario_actual: Usuario = Depends(obtener_usuario_actual)
):
    """Retorna la lista de alumnos asociados al profesor actualmente autenticado."""
    if usuario_actual.rol != "profesor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo los profesores pueden acceder a este recurso."
        )

    # Buscar usuarios de tipo alumno cuyo perfil tenga el profesor_id correspondiente
    alumnos = db.query(Usuario).join(PerfilAlumno, Usuario.id == PerfilAlumno.id)\
        .filter(Usuario.rol == "alumno", PerfilAlumno.profesor_id == usuario_actual.id).all()
        
    return alumnos

@router.post("", response_model=DetalleAlumnoCompleto, status_code=status.HTTP_201_CREATED)
def crear_alumno(
    alumno_in: UsuarioCrear,
    db: Session = Depends(obtener_db),
    usuario_actual: Usuario = Depends(obtener_usuario_actual)
):
    """Permite a un profesor dar de alta un nuevo alumno en su cartera."""
    if usuario_actual.rol != "profesor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo los profesores pueden crear perfiles de alumnos."
        )

    if alumno_in.rol != "alumno":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El rol para este endpoint debe ser obligatoriamente 'alumno'."
        )

    # Verificar si el correo ya existe
    existe = db.query(Usuario).filter(Usuario.email == alumno_in.email).first()
    if existe:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El correo electrónico ya está registrado."
        )

    # Crear el usuario alumno
    nuevo_alumno = Usuario(
        email=alumno_in.email,
        nombre_completo=alumno_in.nombre_completo,
        rol="alumno",
        clave_encriptada=obtener_clave_hash(alumno_in.clave)
    )
    db.add(nuevo_alumno)
    db.commit()
    db.refresh(nuevo_alumno)

    # Crear el perfil del alumno asignándole el profesor_id
    perfil = PerfilAlumno(
        id=nuevo_alumno.id,
        profesor_id=usuario_actual.id
    )
    db.add(perfil)
    db.commit()
    db.refresh(nuevo_alumno)

    return nuevo_alumno

@router.get("/{alumno_id}", response_model=DetalleAlumnoCompleto)
def obtener_detalle_alumno(
    alumno_id: int,
    db: Session = Depends(obtener_db),
    usuario_actual: Usuario = Depends(obtener_usuario_actual)
):
    """Obtiene los detalles del perfil de un alumno específico. Valida que pertenezca al profesor o sea el mismo alumno."""
    alumno = db.query(Usuario).filter(Usuario.id == alumno_id, Usuario.rol == "alumno").first()
    if not alumno:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alumno no encontrado."
        )

    # Validación de seguridad:
    # 1. El propio alumno puede ver su perfil.
    # 2. El profesor del alumno puede ver su perfil.
    es_su_profesor = alumno.perfil_alumno and alumno.perfil_alumno.profesor_id == usuario_actual.id
    if usuario_actual.id != alumno_id and not es_su_profesor:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene permisos para ver este perfil."
        )

    return alumno

@router.put("/{alumno_id}", response_model=PerfilAlumnoRespuesta)
def modificar_perfil_alumno(
    alumno_id: int,
    perfil_in: PerfilAlumnoCrear,
    db: Session = Depends(obtener_db),
    usuario_actual: Usuario = Depends(obtener_usuario_actual)
):
    """Modifica el historial de salud, objetivos y datos físicos de un alumno."""
    alumno = db.query(Usuario).filter(Usuario.id == alumno_id, Usuario.rol == "alumno").first()
    if not alumno:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alumno no encontrado."
        )

    es_su_profesor = alumno.perfil_alumno and alumno.perfil_alumno.profesor_id == usuario_actual.id
    if usuario_actual.id != alumno_id and not es_su_profesor:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene permisos para modificar este perfil."
        )

    # Actualizar campos del perfil
    perfil = alumno.perfil_alumno
    if not perfil:
        perfil = PerfilAlumno(id=alumno.id)
        db.add(perfil)

    perfil.fecha_nacimiento = perfil_in.fecha_nacimiento
    perfil.genero = perfil_in.genero
    perfil.telefono = perfil_in.telefono
    perfil.contacto_emergencia = perfil_in.contacto_emergencia
    perfil.objetivos_iniciales = perfil_in.objetivos_iniciales
    perfil.historial_salud = perfil_in.historial_salud

    db.commit()
    db.refresh(perfil)
    return perfil

@router.delete("/{alumno_id}", status_code=status.HTTP_200_OK)
def dar_de_baja_alumno(
    alumno_id: int,
    db: Session = Depends(obtener_db),
    usuario_actual: Usuario = Depends(obtener_usuario_actual)
):
    """Elimina la vinculación del alumno con el profesor o borra el perfil del alumno (baja)."""
    if usuario_actual.rol != "profesor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo los profesores pueden realizar la baja de alumnos."
        )

    alumno = db.query(Usuario).filter(Usuario.id == alumno_id, Usuario.rol == "alumno").first()
    if not alumno:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alumno no encontrado."
        )

    perfil = alumno.perfil_alumno
    if not perfil or perfil.profesor_id != usuario_actual.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Este alumno no pertenece a su cartera de clientes."
        )

    # Realizar la baja completa del usuario alumno (para mantener la cartera limpia)
    db.delete(alumno)
    db.commit()

    return {"mensaje": "El alumno ha sido dado de baja correctamente."}
