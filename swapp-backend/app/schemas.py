from pydantic import BaseModel, EmailStr, model_validator
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid

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

class TaxClassResponse(BaseModel):
    tax_class_id: int
    name: str
    rate: float
    is_active: bool

    class Config:
        from_attributes = True

class PriceHistoryResponse(BaseModel):
    history_id: int
    old_value: float
    new_value: float
    changed_at: datetime
    record_type: str

    class Config:
        from_attributes = True

class ProductDiscountCreate(BaseModel):
    product_uuid: uuid.UUID
    name: str
    discount_type: str
    value: float
    start_date: datetime
    end_date: datetime
    is_active: bool = True

class ProductDiscountUpdate(BaseModel):
    name: Optional[str] = None
    discount_type: Optional[str] = None
    value: Optional[float] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    is_active: Optional[bool] = None

class ProductDiscountToggle(BaseModel):
    is_active: bool

class DiscountCreate(BaseModel):
    discount_type: str
    value: float
    start_date: datetime
    end_date: datetime

class DiscountResponse(BaseModel):
    discount_id: int
    product_id: int
    product_uuid: uuid.UUID
    product_name: str
    name: str
    discount_type: str
    value: float
    start_date: datetime
    end_date: datetime
    is_active: bool

    class Config:
        from_attributes = True

class ProductoResponse(BaseModel):
    product_uuid: uuid.UUID
    name: str
    sku: Optional[str] = None
    is_returnable: bool
    
    class Config:
        from_attributes = True

class BrandCreate(BaseModel):
    name: str
    slug: str
    logo_url: Optional[str] = None
    display_order: int = 0
    is_active: bool = True
    featured: bool = False

class BrandUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    logo_url: Optional[str] = None
    display_order: Optional[int] = None
    is_active: Optional[bool] = None
    featured: Optional[bool] = None

class BrandResponse(BaseModel):
    brand_id: int
    name: str
    slug: str
    logo_url: Optional[str] = None
    display_order: int
    is_active: bool
    featured: bool

    class Config:
        from_attributes = True

# --- NUEVO ESQUEMA MULTIMEDIA ---
class ProductMediaResponse(BaseModel):
    media_uuid: uuid.UUID
    media_type: str
    media_subtype: str
    file_url: str
    thumbnail_url: Optional[str] = None
    alt_text: Optional[str] = None
    display_order: int
    is_active: bool

    class Config:
        from_attributes = True
# --------------------------------

class ProductoCatalogoResponse(BaseModel):
    product_uuid: uuid.UUID
    name: str
    slug: str
    is_published: bool
    base_price: float
    is_featured: bool
    sold_count: int
    is_returnable: bool

    sku: Optional[str] = None
    cost_price: Optional[float] = None
    sale_price: Optional[float] = None
    
    description: Optional[str] = None 
    short_description: Optional[str] = None
    stock_quantity: int = 0
    category_id: Optional[int] = None
    tax_class_id: Optional[int] = None
    
    # RELACIÓN AGREGADA
    media: List[ProductMediaResponse] = []

    class Config:
        from_attributes = True

class ProductCreateSchema(BaseModel):
    name: str
    slug: str
    base_price: float
    cost_price: float
    sku: str
    category_id: int
    brand_id: int
    tax_class_id: int

    short_description: Optional[str] = None
    description: Optional[str] = None
    stock_quantity: int = 0
    is_returnable: bool = False
    is_published: bool = False
    is_featured: bool = False

    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    meta_keywords: Optional[str] = None

    max_order_quantity: Optional[int] = None
    weight: Optional[float] = None
    weight_unit: Optional[str] = "kg"
    dimensions: Optional[Dict[str, float]] = None

    download_url: Optional[str] = None
    file_size: Optional[int] = None
    file_extension: Optional[str] = None
    variant_attributes: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True

class ProductUpdateSchema(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    sku: Optional[str] = None
    is_published: Optional[bool] = None
    base_price: Optional[float] = None
    cost_price: Optional[float] = None
    stock_quantity: Optional[int] = None
    is_returnable: Optional[bool] = None
    brand_id: Optional[int] = None
    tax_class_id: Optional[int] = None
    
    class Config:
        from_attributes = True

class CategoryCreate(BaseModel):
    name: str
    slug: str
    parent_id: Optional[int] = None
    display_order: int = 0
    is_active: bool = True

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    parent_id: Optional[int] = None
    display_order: Optional[int] = None
    is_active: Optional[bool] = None

class CategoriaResponse(BaseModel):
    category_id: int
    category_uuid: uuid.UUID
    name: str
    slug: str
    parent_id: Optional[int] = None
    display_order: int
    is_active: bool

    class Config:
        from_attributes = True

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
    movement_type: str
    reason: str
    notes: Optional[str] = None
    unit_cost: Optional[float] = None

    @model_validator(mode='after')
    def validate_purchase_cost(self):
        if self.movement_type == 'purchase' and self.unit_cost is None:
            raise ValueError("El 'unit_cost' es obligatorio cuando se registra una compra ('purchase').")
        return self

class StaffCreate(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    role: str