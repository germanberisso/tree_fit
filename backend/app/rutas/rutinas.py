# -*- coding: utf-8 -*-
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import obtener_db
from app.modelos import Usuario, Rutina, DiaRutina, EjercicioRutina, Ejercicio
from app.esquemas import RutinaCrear, RutinaRespuesta
from app.rutas.autenticacion import obtener_usuario_actual
from app.rutas.validaciones import validar_recursos_rutina, calcular_estado_ejercicio_rutina

router = APIRouter(prefix="/rutinas", tags=["Planificación Técnica (Rutinas)"])


def _enriquecer_rutina(rutina: Rutina) -> dict:
    """
    Convierte una Rutina ORM en un dict serializable enriquecido con
    habilitado_actual y motivo_no_habilitado por cada ejercicio (RF8).
    """
    dias_out = []
    for dia in rutina.dias:
        ejercicios_out = []
        for ej_rutina in dia.ejercicios_rutina:
            estado = calcular_estado_ejercicio_rutina(ej_rutina.ejercicio)
            ej_dict = {
                "id": ej_rutina.id,
                "dia_rutina_id": ej_rutina.dia_rutina_id,
                "ejercicio_id": ej_rutina.ejercicio_id,
                "series": ej_rutina.series,
                "repeticiones": ej_rutina.repeticiones,
                "carga_objetivo": ej_rutina.carga_objetivo,
                "descanso_segundos": ej_rutina.descanso_segundos,
                "orden": ej_rutina.orden,
                "ejercicio": {
                    "id": ej_rutina.ejercicio.id,
                    "nombre": ej_rutina.ejercicio.nombre,
                    "descripcion": ej_rutina.ejercicio.descripcion,
                    "grupo_muscular": ej_rutina.ejercicio.grupo_muscular,
                    "video_url": ej_rutina.ejercicio.video_url,
                    "equipamiento_id": ej_rutina.ejercicio.equipamiento_id,
                    "activo": ej_rutina.ejercicio.activo,
                    "equipamiento": {
                        "id": ej_rutina.ejercicio.equipamiento.id,
                        "nombre": ej_rutina.ejercicio.equipamiento.nombre,
                        "descripcion": ej_rutina.ejercicio.equipamiento.descripcion,
                        "disponible": ej_rutina.ejercicio.equipamiento.disponible,
                    } if ej_rutina.ejercicio.equipamiento else None,
                },
                "habilitado_actual": estado["habilitado_actual"],
                "motivo_no_habilitado": estado["motivo_no_habilitado"],
            }
            ejercicios_out.append(ej_dict)

        dias_out.append({
            "id": dia.id,
            "rutina_id": dia.rutina_id,
            "nombre_dia": dia.nombre_dia,
            "orden": dia.orden,
            "ejercicios_rutina": ejercicios_out,
        })

    return {
        "id": rutina.id,
        "nombre": rutina.nombre,
        "descripcion": rutina.descripcion,
        "alumno_id": rutina.alumno_id,
        "profesor_id": rutina.profesor_id,
        "activo": rutina.activo,
        "fecha_creacion": rutina.fecha_creacion,
        "dias": dias_out,
    }


@router.post("", status_code=status.HTTP_201_CREATED)
async def crear_y_asignar_rutina(
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

    # --- Validar recursos ANTES de cualquier modificación ---
    errores_validacion = validar_recursos_rutina(rutina_in.dias, db)
    if errores_validacion:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "mensaje": "Validación de rutina fallida.",
                "errores": errores_validacion
            }
        )

    # Recién después de pasar la validación, desactivar rutinas anteriores
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
        return _enriquecer_rutina(nueva_rutina)

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al guardar la rutina: {str(e)}"
        )


@router.get("/alumno/{alumno_id}")
async def obtener_rutinas_alumno(
    alumno_id: int,
    db: Session = Depends(obtener_db),
    usuario_actual: Usuario = Depends(obtener_usuario_actual)
):
    """Retorna el historial de rutinas de un alumno, enriquecido con estado de habilitación RF8."""
    if usuario_actual.rol != "profesor" and usuario_actual.id != alumno_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene permiso para ver las rutinas de este alumno."
        )

    rutinas = db.query(Rutina).filter(Rutina.alumno_id == alumno_id).order_by(Rutina.fecha_creacion.desc()).all()
    return [_enriquecer_rutina(r) for r in rutinas]


@router.get("/activa/{alumno_id}")
async def obtener_rutina_activa(
    alumno_id: int,
    db: Session = Depends(obtener_db),
    usuario_actual: Usuario = Depends(obtener_usuario_actual)
):
    """Obtiene la rutina activa asignada al alumno, con estado de habilitación RF8 por ejercicio."""
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
    return _enriquecer_rutina(rutina)


@router.delete("/{rutina_id}", status_code=status.HTTP_200_OK)
async def eliminar_rutina(
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
