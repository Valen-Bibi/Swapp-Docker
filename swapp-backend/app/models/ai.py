import uuid
from sqlalchemy import Column, String, Integer, ForeignKey, DateTime, Text, BigInteger, Numeric
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base

class UserImageAnalysis(Base):
    __tablename__ = "user_image_analyses"
    __table_args__ = {"schema": "swapp"}

    analysis_id = Column(BigInteger, primary_key=True, autoincrement=True)
    analysis_uuid = Column(UUID(as_uuid=True), default=uuid.uuid4, unique=True, nullable=False)
    user_id = Column(BigInteger, ForeignKey("swapp.users.user_id", ondelete="CASCADE"), nullable=False)
    product_id = Column(BigInteger, ForeignKey("swapp.products.product_id", ondelete="SET NULL"), nullable=True)
    
    image_url = Column(Text, nullable=False)
    thumbnail_url = Column(Text)
    original_filename = Column(String(255))
    file_size = Column(BigInteger)
    mime_type = Column(String(100))
    image_width = Column(Integer)
    image_height = Column(Integer)
    upload_timestamp = Column(DateTime(timezone=True), server_default=func.now())
    
    recognition_status = Column(String(50), default="pending")
    recognized_product_id = Column(BigInteger, ForeignKey("swapp.products.product_id", ondelete="SET NULL"), nullable=True)
    confidence_score = Column(Numeric(5,4))
    
    modelarts_response = Column(JSONB)
    modelarts_request_id = Column(String(255))
    modelarts_processing_time = Column(Integer)
    modelarts_model_version = Column(String(50))
    
    detection_details = Column(JSONB)
    alternative_matches = Column(JSONB)
    detected_labels = Column(ARRAY(Text))
    detected_objects = Column(JSONB)
    exif_data = Column(JSONB)
    geolocation = Column(JSONB)
    
    user_feedback = Column(String(20))
    user_corrected_product_id = Column(BigInteger, ForeignKey("swapp.products.product_id", ondelete="SET NULL"), nullable=True)
    user_feedback_comment = Column(Text)
    user_feedback_at = Column(DateTime(timezone=True))
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    meta_data = Column("metadata", JSONB, default={})
    
    user = relationship("User", back_populates="analyses")
    product = relationship("Product", foreign_keys=[product_id], back_populates="analyses")