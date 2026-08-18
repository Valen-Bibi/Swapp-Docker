import uuid
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict

# --- MARCAS ---
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

    model_config = ConfigDict(from_attributes=True)

# --- CATEGORÍAS ---
class CategoryCreate(BaseModel):
    name: str
    slug: str
    parent_id: Optional[int] = None
    image_url: Optional[str] = None
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

    model_config = ConfigDict(from_attributes=True)

# --- IMPUESTOS ---
class TaxClassResponse(BaseModel):
    tax_class_id: int
    name: str
    rate: float
    is_active: bool

    model_config = ConfigDict(from_attributes=True)

# --- MULTIMEDIA ---
class ProductMediaResponse(BaseModel):
    media_uuid: uuid.UUID
    media_type: str
    media_subtype: str
    file_url: str
    thumbnail_url: Optional[str] = None
    alt_text: Optional[str] = None
    display_order: int
    is_active: bool

    model_config = ConfigDict(from_attributes=True)

# --- PRODUCTO NÚCLEO ---
class ProductoResponse(BaseModel):
    product_uuid: uuid.UUID
    name: str
    sku: Optional[str] = None
    is_returnable: bool
    
    model_config = ConfigDict(from_attributes=True)

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

    media: List[ProductMediaResponse] = []

    model_config = ConfigDict(from_attributes=True)

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

    model_config = ConfigDict(from_attributes=True)

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

    model_config = ConfigDict(from_attributes=True)