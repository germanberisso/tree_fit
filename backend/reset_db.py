import sys
import os

# Asegurar que la ruta esté en sys.path para importaciones
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import engine, Base
from app.modelos import *  # Importar modelos para cargar la metadata

print("Borrando todas las tablas de la base de datos...")
Base.metadata.drop_all(bind=engine)
print("Tablas borradas exitosamente.")
