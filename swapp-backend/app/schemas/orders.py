import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict

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
    customer_name: str
    customer_phone: str
    customer_email: Optional[str] = None
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

class OrderResponse(BaseModel):
    order_id: int
    order_uuid: uuid.UUID
    customer_name: str
    customer_phone: str
    customer_email: Optional[str] = None
    delivery_address: str
    delivery_zone: Optional[str] = None
    status: str
    total_amount: float
    logistics_notes: Optional[str] = None
    scheduled_delivery_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    created_by: Optional[int] = None
    
    items: List[OrderItemResponse] = []

    model_config = ConfigDict(from_attributes=True)