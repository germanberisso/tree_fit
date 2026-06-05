# -*- coding: utf-8 -*-
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings

# Determinar si estamos usando SQLite
es_sqlite = settings.DATABASE_URL.startswith("sqlite")

# Configurar argumentos de conexión adicionales (requerido para SQLite multihilo)
argumentos_conexion = {}
if es_sqlite:
    argumentos_conexion = {"check_same_thread": False}

# Crear el motor de la base de datos
engine = create_engine(
    settings.DATABASE_URL,
    connect_args=argumentos_conexion
)

# Crear la fábrica de sesiones de base de datos
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Clase base para la definición de modelos declarativos
Base = declarative_base()

def obtener_db():
    """Generador para obtener la sesión de base de datos (utilizado como dependencia en FastAPI)."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
