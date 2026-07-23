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

class Token(BaseModel):
    access_token: str
    token_type: str

# --- PRODUCTOS ---
class ProductoResponse(BaseModel):
    product_uuid: uuid.UUID
    name: str
    sku: Optional[str] = None
    is_returnable: bool
    
    class Config:
        from_attributes = True

class BrandResponse(BaseModel):
    brand_id: int
    name: str

    class Config:
        from_attributes = True

class ProductoCatalogoResponse(BaseModel):
    product_uuid: uuid.UUID
    name: str
    slug: str
    sku: Optional[str] = None
    is_published: bool
    cost_price: Optional[float] = None
    base_price: float
    sale_price: Optional[float] = None
    main_image_url: Optional[str] = None
    is_featured: bool
    sold_count: int
    description: Optional[str] = None 
    short_description: Optional[str] = None
    stock_quantity: int = 0
    category_id: Optional[int] = None
    is_returnable: bool

    class Config:
        from_attributes = True

class ProductCreateSchema(BaseModel):
    name: str
    slug: str
    sku: Optional[str] = None
    short_description: Optional[str] = None
    description: Optional[str] = None
    base_price: float
    stock_quantity: int = 0
    is_returnable: bool = False
    is_published: bool = False
    is_featured: bool = False
    brand_id: Optional[int] = None

    class Config:
        from_attributes = True

class ProductUpdateSchema(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None             # Añadido
    sku: Optional[str] = None              # Añadido
    main_image_url: Optional[str] = None   # Añadido
    is_published: Optional[bool] = None    # Añadido
    base_price: Optional[float] = None
    sale_price: Optional[float] = None
    cost_price: Optional[float] = None
    stock_quantity: Optional[int] = None
    is_returnable: Optional[bool] = None
    brand_id: Optional[int] = None
    
    class Config:
        from_attributes = True

class CategoriaResponse(BaseModel):
    category_id: int
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

class ProductMovementCreate(BaseModel):
    quantity: int
    reason: str
    notes: Optional[str] = None

class StaffCreate(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    role: str