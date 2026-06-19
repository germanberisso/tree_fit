# -*- coding: utf-8 -*-
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# from app.crear_db import asegurar_base_datos

# Ejecutar verificación y creación de base de datos en caso de usar PostgreSQL
# asegurar_base_datos()

from app.database import engine, Base, SessionLocal
from app.semilla import sembrar_datos
from app.rutas import autenticacion, alumnos, ejercicios, rutinas, entrenamientos, biometria, estadisticas
from app.config import settings

# Crear las tablas de la base de datos si no existen
Base.metadata.create_all(bind=engine)


# Sembrar datos iniciales en la base de datos (ejercicios y equipamiento)
db = SessionLocal()
try:
    sembrar_datos(db)
finally:
    db.close()

# Inicializar la aplicación FastAPI
app = FastAPI(
    title="Tree Fit API",
    description="API para la gestión integral de entrenamiento en gimnasios (PP4)",
    version="1.0.0"
)

# Configurar middleware de CORS (orígenes configurables por variable de entorno)
origenes_permitidos = [o.strip() for o in settings.CORS_ORIGINS.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origenes_permitidos,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir los enrutadores de la API bajo el prefijo '/api'
app.include_router(autenticacion.router, prefix="/api")
app.include_router(alumnos.router, prefix="/api")
app.include_router(ejercicios.router, prefix="/api")
app.include_router(rutinas.router, prefix="/api")
app.include_router(entrenamientos.router, prefix="/api")
app.include_router(biometria.router, prefix="/api")
app.include_router(estadisticas.router, prefix="/api")

@app.get("/")
async def check_salud():
    """Endpoint de control de estado del servidor."""
    return {
        "estado": "activo",
        "aplicacion": "Tree Fit Backend",
        "mensaje": "Servidor de base de datos e interfaz API listos."
    }

@app.get("/api/health")
async def health_check():
    """Endpoint liviano para health checks y pings externos."""
    return {"status": "ok"}