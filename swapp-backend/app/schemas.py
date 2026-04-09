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

class ProductoCatalogoResponse(BaseModel):
    product_uuid: uuid.UUID
    name: str
    base_price: float
    sale_price: Optional[float] = None  # NUEVO: Precio de oferta
    main_image_url: Optional[str] = None
    is_featured: bool
    sold_count: int
    description: Optional[str] = None 
    short_description: Optional[str] = None # NUEVO: Descripción corta
    stock_quantity: int = 0 # NUEVO: Stock disponible
    category_id: Optional[int] = None # NUEVO: ID real de la categoría para filtros

    class Config:
        from_attributes = True

class CategoriaResponse(BaseModel):
    category_id: int # Agregamos el ID numérico para conectarlo más fácil
    category_uuid: uuid.UUID
    name: str
    image_url: Optional[str] = None
    parent_id: Optional[int] = None

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