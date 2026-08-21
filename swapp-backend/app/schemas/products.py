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

class ProductVariantCreate(BaseModel):
    sku: str
    price: float
    cost_price: float
    stock_quantity: int = 0
    variant_attributes: Optional[Dict[str, Any]] = {}
    low_stock_threshold: Optional[int] = None

class ProductVariantUpdate(BaseModel):
    sku: Optional[str] = None
    price: Optional[float] = None
    cost_price: Optional[float] = None
    stock_quantity: Optional[int] = None
    variant_attributes: Optional[Dict[str, Any]] = None
    low_stock_threshold: Optional[int] = None
    is_active: Optional[bool] = None
    image_url: Optional[str] = None

class ProductVariantResponse(BaseModel):
    variant_id: int
    variant_uuid: uuid.UUID
    sku: str
    price: float
    cost_price: float
    stock_quantity: int
    low_stock_threshold: int
    variant_attributes: Optional[Dict[str, Any]] = None
    is_active: bool
    model_config = ConfigDict(from_attributes=True)
    image_url: Optional[str] = None

class ProductoResponse(BaseModel):
    product_uuid: uuid.UUID
    name: str
    is_returnable: bool
    
    model_config = ConfigDict(from_attributes=True)

class ProductoCatalogoResponse(BaseModel):
    product_uuid: uuid.UUID
    name: str
    slug: str
    is_published: bool
    is_featured: bool
    sold_count: int
    is_returnable: bool
    reference_price: Optional[float] = None
    reference_cost: Optional[float] = None

    description: Optional[str] = None
    short_description: Optional[str] = None
    category_id: Optional[int] = None
    tax_class_id: Optional[int] = None

    brand_id: Optional[int] = None
    brand: Optional[BrandResponse] = None

    variants: List[ProductVariantResponse] = []
    media: List[ProductMediaResponse] = []

    model_config = ConfigDict(from_attributes=True)

class ProductCreateSchema(BaseModel):
    name: str
    slug: str
    category_id: int
    brand_id: int
    tax_class_id: int
    base_price: Optional[float] = 0.0
    cost_price: Optional[float] = 0.0

    short_description: Optional[str] = None
    description: Optional[str] = None
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

    model_config = ConfigDict(from_attributes=True)

class ProductUpdateSchema(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    
    category_id: Optional[int] = None
    brand_id: Optional[int] = None
    tax_class_id: Optional[int] = None
    reference_price: Optional[float] = None
    reference_cost: Optional[float] = None
    
    short_description: Optional[str] = None
    description: Optional[str] = None

    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    meta_keywords: Optional[str] = None
    
    max_order_quantity: Optional[int] = None
    weight: Optional[float] = None
    weight_unit: Optional[str] = None
    dimensions: Optional[Dict[str, float]] = None
    
    download_url: Optional[str] = None
    file_size: Optional[int] = None
    file_extension: Optional[str] = None

    is_published: Optional[bool] = None
    is_featured: Optional[bool] = None
    is_returnable: Optional[bool] = None

    model_config = ConfigDict(from_attributes=True)