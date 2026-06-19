# -*- coding: utf-8 -*-
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import obtener_db
from app.modelos import Ejercicio, Equipamiento, EjercicioRutina, SerieEntrenamiento, Usuario
from app.esquemas import (
    EjercicioRespuesta, EjercicioCrear, EjercicioActualizar,
    EquipamientoRespuesta, EquipamientoCrear, EquipamientoActualizar
)
from app.rutas.autenticacion import obtener_usuario_actual

router = APIRouter(tags=["Catálogo de Ejercicios y Equipamiento"])


# ---------------------------------------------------------------------------
# Equipamiento
# ---------------------------------------------------------------------------

@router.get("/equipamiento", response_model=List[EquipamientoRespuesta])
async def listar_equipamiento(
    db: Session = Depends(obtener_db),
    usuario_actual: Usuario = Depends(obtener_usuario_actual)
):
    """Retorna el catálogo completo de equipamiento/materiales del gimnasio."""
    return db.query(Equipamiento).all()


@router.post("/equipamiento", response_model=EquipamientoRespuesta, status_code=status.HTTP_201_CREATED)
async def crear_equipamiento(
    equipo_in: EquipamientoCrear,
    db: Session = Depends(obtener_db),
    usuario_actual: Usuario = Depends(obtener_usuario_actual)
):
    """Crea un nuevo equipamiento en el catálogo. Solo profesores."""
    if usuario_actual.rol != "profesor":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Solo los profesores pueden gestionar equipamiento.")

    existe = db.query(Equipamiento).filter(Equipamiento.nombre == equipo_in.nombre).first()
    if existe:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ya existe un equipamiento con ese nombre.")

    nuevo = Equipamiento(
        nombre=equipo_in.nombre,
        descripcion=equipo_in.descripcion,
        disponible=equipo_in.disponible
    )
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


@router.put("/equipamiento/{equipamiento_id}", response_model=EquipamientoRespuesta)
async def editar_equipamiento(
    equipamiento_id: int,
    equipo_in: EquipamientoActualizar,
    db: Session = Depends(obtener_db),
    usuario_actual: Usuario = Depends(obtener_usuario_actual)
):
    """Edita los datos de un equipamiento existente. Solo profesores."""
    if usuario_actual.rol != "profesor":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Solo los profesores pueden gestionar equipamiento.")

    equipo = db.query(Equipamiento).filter(Equipamiento.id == equipamiento_id).first()
    if not equipo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Equipamiento no encontrado.")

    if equipo_in.nombre is not None:
        equipo.nombre = equipo_in.nombre
    if equipo_in.descripcion is not None:
        equipo.descripcion = equipo_in.descripcion
    if equipo_in.disponible is not None:
        equipo.disponible = equipo_in.disponible

    db.commit()
    db.refresh(equipo)
    return equipo


@router.patch("/equipamiento/{equipamiento_id}/disponibilidad", response_model=EquipamientoRespuesta)
async def cambiar_disponibilidad_equipamiento(
    equipamiento_id: int,
    disponible: bool,
    db: Session = Depends(obtener_db),
    usuario_actual: Usuario = Depends(obtener_usuario_actual)
):
    """Cambia únicamente el campo disponible de un equipamiento. Solo profesores."""
    if usuario_actual.rol != "profesor":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Solo los profesores pueden gestionar equipamiento.")

    equipo = db.query(Equipamiento).filter(Equipamiento.id == equipamiento_id).first()
    if not equipo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Equipamiento no encontrado.")

    equipo.disponible = disponible
    db.commit()
    db.refresh(equipo)
    return equipo


# ---------------------------------------------------------------------------
# Ejercicios
# ---------------------------------------------------------------------------

@router.get("/ejercicios", response_model=List[EjercicioRespuesta])
async def listar_ejercicios(
    grupo_muscular: Optional[str] = None,
    busqueda: Optional[str] = None,
    solo_activos: Optional[bool] = None,
    db: Session = Depends(obtener_db),
    usuario_actual: Usuario = Depends(obtener_usuario_actual)
):
    """Retorna el catálogo centralizado de ejercicios con filtros opcionales.
    - solo_activos=true: filtra ejercicios inactivos (usar al crear rutinas).
    - Sin filtro: devuelve todos (para el catálogo completo del profesor).
    """
    query = db.query(Ejercicio)

    if solo_activos is True:
        query = query.filter(Ejercicio.activo == True)

    if grupo_muscular:
        query = query.filter(Ejercicio.grupo_muscular == grupo_muscular)

    if busqueda:
        query = query.filter(Ejercicio.nombre.ilike(f"%{busqueda}%"))

    return query.all()


@router.post("/ejercicios", response_model=EjercicioRespuesta, status_code=status.HTTP_201_CREATED)
async def crear_ejercicio(
    ejercicio_in: EjercicioCrear,
    db: Session = Depends(obtener_db),
    usuario_actual: Usuario = Depends(obtener_usuario_actual)
):
    """Crea un nuevo ejercicio en el catálogo. Solo profesores."""
    if usuario_actual.rol != "profesor":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Solo los profesores pueden crear ejercicios.")

    existe = db.query(Ejercicio).filter(Ejercicio.nombre == ejercicio_in.nombre).first()
    if existe:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ya existe un ejercicio con ese nombre.")

    nuevo = Ejercicio(
        nombre=ejercicio_in.nombre,
        descripcion=ejercicio_in.descripcion,
        grupo_muscular=ejercicio_in.grupo_muscular,
        video_url=ejercicio_in.video_url,
        equipamiento_id=ejercicio_in.equipamiento_id,
        activo=True
    )
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


@router.delete("/ejercicios/{ejercicio_id}", status_code=status.HTTP_200_OK)
async def eliminar_ejercicio(
    ejercicio_id: int,
    db: Session = Depends(obtener_db),
    usuario_actual: Usuario = Depends(obtener_usuario_actual)
):
    """Elimina o da de baja lógica un ejercicio.
    - Si tiene historial (rutinas o series de entrenamiento): baja lógica (activo=False).
    - Si no tiene historial: borrado físico.
    Solo profesores.
    """
    if usuario_actual.rol != "profesor":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Solo los profesores pueden eliminar ejercicios.")

    ejercicio = db.query(Ejercicio).filter(Ejercicio.id == ejercicio_id).first()
    if not ejercicio:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ejercicio no encontrado.")

    # Verificar si tiene asociaciones (rutinas o historial de series)
    en_rutinas = db.query(EjercicioRutina).filter(EjercicioRutina.ejercicio_id == ejercicio_id).first()
    en_historial = db.query(SerieEntrenamiento).filter(SerieEntrenamiento.ejercicio_id == ejercicio_id).first()

    if en_rutinas or en_historial:
        # Baja lógica: preservar historial
        ejercicio.activo = False
        db.commit()
        return {"mensaje": "El ejercicio fue dado de baja lógica porque tiene rutinas o historial asociados."}
    else:
        db.delete(ejercicio)
        db.commit()
        return {"mensaje": "El ejercicio fue eliminado permanentemente del catálogo."}


@router.put("/ejercicios/{ejercicio_id}", response_model=EjercicioRespuesta)
async def editar_ejercicio(
    ejercicio_id: int,
    ejercicio_in: EjercicioActualizar,
    db: Session = Depends(obtener_db),
    usuario_actual: Usuario = Depends(obtener_usuario_actual)
):
    """Edita los datos de un ejercicio existente en el catálogo. Solo profesores."""
    if usuario_actual.rol != "profesor":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Solo los profesores pueden editar ejercicios.")

    ejercicio = db.query(Ejercicio).filter(Ejercicio.id == ejercicio_id).first()
    if not ejercicio:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ejercicio no encontrado.")

    if ejercicio_in.nombre is not None:
        # Verificar que no exista otro ejercicio con el mismo nombre
        existe = db.query(Ejercicio).filter(Ejercicio.nombre == ejercicio_in.nombre, Ejercicio.id != ejercicio_id).first()
        if existe:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ya existe otro ejercicio con ese nombre.")
        ejercicio.nombre = ejercicio_in.nombre
    if ejercicio_in.descripcion is not None:
        ejercicio.descripcion = ejercicio_in.descripcion
    if ejercicio_in.grupo_muscular is not None:
        ejercicio.grupo_muscular = ejercicio_in.grupo_muscular
    if ejercicio_in.video_url is not None:
        ejercicio.video_url = ejercicio_in.video_url
    if ejercicio_in.equipamiento_id is not None:
        ejercicio.equipamiento_id = ejercicio_in.equipamiento_id if ejercicio_in.equipamiento_id != 0 else None
    if ejercicio_in.activo is not None:
        ejercicio.activo = ejercicio_in.activo

    db.commit()
    db.refresh(ejercicio)
    return ejercicio
