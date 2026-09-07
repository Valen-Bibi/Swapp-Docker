import uuid
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict

from .products import ProductResponse

class AnalysisResponse(BaseModel):
    analysis_uuid: uuid.UUID
    confidence_score: Optional[float] = None
    status: str
    created_at: datetime
    product: ProductResponse

    model_config = ConfigDict(from_attributes=True)