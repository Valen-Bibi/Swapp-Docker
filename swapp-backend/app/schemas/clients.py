import uuid
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from datetime import datetime

class ClientBase(BaseModel):
    first_name: str = Field(..., max_length=100)
    last_name: str = Field(..., max_length=100)
    dni: Optional[str] = Field(None, max_length=20)
    whatsapp_number: str = Field(..., max_length=50)
    email: Optional[EmailStr] = None
    default_delivery_address: str
    default_delivery_zone: str = Field(..., max_length=100)

class ClientCreate(ClientBase):
    pass

class ClientUpdate(BaseModel):
    first_name: Optional[str] = Field(None, max_length=100)
    last_name: Optional[str] = Field(None, max_length=100)
    dni: Optional[str] = Field(None, max_length=20)
    whatsapp_number: Optional[str] = Field(None, max_length=50)
    email: Optional[EmailStr] = None
    default_delivery_address: Optional[str] = None
    default_delivery_zone: Optional[str] = Field(None, max_length=100)
    is_active: Optional[bool] = None
    metrics: Optional[Dict[str, Any]] = None

class ClientResponse(ClientBase):
    client_id: int
    client_uuid: uuid.UUID
    is_active: bool
    metrics: Dict[str, Any]
    user_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ClientSearchResponse(BaseModel):
    client_id: int
    client_uuid: uuid.UUID
    first_name: str
    last_name: str
    whatsapp_number: str
    default_delivery_address: str
    default_delivery_zone: str

    model_config = ConfigDict(from_attributes=True)