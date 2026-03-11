from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
import uuid

# --- USUARIOS ---
class UserCreate(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    password: str
    role: str = "user"

class UsuarioResponse(BaseModel):
    user_uuid: uuid.UUID
    first_name: str
    last_name: str
    email: str
    role: str
    
    class Config:
        from_attributes = True

# --- AUTENTICACIÓN ---
class Token(BaseModel):
    access_token: str
    token_type: str

# --- PRODUCTOS ---
class ProductoResponse(BaseModel):
    product_uuid: uuid.UUID
    name: str
    sku: Optional[str] = None
    
    class Config:
        from_attributes = True

# --- ESCANEOS (Analyses) ---
class SolicitudResponse(BaseModel):
    analysis_uuid: uuid.UUID
    confidence_score: Optional[float] = None
    status: str
    created_at: datetime
    product: ProductoResponse
    
    class Config:
        from_attributes = True