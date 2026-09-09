import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from .clients import ClientResponse

class OrderItemCreate(BaseModel):
    product_id: int
    variant_id: Optional[int] = None
    quantity: int
    
    unit_price: float
    subtotal: float
    
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
    unit_price: float
    quantity: int
    subtotal: float
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
    scheduled_delivery_date: Optional[datetime] = None
    logistics_notes: Optional[str] = None
    
    total_amount: float
    
    items: List[OrderItemCreate]

class OrderUpdate(BaseModel):
    status: Optional[str] = None
    delivery_address: Optional[str] = None
    delivery_zone: Optional[str] = None
    scheduled_delivery_date: Optional[datetime] = None
    logistics_notes: Optional[str] = None
    total_amount: Optional[float] = None

class OrderClientInfo(BaseModel):
    first_name: str
    last_name: str
    whatsapp_number: str

    model_config = ConfigDict(from_attributes=True)

class OrderResponse(BaseModel):
    order_id: int
    order_uuid: uuid.UUID
    client_id: int
    client: Optional[ClientResponse] = None
    delivery_address: str
    delivery_zone: Optional[str] = None
    status: str
    total_amount: float
    scheduled_delivery_date: Optional[datetime] = None
    logistics_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    items: List[OrderItemResponse] = []

    model_config = ConfigDict(from_attributes=True)