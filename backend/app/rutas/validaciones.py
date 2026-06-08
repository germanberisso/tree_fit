# -*- coding: utf-8 -*-
"""
Módulo de validación RF8: Validación de Recursos.
Provee la función auxiliar reutilizable para verificar que todos los ejercicios
de una rutina tienen sus recursos (equipamiento) disponibles antes de guardar.
"""
from typing import List
from sqlalchemy.orm import Session
from app.modelos import Ejercicio, Equipamiento


def validar_recursos_rutina(dias_data: list, db: Session) -> List[str]:
    """
    Valida que todos los ejercicios propuestos para una rutina sean asignables.
    Un ejercicio es asignable si:
    - Existe en el catálogo.
    - Está activo (no dado de baja lógica).
    - Si tiene equipamiento asociado, ese equipamiento está marcado como disponible.

    Retorna una lista de mensajes de error. Lista vacía significa que la rutina es válida.
    """
    errores = []

    for dia_data in dias_data:
        for ej_data in dia_data.ejercicios_rutina:
            ejercicio = db.query(Ejercicio).filter(Ejercicio.id == ej_data.ejercicio_id).first()

            if not ejercicio:
                errores.append(
                    f"El ejercicio con ID {ej_data.ejercicio_id} no existe en el catálogo."
                )
                continue

            if not ejercicio.activo:
                errores.append(
                    f"No se puede asignar '{ejercicio.nombre}' porque el ejercicio está inactivo."
                )
                continue

            if ejercicio.equipamiento_id is not None:
                equipo = db.query(Equipamiento).filter(
                    Equipamiento.id == ejercicio.equipamiento_id
                ).first()
                if equipo and not equipo.disponible:
                    errores.append(
                        f"No se puede asignar '{ejercicio.nombre}' porque requiere "
                        f"'{equipo.nombre}', que no está disponible."
                    )

    return errores


def calcular_estado_ejercicio_rutina(ejercicio: Ejercicio) -> dict:
    """
    Calcula el estado de habilitación actual de un ejercicio dentro de una rutina.
    Retorna un dict con 'habilitado_actual' y 'motivo_no_habilitado'.
    Se usa al serializar rutinas para el alumno (y también para el profesor).
    """
    if not ejercicio.activo:
        return {
            "habilitado_actual": False,
            "motivo_no_habilitado": "Ejercicio no habilitado. Consultá al profesor para una alternativa."
        }

    if ejercicio.equipamiento_id is not None and ejercicio.equipamiento is not None:
        if not ejercicio.equipamiento.disponible:
            return {
                "habilitado_actual": False,
                "motivo_no_habilitado": "Ejercicio no habilitado temporalmente. Consultá al profesor para una alternativa."
            }

    return {
        "habilitado_actual": True,
        "motivo_no_habilitado": None
    }
