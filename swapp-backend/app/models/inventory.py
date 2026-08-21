import uuid
from sqlalchemy import Column, String, Integer, ForeignKey, DateTime, Boolean, Text, BigInteger, Numeric
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base

class ProductPriceHistory(Base):
    __tablename__ = "product_price_history"
    __table_args__ = {"schema": "swapp"}

    history_id = Column(BigInteger, primary_key=True, autoincrement=True)
    product_id = Column(BigInteger, ForeignKey('swapp.products.product_id', ondelete="CASCADE"), nullable=False)
    variant_id = Column(BigInteger, ForeignKey('swapp.product_variants.variant_id', ondelete="CASCADE"), nullable=True)
    old_value = Column(Numeric(10, 2), nullable=False)
    new_value = Column(Numeric(10, 2), nullable=False)
    changed_at = Column(DateTime(timezone=True), server_default=func.now())
    record_type = Column(String(20), default="base_price", nullable=False)
    
    product = relationship("Product", back_populates="price_history")
    variant = relationship("ProductVariant", backref="price_history")


class ProductDiscount(Base):
    __tablename__ = "product_discounts"
    __table_args__ = {"schema": "swapp"}

    discount_id = Column(BigInteger, primary_key=True, autoincrement=True)
    product_id = Column(BigInteger, ForeignKey("swapp.products.product_id", ondelete="CASCADE"), nullable=False)
    
    # --- MODIFICADO: Ahora es un ARRAY para múltiples variantes ---
    variant_ids = Column(ARRAY(BigInteger), nullable=True)
    
    name = Column(String(255), nullable=False) 
    discount_type = Column(String(20), nullable=False) 
    value = Column(Numeric(10, 2), nullable=False)
    start_date = Column(DateTime(timezone=True), nullable=False)
    end_date = Column(DateTime(timezone=True), nullable=False)
    is_active = Column(Boolean, default=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    product = relationship("Product", back_populates="discounts")


class InventoryMovement(Base):
    __tablename__ = "inventory_movements"
    __table_args__ = {"schema": "swapp"}

    movement_id = Column(BigInteger, primary_key=True, index=True)
    movement_uuid = Column(UUID(as_uuid=True), default=uuid.uuid4, unique=True)
    product_id = Column(BigInteger, ForeignKey("swapp.products.product_id", ondelete="CASCADE"), nullable=False)
    variant_id = Column(BigInteger, ForeignKey("swapp.product_variants.variant_id", ondelete="CASCADE"), nullable=False)
    
    movement_type = Column(String(20), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_cost = Column(Numeric(10, 2), nullable=True)
    stock_before = Column(Integer)
    stock_after = Column(Integer)
    
    reference_id = Column(BigInteger)
    reference_type = Column(String(50))
    
    reason = Column(Text)
    notes = Column(Text)
    
    created_by = Column(BigInteger, ForeignKey("swapp.staff_users.staff_id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    movement_metadata = Column("metadata", JSONB, server_default='{}')

    product = relationship("Product", back_populates="inventory_movements")
    variant = relationship("ProductVariant")
    user = relationship("staff_users", foreign_keys=[created_by])