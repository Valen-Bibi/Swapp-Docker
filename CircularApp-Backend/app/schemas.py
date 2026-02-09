from pydantic import BaseModel, EmailStr
from typing import Optional, List
from uuid import UUID
from datetime import datetime

# --- SCHEMAS DE PRODUCTO ---
class ProductoBase(BaseModel):
    nombre: str
    sku: Optional[str] = None
    descripcion: Optional[str] = None

class ProductoCreate(ProductoBase):
    pass

class ProductoResponse(ProductoBase):
    id: UUID
    
    class Config:
        from_attributes = True

# --- SCHEMAS DE USUARIO (Movido desde auth.py) ---
class UsuarioBase(BaseModel):
    email: EmailStr
    usuario: str
    rol: str = "cliente"

class UserCreate(UsuarioBase):
    password: str

class UsuarioResponse(UsuarioBase):
    id: UUID
    is_active: bool
    # OJO: Nunca devolvemos el password en la respuesta
    
    class Config:
        from_attributes = True

# --- SCHEMAS DE TOKEN (Movido desde auth.py) ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
    id: Optional[str] = None
    rol: Optional[str] = None

# --- SCHEMAS DE SOLICITUD (Lo que ya tenías + mejoras) ---
class SolicitudBase(BaseModel):
    producto_id: UUID 
    cant_devuelta: int = 1
    foto_url: Optional[str] = None
    confianza: float

class SolicitudCreate(SolicitudBase):
    usuario_id: UUID # Se usa internamente al crear

class SolicitudResponse(SolicitudBase):
    id: UUID
    fecha_hora: datetime
    estado: str
    
    # Para devolver datos anidados (ej: nombre del producto en vez de solo ID)
    producto: Optional[ProductoResponse] = None 

    class Config:
        from_attributes = True