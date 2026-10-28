import uuid
from datetime import datetime
from typing import Optional, List, Dict
from pydantic import BaseModel, ConfigDict, Field, AliasChoices
from .clients import ClientResponse
from .payments import PaymentResponse

class OrderItemCreate(BaseModel):
    product_id: int
    variant_id: Optional[int] = None
    internal_product_id: Optional[int] = None
    internal_variant_id: Optional[int] = None
    quantity: int
    
    # Precios y Costos (unit_cost e internal_unit_cost son opcionales por si algún día querés forzarlos manualmente)
    unit_price: float
    unit_cost: Optional[float] = None
    internal_unit_price: float = Field(
        default=0.0,
        validation_alias=AliasChoices("internal_unit_price", "custom_refill_price")
    )
    internal_unit_cost: Optional[float] = None
    
    subtotal_price: float = Field(
        validation_alias=AliasChoices("subtotal_price", "subtotal")
    )
    is_custom_price: bool = False
    
    requires_return: bool = False
    expected_return_qty: int = 0
    
    discount_id: Optional[int] = None
    campaign_name: Optional[str] = None
    discount_amount: float = 0.0

class OrderItemUpdate(BaseModel):
    actual_return_qty: Optional[int] = None

class OrderItemResponse(BaseModel):
    item_id: int
    order_id: int
    product_id: int
    variant_id: Optional[int] = None
    internal_product_id: Optional[int] = None
    internal_variant_id: Optional[int] = None
    
    unit_price: float
    unit_cost: float
    internal_unit_price: float
    internal_unit_cost: float
    
    quantity: int
    subtotal_price: float
    subtotal_cost: float
    
    tax_rate: float
    is_custom_price: bool
    
    requires_return: bool
    expected_return_qty: int
    actual_return_qty: int
    
    discount_id: Optional[int] = None
    campaign_name: Optional[str] = None
    discount_amount: float

    model_config = ConfigDict(from_attributes=True)

class OrderCreate(BaseModel):
    client_id: int
    delivery_address: str
    delivery_zone: Optional[str] = None
    order_date: Optional[datetime] = None
    scheduled_delivery_date: Optional[datetime] = None
    logistics_notes: Optional[str] = None
    
    total_price: float = Field(
        validation_alias=AliasChoices("total_price", "total_amount")
    )
    
    items: List[OrderItemCreate]

class OrderUpdate(BaseModel):
    status: Optional[str] = None
    delivery_address: Optional[str] = None
    delivery_zone: Optional[str] = None
    order_date: Optional[datetime] = None
    scheduled_delivery_date: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    logistics_notes: Optional[str] = None
    total_price: Optional[float] = Field(
        default=None,
        validation_alias=AliasChoices("total_price", "total_amount")
    )

class OrderStatusUpdate(BaseModel):
    new_status: str
    actual_returns: Optional[Dict[int, int]] = None
    notes: Optional[str] = None

class OrderClientInfo(BaseModel):
    first_name: str
    last_name: str
    whatsapp_number: str

    model_config = ConfigDict(from_attributes=True)

class OrderResponse(BaseModel):
    order_id: int
    order_uuid: uuid.UUID
    client_id: int
    client: Optional[OrderClientInfo] = None
    delivery_address: str
    delivery_zone: Optional[str] = None
    status: str
    
    total_price: float
    total_cost: float
    
    order_date: datetime
    scheduled_delivery_date: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    logistics_notes: Optional[str] = None
    
    created_at: datetime
    updated_at: datetime
    created_by: Optional[int] = None
    updated_by: Optional[int] = None
    
    items: List[OrderItemResponse] = []
    payments: List[PaymentResponse] = []

    model_config = ConfigDict(from_attributes=True)