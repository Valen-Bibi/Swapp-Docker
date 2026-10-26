import uuid
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict, Field

class PublicBrandResponse(BaseModel):
    brand_id: int
    name: str
    slug: str
    logo_url: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class PublicProductMediaResponse(BaseModel):
    media_uuid: uuid.UUID
    media_type: str
    media_subtype: str
    file_url: str
    thumbnail_url: Optional[str] = None
    alt_text: Optional[str] = None
    display_order: int
    is_active: bool

    model_config = ConfigDict(from_attributes=True)

class PublicProductVariantResponse(BaseModel):
    variant_id: int
    variant_uuid: uuid.UUID
    sku: str
    price: float
    stock_quantity: int
    variant_attributes: Optional[Dict[str, Any]] = None
    image_url: Optional[str] = None
    is_active: bool

    model_config = ConfigDict(from_attributes=True)

class ExchangeOptionResponse(BaseModel):
    internal_product_uuid: uuid.UUID
    internal_variant_uuid: uuid.UUID
    sku: str
    price: float
    is_available: bool

class PublicProductCatalogResponse(BaseModel):
    product_id: int
    product_uuid: uuid.UUID
    name: str
    model: Optional[str] = None
    slug: str
    has_variants: bool
    is_returnable: bool
    is_featured: bool
    description: Optional[str] = None
    short_description: Optional[str] = None
    category_id: Optional[int] = None
    brand_id: Optional[int] = None
    brand: Optional[PublicBrandResponse] = None
    variants: List[PublicProductVariantResponse] = Field(default_factory=list)
    media: List[PublicProductMediaResponse] = Field(default_factory=list)
    exchange_option: Optional[ExchangeOptionResponse] = None
    tax_rate: float = 0.0

    model_config = ConfigDict(from_attributes=True)