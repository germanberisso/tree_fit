# -*- coding: utf-8 -*-
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
from app.database import obtener_db
from app.modelos import Usuario, RegistroBiometrico
from app.esquemas import RegistroBiometricoCrear, RegistroBiometricoRespuesta
from app.rutas.autenticacion import obtener_usuario_actual

router = APIRouter(prefix="/biometria", tags=["Seguimiento Biométrico"])

@router.post("/{alumno_id}", response_model=RegistroBiometricoRespuesta, status_code=status.HTTP_201_CREATED)
def registrar_biometria(
    alumno_id: int,
    biometria_in: RegistroBiometricoCrear,
    db: Session = Depends(obtener_db),
    usuario_actual: Usuario = Depends(obtener_usuario_actual)
):
    """Registra una nueva evaluación biométrica para un alumno (puede ser registrada por el profesor o por el propio alumno)."""
    # Buscar que el alumno exista
    alumno = db.query(Usuario).filter(Usuario.id == alumno_id, Usuario.rol == "alumno").first()
    if not alumno:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alumno no encontrado."
        )

    # Validar permisos
    es_su_profesor = alumno.perfil_alumno and alumno.perfil_alumno.profesor_id == usuario_actual.id
    if usuario_actual.id != alumno_id and not es_su_profesor:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene permisos para registrar la biometría de este alumno."
        )

    # Crear el registro
    fecha_reg = biometria_in.fecha_registro if biometria_in.fecha_registro else date.today()
    
    # Evitar registros duplicados en la misma fecha (si ya existe, lo actualizamos)
    registro_existente = db.query(RegistroBiometrico).filter(
        RegistroBiometrico.alumno_id == alumno_id,
        RegistroBiometrico.fecha_registro == fecha_reg
    ).first()

    if registro_existente:
        registro_existente.peso = biometria_in.peso
        registro_existente.altura = biometria_in.altura
        registro_existente.porcentaje_grasa = biometria_in.porcentaje_grasa
        registro_existente.porcentaje_musculo = biometria_in.porcentaje_musculo
        registro_existente.pecho = biometria_in.pecho
        registro_existente.cintura = biometria_in.cintura
        registro_existente.cadera = biometria_in.cadera
        registro_existente.bicep_izq = biometria_in.bicep_izq
        registro_existente.bicep_der = biometria_in.bicep_der
        registro_existente.muslo_izq = biometria_in.muslo_izq
        registro_existente.muslo_der = biometria_in.muslo_der
        db.commit()
        db.refresh(registro_existente)
        return registro_existente

    nuevo_registro = RegistroBiometrico(
        alumno_id=alumno_id,
        fecha_registro=fecha_reg,
        peso=biometria_in.peso,
        altura=biometria_in.altura,
        porcentaje_grasa=biometria_in.porcentaje_grasa,
        porcentaje_musculo=biometria_in.porcentaje_musculo,
        pecho=biometria_in.pecho,
        cintura=biometria_in.cintura,
        cadera=biometria_in.cadera,
        bicep_izq=biometria_in.bicep_izq,
        bicep_der=biometria_in.bicep_der,
        muslo_izq=biometria_in.muslo_izq,
        muslo_der=biometria_in.muslo_der
    )
    
    db.add(nuevo_registro)
    db.commit()
    db.refresh(nuevo_registro)
    return nuevo_registro

@router.get("/{alumno_id}", response_model=List[RegistroBiometricoRespuesta])
def obtener_registros_biometricos(
    alumno_id: int,
    db: Session = Depends(obtener_db),
    usuario_actual: Usuario = Depends(obtener_usuario_actual)
):
    """Retorna el historial biométrico completo de un alumno, ordenado por fecha de forma ascendente (útil para gráficos)."""
    alumno = db.query(Usuario).filter(Usuario.id == alumno_id, Usuario.rol == "alumno").first()
    if not alumno:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alumno no encontrado."
        )

    # Validar permisos
    es_su_profesor = alumno.perfil_alumno and alumno.perfil_alumno.profesor_id == usuario_actual.id
    if usuario_actual.id != alumno_id and not es_su_profesor:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene permisos para ver el historial biométrico de este alumno."
        )

    registros = db.query(RegistroBiometrico).filter(
        RegistroBiometrico.alumno_id == alumno_id
    ).order_by(RegistroBiometrico.fecha_registro.asc()).all()
    
    return registros

@router.delete("/{alumno_id}/{registro_id}", status_code=status.HTTP_200_OK)
def eliminar_registro_biometrico(
    alumno_id: int,
    registro_id: int,
    db: Session = Depends(obtener_db),
    usuario_actual: Usuario = Depends(obtener_usuario_actual)
):
    """Elimina un registro biométrico del alumno."""
    alumno = db.query(Usuario).filter(Usuario.id == alumno_id, Usuario.rol == "alumno").first()
    if not alumno:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alumno no encontrado."
        )

    # Validar permisos (solo el profesor o el alumno)
    es_su_profesor = alumno.perfil_alumno and alumno.perfil_alumno.profesor_id == usuario_actual.id
    if usuario_actual.id != alumno_id and not es_su_profesor:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene permisos para modificar la biometría de este alumno."
        )

    registro = db.query(RegistroBiometrico).filter(
        RegistroBiometrico.id == registro_id,
        RegistroBiometrico.alumno_id == alumno_id
    ).first()

    if not registro:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Registro biométrico no encontrado."
        )

    db.delete(registro)
    db.commit()
    
    return {"mensaje": "Registro biométrico eliminado correctamente."}
