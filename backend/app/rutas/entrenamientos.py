# -*- coding: utf-8 -*-
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app.database import obtener_db
from app.modelos import Usuario, SesionEntrenamiento, SerieEntrenamiento, Rutina, DiaRutina, Ejercicio
from app.esquemas import SesionEntrenamientoCrear, SesionEntrenamientoFinalizar, SesionEntrenamientoRespuesta
from app.rutas.autenticacion import obtener_usuario_actual
from app.rutas.validaciones import calcular_estado_ejercicio_rutina

router = APIRouter(prefix="/entrenamientos", tags=["Mi Entrenamiento (Registro Real-Time)"])

@router.get("/activo", response_model=SesionEntrenamientoRespuesta)
async def obtener_entrenamiento_activo(
    db: Session = Depends(obtener_db),
    usuario_actual: Usuario = Depends(obtener_usuario_actual)
):
    """Retorna la sesión de entrenamiento actualmente activa (sin fecha de fin) para el alumno autenticado."""
    if usuario_actual.rol != "alumno":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo los alumnos pueden tener sesiones de entrenamiento activas."
        )

    sesion = db.query(SesionEntrenamiento).filter(
        SesionEntrenamiento.alumno_id == usuario_actual.id,
        SesionEntrenamiento.fecha_fin == None
    ).first()

    if not sesion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No hay ninguna sesión de entrenamiento activa."
        )

    return sesion

@router.post("/iniciar", response_model=SesionEntrenamientoRespuesta, status_code=status.HTTP_201_CREATED)
async def iniciar_entrenamiento(
    sesion_in: SesionEntrenamientoCrear,
    db: Session = Depends(obtener_db),
    usuario_actual: Usuario = Depends(obtener_usuario_actual)
):
    """Inicia una nueva sesión de entrenamiento en tiempo real."""
    if usuario_actual.rol != "alumno":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo los alumnos pueden iniciar sesiones de entrenamiento."
        )

    # Verificar si ya tiene una sesión activa
    sesion_activa = db.query(SesionEntrenamiento).filter(
        SesionEntrenamiento.alumno_id == usuario_actual.id,
        SesionEntrenamiento.fecha_fin == None
    ).first()

    if sesion_activa:
        return sesion_activa

    # Crear la nueva sesión
    nueva_sesion = SesionEntrenamiento(
        alumno_id=usuario_actual.id,
        rutina_id=sesion_in.rutina_id,
        dia_rutina_id=sesion_in.dia_rutina_id,
        fecha_inicio=datetime.utcnow()
    )
    
    db.add(nueva_sesion)
    db.commit()
    db.refresh(nueva_sesion)
    return nueva_sesion

@router.post("/finalizar/{sesion_id}", response_model=SesionEntrenamientoRespuesta)
async def finalizar_entrenamiento(
    sesion_id: int,
    finalizar_in: SesionEntrenamientoFinalizar,
    db: Session = Depends(obtener_db),
    usuario_actual: Usuario = Depends(obtener_usuario_actual)
):
    """Finaliza una sesión de entrenamiento activa y registra las series completadas."""
    if usuario_actual.rol != "alumno":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo los alumnos pueden finalizar entrenamientos."
        )

    sesion = db.query(SesionEntrenamiento).filter(
        SesionEntrenamiento.id == sesion_id,
        SesionEntrenamiento.alumno_id == usuario_actual.id
    ).first()

    if not sesion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sesión de entrenamiento no encontrada."
        )

    if sesion.fecha_fin is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Esta sesión de entrenamiento ya ha sido finalizada anteriormente."
        )

    try:
        # Registrar las series completadas
        for serie_data in finalizar_in.series:
            # --- RF8: Validar que el ejercicio sigue habilitado al momento de guardar ---
            ejercicio = db.query(Ejercicio).filter(Ejercicio.id == serie_data.ejercicio_id).first()
            if not ejercicio:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"El ejercicio con ID {serie_data.ejercicio_id} no existe."
                )
            estado = calcular_estado_ejercicio_rutina(ejercicio)
            if not estado["habilitado_actual"]:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"No se puede registrar la serie: {estado['motivo_no_habilitado']}"
                )

            nueva_serie = SerieEntrenamiento(
                sesion_entrenamiento_id=sesion.id,
                ejercicio_id=serie_data.ejercicio_id,
                numero_serie=serie_data.numero_serie,
                repeticiones_completadas=serie_data.repeticiones_completadas,
                peso_levantado=serie_data.peso_levantado,
                rpe=serie_data.rpe,
                completado_en=datetime.utcnow()
            )
            db.add(nueva_serie)

        # Finalizar la sesión
        sesion.fecha_fin = datetime.utcnow()
        sesion.notas = finalizar_in.notas

        db.commit()
        db.refresh(sesion)
        return sesion

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al registrar las series del entrenamiento: {str(e)}"
        )

@router.get("/historial/{alumno_id}", response_model=List[SesionEntrenamientoRespuesta])
async def obtener_historial_entrenamientos(
    alumno_id: int,
    db: Session = Depends(obtener_db),
    usuario_actual: Usuario = Depends(obtener_usuario_actual)
):
    """Retorna el historial de entrenamientos completados por un alumno."""
    if usuario_actual.rol != "profesor" and usuario_actual.id != alumno_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene permiso para ver el historial de este alumno."
        )

    sesiones = db.query(SesionEntrenamiento).filter(
        SesionEntrenamiento.alumno_id == alumno_id,
        SesionEntrenamiento.fecha_fin != None
    ).order_by(SesionEntrenamiento.fecha_inicio.desc()).all()
    
    return sesiones
