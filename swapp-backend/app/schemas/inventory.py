import uuid
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict, model_validator

class PriceHistoryResponse(BaseModel):
    history_id: int
    old_value: float
    new_value: float
    changed_at: datetime
    record_type: str

    model_config = ConfigDict(from_attributes=True)

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

    model_config = ConfigDict(from_attributes=True)

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