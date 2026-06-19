# -*- coding: utf-8 -*-
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from app.database import obtener_db
from app.modelos import Usuario, PerfilAlumno, Rutina, SesionEntrenamiento, SerieEntrenamiento, RegistroBiometrico
from app.rutas.autenticacion import obtener_usuario_actual

router = APIRouter(prefix="/estadisticas", tags=["Estadísticas y KPIs"])


@router.get("/profesor")
async def obtener_estadisticas_profesor(
    db: Session = Depends(obtener_db),
    usuario_actual: Usuario = Depends(obtener_usuario_actual)
):
    """Retorna un panel de métricas y KPIs del profesor autenticado."""
    if usuario_actual.rol != "profesor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo los profesores pueden acceder a las estadísticas."
        )

    # IDs de alumnos del profesor
    alumnos_ids = [
        pa.id for pa in db.query(PerfilAlumno).filter(
            PerfilAlumno.profesor_id == usuario_actual.id
        ).all()
    ]
    total_alumnos = len(alumnos_ids)

    # Rutinas activas creadas por este profesor
    rutinas_activas = db.query(Rutina).filter(
        Rutina.profesor_id == usuario_actual.id,
        Rutina.activo == True
    ).count()

    # Total de entrenamientos completados por sus alumnos
    total_entrenamientos = 0
    entrenamientos_semana = 0
    volumen_total = 0
    alumno_mas_activo_nombre = None
    alumno_mas_activo_sesiones = 0

    if alumnos_ids:
        total_entrenamientos = db.query(SesionEntrenamiento).filter(
            SesionEntrenamiento.alumno_id.in_(alumnos_ids),
            SesionEntrenamiento.fecha_fin != None
        ).count()

        # Entrenamientos de esta semana (últimos 7 días)
        hace_7_dias = datetime.utcnow() - timedelta(days=7)
        entrenamientos_semana = db.query(SesionEntrenamiento).filter(
            SesionEntrenamiento.alumno_id.in_(alumnos_ids),
            SesionEntrenamiento.fecha_fin != None,
            SesionEntrenamiento.fecha_inicio >= hace_7_dias
        ).count()

        # Volumen total levantado por todos los alumnos (sum of reps * weight)
        resultado_volumen = db.query(
            func.sum(SerieEntrenamiento.repeticiones_completadas * SerieEntrenamiento.peso_levantado)
        ).join(SesionEntrenamiento).filter(
            SesionEntrenamiento.alumno_id.in_(alumnos_ids)
        ).scalar()
        volumen_total = round(resultado_volumen or 0, 1)

        # Alumno más activo (más sesiones completadas)
        resultado_activo = db.query(
            SesionEntrenamiento.alumno_id,
            func.count(SesionEntrenamiento.id).label("total")
        ).filter(
            SesionEntrenamiento.alumno_id.in_(alumnos_ids),
            SesionEntrenamiento.fecha_fin != None
        ).group_by(SesionEntrenamiento.alumno_id).order_by(
            func.count(SesionEntrenamiento.id).desc()
        ).first()

        if resultado_activo:
            alumno_activo = db.query(Usuario).filter(Usuario.id == resultado_activo[0]).first()
            if alumno_activo:
                alumno_mas_activo_nombre = alumno_activo.nombre_completo
                alumno_mas_activo_sesiones = resultado_activo[1]

    # Registros biométricos totales
    total_registros_biometricos = 0
    if alumnos_ids:
        total_registros_biometricos = db.query(RegistroBiometrico).filter(
            RegistroBiometrico.alumno_id.in_(alumnos_ids)
        ).count()

    return {
        "total_alumnos": total_alumnos,
        "rutinas_activas": rutinas_activas,
        "total_entrenamientos": total_entrenamientos,
        "entrenamientos_semana": entrenamientos_semana,
        "volumen_total_kg": volumen_total,
        "total_registros_biometricos": total_registros_biometricos,
        "alumno_mas_activo": {
            "nombre": alumno_mas_activo_nombre,
            "sesiones": alumno_mas_activo_sesiones
        } if alumno_mas_activo_nombre else None
    }
