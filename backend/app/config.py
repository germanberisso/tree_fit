# -*- coding: utf-8 -*-
import os
import warnings
from dotenv import load_dotenv

# Cargar las variables de entorno desde el archivo .env usando su ruta absoluta
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
env_path = os.path.join(base_dir, ".env")
if os.path.exists(env_path):
    load_dotenv(env_path)
else:
    load_dotenv()

class Config:
    """Clase para administrar la configuración de la aplicación."""
    DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./tree_fit.db")
    JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*")

    # JWT Secret: obligatorio en producción, fallback para desarrollo local
    JWT_SECRET = os.getenv("JWT_SECRET")
    if not JWT_SECRET:
        warnings.warn(
            "⚠️  JWT_SECRET no configurado. Usando secret de desarrollo. "
            "En producción, defina la variable de entorno JWT_SECRET.",
            stacklevel=2
        )
        JWT_SECRET = "dev-only-secret-treefit-2026-change-in-production"

settings = Config()
