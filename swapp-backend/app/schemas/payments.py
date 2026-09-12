import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field

class PaymentBase(BaseModel):
    payment_method: str = Field(..., description="Ej: efectivo, mercadopago, transferencia")
    amount: float = Field(..., gt=0, description="El monto debe ser mayor a 0")
    transaction_reference: Optional[str] = None
    payment_status: str = "completed"

class PaymentCreate(PaymentBase):
    pass

class PaymentResponse(PaymentBase):
    payment_id: int
    payment_uuid: uuid.UUID
    order_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)