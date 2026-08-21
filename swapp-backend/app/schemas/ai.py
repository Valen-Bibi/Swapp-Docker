import uuid
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict

from .products import ProductoResponse

class SolicitudResponse(BaseModel):
    analysis_uuid: uuid.UUID
    confidence_score: Optional[float] = None
    status: str
    created_at: datetime
    product: ProductoResponse

    model_config = ConfigDict(from_attributes=True)