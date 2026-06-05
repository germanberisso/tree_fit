# -*- coding: utf-8 -*-
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.database import obtener_db
from app.modelos import Usuario, PerfilAlumno
from app.esquemas import UsuarioCrear, UsuarioRespuesta, Token, DatosToken
from app.seguridad import obtener_clave_hash, verificar_clave, crear_token_acceso, decodificar_token
from pydantic import BaseModel

router = APIRouter(prefix="/auth", tags=["Autenticación"])

# Esquema para login por cuerpo JSON (más amigable con React)
class LoginEsquema(BaseModel):
    email: str
    clave: str

# Configuración del portador de token OAuth2
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login-form", auto_error=False)

def obtener_usuario_actual(token: str = Depends(oauth2_scheme), db: Session = Depends(obtener_db)) -> Usuario:
    """Dependencia para verificar el token JWT y retornar el usuario actual."""
    credenciales_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudo validar las credenciales o el token ha expirado.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credenciales_exception
        
    datos = decodificar_token(token)
    if datos is None:
        raise credenciales_exception
    
    email: str = datos.get("sub")
    if email is None:
        raise credenciales_exception
    
    usuario = db.query(Usuario).filter(Usuario.email == email).first()
    if usuario is None:
        raise credenciales_exception
    
    return usuario

@router.post("/registro", response_model=UsuarioRespuesta, status_code=status.HTTP_201_CREATED)
def registrar_usuario(usuario_in: UsuarioCrear, db: Session = Depends(obtener_db)):
    """Registra un nuevo usuario (profesor o alumno). Si es alumno, crea su perfil básico."""
    # Verificar si el email ya existe
    existe = db.query(Usuario).filter(Usuario.email == usuario_in.email).first()
    if existe:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El correo electrónico ya está registrado."
        )
    
    # Validar el rol
    if usuario_in.rol not in ["profesor", "alumno"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El rol especificado no es válido. Debe ser 'profesor' o 'alumno'."
        )

    # Crear el usuario
    nuevo_usuario = Usuario(
        email=usuario_in.email,
        nombre_completo=usuario_in.nombre_completo,
        rol=usuario_in.rol,
        clave_encriptada=obtener_clave_hash(usuario_in.clave)
    )
    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)

    # Si el rol es alumno, crear su perfil vacío asociado
    if nuevo_usuario.rol == "alumno":
        perfil = PerfilAlumno(id=nuevo_usuario.id)
        db.add(perfil)
        db.commit()

    return nuevo_usuario

@router.post("/login", response_model=Token)
def login_json(credenciales: LoginEsquema, db: Session = Depends(obtener_db)):
    """Inicia sesión utilizando datos enviados en formato JSON."""
    usuario = db.query(Usuario).filter(Usuario.email == credenciales.email).first()
    if not usuario or not verificar_clave(credenciales.clave, usuario.clave_encriptada):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo electrónico o contraseña incorrectos."
        )
    
    # Generar token de acceso JWT
    token_data = {"sub": usuario.email, "id_usuario": usuario.id, "rol": usuario.rol}
    token_acceso = crear_token_acceso(datos=token_data)
    
    return {"token_acceso": token_acceso, "tipo_token": "bearer"}

@router.get("/perfil", response_model=UsuarioRespuesta)
def obtener_perfil(usuario_actual: Usuario = Depends(obtener_usuario_actual)):
    """Retorna los datos del perfil del usuario actualmente autenticado."""
    return usuario_actual
