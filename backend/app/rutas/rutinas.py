# -*- coding: utf-8 -*-
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import obtener_db
from app.modelos import Usuario, Rutina, DiaRutina, EjercicioRutina
from app.esquemas import RutinaCrear, RutinaRespuesta
from app.rutas.autenticacion import obtener_usuario_actual

router = APIRouter(prefix="/rutinas", tags=["Planificación Técnica (Rutinas)"])

@router.post("", response_model=RutinaRespuesta, status_code=status.HTTP_201_CREATED)
def crear_y_asignar_rutina(
    rutina_in: RutinaCrear,
    db: Session = Depends(obtener_db),
    usuario_actual: Usuario = Depends(obtener_usuario_actual)
):
    """Crea una nueva rutina desglosada por días, ejercicios, series, repeticiones y cargas, asignándola a un alumno."""
    if usuario_actual.rol != "profesor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo los profesores pueden crear y asignar rutinas."
        )

    # Verificar que el alumno exista y tenga rol de alumno
    alumno = db.query(Usuario).filter(Usuario.id == rutina_in.alumno_id, Usuario.rol == "alumno").first()
    if not alumno:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El alumno asignado no existe."
        )

    # Desactivar rutinas anteriores del alumno para que esta sea la única activa
    db.query(Rutina).filter(Rutina.alumno_id == rutina_in.alumno_id).update({"activo": False})
    db.commit()

    try:
        # Crear la rutina base
        nueva_rutina = Rutina(
            nombre=rutina_in.nombre,
            descripcion=rutina_in.descripcion,
            alumno_id=rutina_in.alumno_id,
            profesor_id=usuario_actual.id,
            activo=True
        )
        db.add(nueva_rutina)
        db.commit()
        db.refresh(nueva_rutina)

        # Crear los días de la rutina y sus respectivos ejercicios
        for dia_data in rutina_in.dias:
            nuevo_dia = DiaRutina(
                rutina_id=nueva_rutina.id,
                nombre_dia=dia_data.nombre_dia,
                orden=dia_data.orden
            )
            db.add(nuevo_dia)
            db.commit()
            db.refresh(nuevo_dia)

            for ej_data in dia_data.ejercicios_rutina:
                ejercicio_rutina = EjercicioRutina(
                    dia_rutina_id=nuevo_dia.id,
                    ejercicio_id=ej_data.ejercicio_id,
                    series=ej_data.series,
                    repeticiones=ej_data.repeticiones,
                    carga_objetivo=ej_data.carga_objetivo,
                    descanso_segundos=ej_data.descanso_segundos,
                    orden=ej_data.orden
                )
                db.add(ejercicio_rutina)
            
            db.commit()

        # Volver a cargar la rutina completa con relaciones
        db.refresh(nueva_rutina)
        return nueva_rutina

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al guardar la rutina: {str(e)}"
        )

@router.get("/alumno/{alumno_id}", response_model=List[RutinaRespuesta])
def obtener_rutinas_alumno(
    alumno_id: int,
    db: Session = Depends(obtener_db),
    usuario_actual: Usuario = Depends(obtener_usuario_actual)
):
    """Retorna el historial de rutinas de un alumno en particular."""
    # Validación de acceso
    if usuario_actual.rol != "profesor" and usuario_actual.id != alumno_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene permiso para ver las rutinas de este alumno."
        )

    rutinas = db.query(Rutina).filter(Rutina.alumno_id == alumno_id).order_by(Rutina.fecha_creacion.desc()).all()
    return rutinas

@router.get("/activa/{alumno_id}", response_model=RutinaRespuesta)
def obtener_rutina_activa(
    alumno_id: int,
    db: Session = Depends(obtener_db),
    usuario_actual: Usuario = Depends(obtener_usuario_actual)
):
    """Obtiene la rutina activa asignada al alumno."""
    if usuario_actual.rol != "profesor" and usuario_actual.id != alumno_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene permiso para ver esta rutina."
        )

    rutina = db.query(Rutina).filter(Rutina.alumno_id == alumno_id, Rutina.activo == True).first()
    if not rutina:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontró ninguna rutina activa asignada."
        )
    return rutina

@router.delete("/{rutina_id}", status_code=status.HTTP_200_OK)
def eliminar_rutina(
    rutina_id: int,
    db: Session = Depends(obtener_db),
    usuario_actual: Usuario = Depends(obtener_usuario_actual)
):
    """Elimina una rutina y todos sus días y ejercicios asociados."""
    if usuario_actual.rol != "profesor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo los profesores pueden eliminar rutinas."
        )

    rutina = db.query(Rutina).filter(Rutina.id == rutina_id).first()
    if not rutina:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rutina no encontrada."
        )

    db.delete(rutina)
    db.commit()
    return {"mensaje": "La rutina se ha eliminado correctamente."}
