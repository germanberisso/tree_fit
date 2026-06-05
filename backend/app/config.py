# -*- coding: utf-8 -*-
import os
from dotenv import load_dotenv

# Cargar las variables de entorno desde el archivo .env
load_dotenv()

class Config:
    """Clase para administrar la configuración de la aplicación."""
    DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./tree_fit.db")
    JWT_SECRET = os.getenv("JWT_SECRET", "supersecretjwtkeyforgymmanagementapptreefit2026!")
    JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

settings = Config()
