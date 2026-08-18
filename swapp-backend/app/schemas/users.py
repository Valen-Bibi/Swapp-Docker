import uuid
from typing import Optional
from pydantic import BaseModel, EmailStr, ConfigDict

class UserCreate(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    password: str
    role: str = "user"

class UsuarioResponse(BaseModel):
    user_uuid: uuid.UUID
    first_name: str
    last_name: str
    email: str
    role: str

    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str

class StaffCreate(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    role: str