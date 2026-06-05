# -*- coding: utf-8 -*-
import psycopg2
from urllib.parse import urlparse
from app.config import settings

def asegurar_base_datos():
    """Conecta temporalmente a la base de datos por defecto 'postgres' para verificar

    y crear la base de datos del proyecto ('tree_fit') si no existe.
    """
    url = settings.DATABASE_URL
    if not url.startswith("postgresql"):
        print("Usando base de datos SQLite. Omitiendo verificación de PostgreSQL.")
        return
    
    # Analizar la cadena de conexión
    url_analizada = urlparse(url)
    usuario = url_analizada.username
    clave = url_analizada.password
    host = url_analizada.hostname
    puerto = url_analizada.port or 5432
    nombre_bd = url_analizada.path.lstrip('/')
    
    try:
        # Conectar a la base de datos de administración 'postgres'
        conexion = psycopg2.connect(
            dbname="postgres",
            user=usuario,
            password=clave,
            host=host,
            port=puerto
        )
        conexion.autocommit = True
        cursor = conexion.cursor()
        
        # Verificar si la base de datos 'tree_fit' ya existe
        cursor.execute(f"SELECT 1 FROM pg_catalog.pg_database WHERE datname = '{nombre_bd}';")
        existe = cursor.fetchone()
        
        if not existe:
            print(f"La base de datos '{nombre_bd}' no existe. Creándola en PostgreSQL...")
            cursor.execute(f"CREATE DATABASE {nombre_bd};")
            print(f"Base de datos '{nombre_bd}' creada correctamente.")
        else:
            print(f"La base de datos '{nombre_bd}' ya existe en PostgreSQL.")
            
        cursor.close()
        conexion.close()
    except Exception as e:
        print(f"Advertencia al verificar la base de datos PostgreSQL: {str(e)}")
        print("Asegúrate de que el servidor de PostgreSQL esté encendido y la contraseña en el archivo .env sea correcta.")
