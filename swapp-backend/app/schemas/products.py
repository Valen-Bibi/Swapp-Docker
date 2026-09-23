import uuid
from typing import Optional, List, Dict, Any, Literal
from pydantic import BaseModel, ConfigDict, Field
from enum import Enum

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

class CategoryResponse(BaseModel):
    category_id: int
    category_uuid: uuid.UUID
    name: str
    slug: str
    parent_id: Optional[int] = None
    display_order: int
    is_active: bool

    model_config = ConfigDict(from_attributes=True)

class TaxClassResponse(BaseModel):
    tax_class_id: int
    name: str
    rate: float
    is_active: bool

    model_config = ConfigDict(from_attributes=True)

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
    refill_price: Optional[float] = None
    stock_quantity: int = 0
    variant_attributes: Optional[Dict[str, Any]] = Field(default_factory=dict)
    low_stock_threshold: Optional[int] = None

class ProductVariantUpdate(BaseModel):
    sku: Optional[str] = None
    price: Optional[float] = None
    cost_price: Optional[float] = None
    refill_price: Optional[float] = None
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
    refill_price: Optional[float] = None 
    stock_quantity: int
    low_stock_threshold: int
    variant_attributes: Optional[Dict[str, Any]] = None
    is_active: bool
    model_config = ConfigDict(from_attributes=True)
    image_url: Optional[str] = None

class ProductResponse(BaseModel):
    product_id: int
    product_uuid: uuid.UUID
    name: str
    model: Optional[str] = None
    has_variants: bool
    is_returnable: bool
    is_internal: bool
    
    model_config = ConfigDict(from_attributes=True)

class ProductCatalogResponse(BaseModel):
    product_id: int
    product_uuid: uuid.UUID
    name: str
    model: Optional[str] = None
    has_variants: bool
    slug: str
    is_published: bool
    is_featured: bool
    sold_count: int
    is_internal: Optional[bool] = False
    linked_internal_product_id: Optional[int] = None
    is_returnable: bool
    is_active: bool

    description: Optional[str] = None
    short_description: Optional[str] = None
    category_id: Optional[int] = None
    tax_class_id: Optional[int] = None

    brand_id: Optional[int] = None
    brand: Optional[BrandResponse] = None

    variants: List[ProductVariantResponse] = Field(default_factory=list)
    media: List[ProductMediaResponse] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)

class ProductCreate(BaseModel):
    name: str
    slug: str
    model: Optional[str] = None
    has_variants: bool = False

    category_id: int
    brand_id: int
    tax_class_id: int
    
    short_description: Optional[str] = None
    description: Optional[str] = None
    is_returnable: bool = False
    is_internal: Optional[bool] = False
    is_published: bool = False
    is_featured: bool = False
    custom_attributes: Optional[Dict[str, str]] = None

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

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    model: Optional[str] = None
    has_variants: Optional[bool] = None
    
    category_id: Optional[int] = None
    brand_id: Optional[int] = None
    tax_class_id: Optional[int] = None
    is_internal: Optional[bool] = None
    linked_internal_product_id: Optional[int] = None
    
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
    is_active: Optional[bool] = None

    model_config = ConfigDict(from_attributes=True)

class AttributeValueBase(BaseModel):
    value: str
    display_order: int = 0

class AttributeValueCreate(AttributeValueBase):
    pass

class AttributeValueResponse(AttributeValueBase):
    value_id: int
    value_uuid: uuid.UUID
    is_active: bool
    
    model_config = ConfigDict(from_attributes=True)

class AttributeBase(BaseModel):
    name: str
    is_variant: bool = False

class AttributeCreate(AttributeBase):
    values: List[str] = Field(default_factory=list) 

class AttributeUpdate(BaseModel):
    name: Optional[str] = None
    is_variant: Optional[bool] = None
    is_active: Optional[bool] = None

class AttributeResponse(AttributeBase):
    attribute_id: int
    attribute_uuid: uuid.UUID
    is_active: bool
    values: List[AttributeValueResponse] = Field(default_factory=list)
    
    model_config = ConfigDict(from_attributes=True)

class SubcategoryAttributeLink(BaseModel):
    attribute_id: int
    is_required: bool = False

class CategoryArchiveRequest(BaseModel):
    action: Literal["archive_products", "reassign"]
    new_category_id: Optional[int] = None

class CategoryReorderItem(BaseModel):
    category_id: int
    display_order: int

class CategoryReorderRequest(BaseModel):
    categories: List[CategoryReorderItem]

class RelationshipType(str, Enum):
    container_return = "container_return"
    bundle_component = "bundle_component"
    complementary = "complementary"
    substitute = "substitute"
    cross_sell = "cross_sell"
    up_sell = "up_sell"
    co_branding = "co_branding"

class ProductRelationshipItem(BaseModel):
    target_product_uuid: uuid.UUID
    relationship_type: RelationshipType

class ProductRelationshipsBulkUpdate(BaseModel):
    relationships: List[ProductRelationshipItem]

class ProductRelationshipResponse(BaseModel):
    relationship_id: int
    relationship_uuid: uuid.UUID
    target_product_uuid: uuid.UUID
    target_product_name: str
    relationship_type: str
    priority: int