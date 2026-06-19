# -*- coding: utf-8 -*-
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.database import Base, obtener_db
from app.modelos import Ejercicio, Equipamiento
from app.rutas.validaciones import calcular_estado_ejercicio_rutina
from app.seguridad import obtener_clave_hash, verificar_clave

# ==========================================
# CONFIGURACIÓN DEL ENTORNO DE TESTING
# ==========================================
# Creamos una base de datos SQLite en memoria solo para las pruebas
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_tree_fit.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Recreamos las tablas en la BD de prueba
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)

# Sobrescribimos la dependencia de la base de datos para que la API use la de prueba
def override_obtener_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[obtener_db] = override_obtener_db

client = TestClient(app)

# ==========================================
# 1. PRUEBAS UNITARIAS
# Evalúan componentes aislados (funciones lógicas o métodos)
# ==========================================

def test_encriptacion_claves():
    """
    Prueba Unitaria 1: Verifica que el algoritmo de hashing genere un hash distinto
    a la clave plana y que la función de verificación funcione correctamente.
    """
    clave_plana = "mi_clave_secreta_123"
    hash_generado = obtener_clave_hash(clave_plana)
    
    assert hash_generado != clave_plana
    assert verificar_clave(clave_plana, hash_generado) == True
    assert verificar_clave("clave_incorrecta", hash_generado) == False

def test_calcular_estado_ejercicio_rutina_rf8():
    """
    Prueba Unitaria 2: Valida la lógica de negocio (Requerimiento Funcional 8).
    Si un ejercicio requiere un equipamiento que NO está disponible, 
    debe retornar habilitado_actual = False.
    """
    # Simulamos objetos de base de datos
    equipo_roto = Equipamiento(id=1, nombre="Prensa 45°", disponible=False)
    ejercicio_prensa = Ejercicio(
        id=1, 
        nombre="Prensa de Piernas", 
        activo=True, 
        equipamiento_id=1, 
        equipamiento=equipo_roto
    )

    resultado = calcular_estado_ejercicio_rutina(ejercicio_prensa)
    
    assert resultado["habilitado_actual"] == False
    assert "no habilitado temporalmente" in resultado["motivo_no_habilitado"].lower()

def test_calcular_estado_ejercicio_sin_equipo():
    """
    Prueba Unitaria 3: Valida que un ejercicio con peso corporal (sin equipamiento)
    esté siempre habilitado si el ejercicio está activo.
    """
    ejercicio_libre = Ejercicio(
        id=2, 
        nombre="Flexiones de brazo", 
        activo=True, 
        equipamiento_id=None, 
        equipamiento=None
    )

    resultado = calcular_estado_ejercicio_rutina(ejercicio_libre)
    
    assert resultado["habilitado_actual"] == True
    assert resultado["motivo_no_habilitado"] is None


# ==========================================
# 2. PRUEBAS DE INTEGRACIÓN
# Evalúan la interacción entre los endpoints, lógica y la Base de Datos
# ==========================================

def test_flujo_registro_y_login_profesor():
    """
    Prueba de Integración 1: Verifica que un profesor pueda registrarse 
    correctamente en la base de datos y luego generar un token JWT válido al loguearse.
    """
    # 1. Registrar Profesor
    datos_registro = {
        "email": "profesor_test@treefit.com",
        "nombre_completo": "Profesor Integración",
        "rol": "profesor",
        "clave": "secreta123"
    }
    response_reg = client.post("/api/auth/registro", json=datos_registro)
    
    assert response_reg.status_code == 201
    datos_usuario = response_reg.json()
    assert datos_usuario["email"] == "profesor_test@treefit.com"
    assert datos_usuario["rol"] == "profesor"

    # 2. Login con las credenciales creadas
    datos_login = {
        "email": "profesor_test@treefit.com",
        "clave": "secreta123"
    }
    response_login = client.post("/api/auth/login", json=datos_login)
    
    assert response_login.status_code == 200
    token_data = response_login.json()
    assert "token_acceso" in token_data
    assert token_data["tipo_token"] == "bearer"

def test_creacion_ejercicio_requiere_autenticacion():
    """
    Prueba de Integración 2: Verifica que la API proteja los recursos. 
    Intentar crear un ejercicio sin enviar un token JWT debe dar Error 401.
    """
    payload_ejercicio = {
        "nombre": "Curl de Bíceps",
        "grupo_muscular": "Brazos",
        "descripcion": "Prueba sin token"
    }
    
    # Petición sin Header de Authorization
    response = client.post("/api/ejercicios", json=payload_ejercicio)
    
    # 401 Unauthorized
    assert response.status_code == 401 
    assert "No se pudo validar las credenciales" in response.json()["detail"]
    
    