# -*- coding: utf-8 -*-
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import obtener_db
from app.modelos import Ejercicio, Equipamiento, Usuario
from app.esquemas import EjercicioRespuesta, EquipamientoRespuesta
from app.rutas.autenticacion import obtener_usuario_actual

router = APIRouter(tags=["Catálogo de Ejercicios y Equipamiento"])

@router.get("/ejercicios", response_model=List[EjercicioRespuesta])
def listar_ejercicios(
    grupo_muscular: Optional[str] = None,
    busqueda: Optional[str] = None,
    db: Session = Depends(obtener_db),
    usuario_actual: Usuario = Depends(obtener_usuario_actual)
):
    """Retorna el catálogo centralizado de ejercicios con filtros opcionales."""
    query = db.query(Ejercicio)
    
    if grupo_muscular:
        query = query.filter(Ejercicio.grupo_muscular == grupo_muscular)
        
    if busqueda:
        query = query.filter(Ejercicio.nombre.ilike(f"%{busqueda}%"))
        
    return query.all()

@router.get("/equipamiento", response_model=List[EquipamientoRespuesta])
def listar_equipamiento(
    db: Session = Depends(obtener_db),
    usuario_actual: Usuario = Depends(obtener_usuario_actual)
):
    """Retorna el catálogo centralizado de equipamiento/materiales disponibles en el gimnasio."""
    return db.query(Equipamiento).all()
