import uuid
from typing import Optional, Dict, Any, List, Literal
from pydantic import BaseModel, ConfigDict, EmailStr, Field, model_validator
from datetime import datetime

class ClientAddressBase(BaseModel):
    address_line: str = Field(..., max_length=255)
    has_street_number: bool = True
    province: Optional[str] = Field(None, max_length=100)
    locality: Optional[str] = Field(None, max_length=100)
    zip_code: Optional[str] = Field(None, max_length=20)
    apartment_lot: Optional[str] = Field(None, max_length=100)
    is_default: bool = False
    notes: Optional[str] = None

class ClientAddressCreate(ClientAddressBase):
    pass

class ClientAddressResponse(ClientAddressBase):
    address_id: int
    address_uuid: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ClientBase(BaseModel):
    client_type: Literal['consumer', 'business'] = 'consumer'
    first_name: Optional[str] = Field(None, max_length=100)
    last_name: Optional[str] = Field(None, max_length=100)
    dni: Optional[str] = Field(None, max_length=20)
    
    company_name: Optional[str] = Field(None, max_length=150)
    cuit: Optional[str] = Field(None, max_length=20)
    
    whatsapp_number: Optional[str] = Field(None, max_length=50)
    email: Optional[EmailStr] = None
    
    # Conservado por compatibilidad legacy
    default_delivery_address: Optional[str] = None
    default_delivery_zone: Optional[str] = Field(None, max_length=100)

class ClientCreate(ClientBase):
    addresses: List[ClientAddressCreate] = Field(default_factory=list)

    @model_validator(mode='after')
    def validate_client_type_fields(self) -> 'ClientCreate':
        if self.client_type == 'consumer':
            if not self.first_name or not self.last_name:
                raise ValueError("Nombre y Apellido son requeridos para Consumidores Finales.")
        elif self.client_type == 'business':
            if not self.company_name or not self.cuit:
                raise ValueError("Razón Social y CUIT son requeridos para Responsables Inscriptos.")
        return self

class ClientUpdate(ClientBase):
    client_type: Optional[Literal['consumer', 'business']] = None
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
    
    addresses: List[ClientAddressResponse] = []

    model_config = ConfigDict(from_attributes=True)