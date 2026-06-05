# -*- coding: utf-8 -*-
from sqlalchemy.orm import Session
from app.modelos import Equipamiento, Ejercicio

def sembrar_datos(db: Session):
    """Inserta datos semilla en el catálogo si aún no se han creado."""
    # Verificar si ya existen equipamientos
    if db.query(Equipamiento).count() > 0:
        print("El catálogo ya contiene datos. Omitiendo semilla.")
        return

    print("Sembrando catálogo de equipamiento...")
    # Crear equipamientos
    mancuernas = Equipamiento(nombre="Mancuernas", descripcion="Pares de mancuernas de distintos pesos", disponible=True)
    barra = Equipamiento(nombre="Barra Olímpica", descripcion="Barra de 20kg y discos olímpicos", disponible=True)
    prensa = Equipamiento(nombre="Prensa de Piernas", descripcion="Máquina de prensa inclinada a 45 grados", disponible=True)
    polea = Equipamiento(nombre="Máquina de Poleas", descripcion="Torre de poleas regulable con diversos agarres", disponible=True)
    banco = Equipamiento(nombre="Banco Regulable", descripcion="Banco reclinable para musculación", disponible=True)
    colchoneta = Equipamiento(nombre="Colchoneta", descripcion="Colchoneta para ejercicios de suelo", disponible=True)
    camilla_ext = Equipamiento(nombre="Camilla de Extensiones", descripcion="Máquina para extensiones de cuádriceps", disponible=True)

    db.add_all([mancuernas, barra, prensa, polea, banco, colchoneta, camilla_ext])
    db.commit()

    # Refrescar los objetos para tener sus IDs
    db.refresh(mancuernas)
    db.refresh(barra)
    db.refresh(prensa)
    db.refresh(polea)
    db.refresh(banco)
    db.refresh(colchoneta)
    db.refresh(camilla_ext)

    print("Sembrando catálogo de ejercicios...")
    # Crear ejercicios asociados a equipamientos
    ejercicios = [
        # Pecho
        Ejercicio(
            nombre="Press de Banca Plano",
            descripcion="Acostado en banco plano, empujar la barra olímpica verticalmente.",
            grupo_muscular="Pecho",
            video_url="https://www.youtube.com/watch?v=gRVjAtPip0Y",
            equipamiento_id=barra.id
        ),
        Ejercicio(
            nombre="Aperturas con Mancuernas",
            descripcion="Acostado en banco plano, realizar aperturas laterales controladas.",
            grupo_muscular="Pecho",
            video_url="https://www.youtube.com/watch?v=eozdVDA78K0",
            equipamiento_id=mancuernas.id
        ),
        Ejercicio(
            nombre="Cruce de Poleas Altas",
            descripcion="De pie, realizar una aducción de brazos cruzando las poleas al frente y abajo.",
            grupo_muscular="Pecho",
            video_url=None,
            equipamiento_id=polea.id
        ),

        # Espalda
        Ejercicio(
            nombre="Dominadas",
            descripcion="Colgarse de una barra y elevar el cuerpo hasta que la barbilla pase la barra.",
            grupo_muscular="Espalda",
            video_url=None,
            equipamiento_id=None
        ),
        Ejercicio(
            nombre="Remo con Barra",
            descripcion="Inclinando el torso, traccionar la barra hacia la zona del ombligo.",
            grupo_muscular="Espalda",
            video_url="https://www.youtube.com/watch?v=9efyMrygtjM",
            equipamiento_id=barra.id
        ),
        Ejercicio(
            nombre="Jalón al Pecho en Polea",
            descripcion="Sentado, traccionar la barra de polea alta hasta la altura de la clavícula.",
            grupo_muscular="Espalda",
            video_url=None,
            equipamiento_id=polea.id
        ),

        # Piernas
        Ejercicio(
            nombre="Sentadilla Trasera con Barra",
            descripcion="Apoyar barra en trapecios, descender flexionando cadera y rodillas.",
            grupo_muscular="Piernas",
            video_url="https://www.youtube.com/watch?v=ultWZbUM2A0",
            equipamiento_id=barra.id
        ),
        Ejercicio(
            nombre="Prensa de Piernas 45°",
            descripcion="Sentado en prensa, empujar la plataforma controlando la bajada.",
            grupo_muscular="Piernas",
            video_url=None,
            equipamiento_id=prensa.id
        ),
        Ejercicio(
            nombre="Extensiones de Cuádriceps",
            descripcion="Sentado en la camilla, realizar extensión completa de rodillas.",
            grupo_muscular="Piernas",
            video_url=None,
            equipamiento_id=camilla_ext.id
        ),
        Ejercicio(
            nombre="Peso Muerto Rumano",
            descripcion="De pie, descender la barra deslizando por los muslos con flexión de cadera mínima de rodilla.",
            grupo_muscular="Piernas",
            video_url=None,
            equipamiento_id=barra.id
        ),

        # Hombros
        Ejercicio(
            nombre="Press Militar con Barra",
            descripcion="De pie, empujar la barra por encima de la cabeza de forma vertical.",
            grupo_muscular="Hombros",
            video_url=None,
            equipamiento_id=barra.id
        ),
        Ejercicio(
            nombre="Vuelos Laterales con Mancuernas",
            descripcion="De pie, elevar los brazos lateralmente hasta la altura de los hombros.",
            grupo_muscular="Hombros",
            video_url=None,
            equipamiento_id=mancuernas.id
        ),

        # Brazos (Bíceps / Tríceps)
        Ejercicio(
            nombre="Curl de Bíceps con Mancuernas",
            descripcion="Sentado o de pie, flexionar el codo realizando supinación de muñeca.",
            grupo_muscular="Brazos",
            video_url=None,
            equipamiento_id=mancuernas.id
        ),
        Ejercicio(
            nombre="Extensión de Tríceps en Polea Alta",
            descripcion="De pie, empujar la polea hacia abajo extendiendo por completo los codos.",
            grupo_muscular="Brazos",
            video_url=None,
            equipamiento_id=polea.id
        ),

        # Core
        Ejercicio(
            nombre="Abdominales Crunch",
            descripcion="Acostado boca arriba, flexionar el torso contrayendo el abdomen.",
            grupo_muscular="Core",
            video_url=None,
            equipamiento_id=colchoneta.id
        ),
        Ejercicio(
            nombre="Plancha Abdominal",
            descripcion="Mantener el cuerpo en línea recta apoyado sobre antebrazos y punteras.",
            grupo_muscular="Core",
            video_url=None,
            equipamiento_id=colchoneta.id
        )
    ]

    db.add_all(ejercicios)
    db.commit()
    print("Sembra de base de datos finalizada correctamente.")
