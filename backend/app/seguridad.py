# -*- coding: utf-8 -*-
import bcrypt
from datetime import datetime, timedelta
from typing import Union, Any
from jose import JWTError, jwt
from app.config import settings

def obtener_clave_hash(clave: str) -> str:
    """Genera un hash bcrypt a partir de una contraseña en texto plano."""
    clave_bytes = clave.encode("utf-8")
    sal = bcrypt.gensalt()
    hash_clave = bcrypt.hashpw(clave_bytes, sal)
    return hash_clave.decode("utf-8")

def verificar_clave(clave_plana: str, clave_encriptada: str) -> bool:
    """Verifica si la contraseña en texto plano coincide con el hash encriptado."""
    try:
        clave_bytes = clave_plana.encode("utf-8")
        encriptada_bytes = clave_encriptada.encode("utf-8")
        return bcrypt.checkpw(clave_bytes, encriptada_bytes)
    except Exception:
        return False

def crear_token_acceso(datos: dict, duracion: Union[timedelta, None] = None) -> str:
    """Crea un token de acceso JWT firmado."""
    a_codificar = datos.copy()
    if duracion:
        expiracion = datetime.utcnow() + duracion
    else:
        expiracion = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    a_codificar.update({"exp": expiracion})
    token_jwt = jwt.encode(a_codificar, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return token_jwt

def decodificar_token(token: str) -> Union[dict, None]:
    """Decodifica y valida un token JWT. Retorna el diccionario de datos o None si es inválido/expirado."""
    try:
        datos = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        return datos
    except JWTError:
        return None
