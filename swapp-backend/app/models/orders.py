import uuid
from sqlalchemy import Column, String, Integer, ForeignKey, DateTime, Boolean, Text, BigInteger, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base

class Order(Base):
    __tablename__ = "orders"
    __table_args__ = {"schema": "swapp"}

    order_id = Column(BigInteger, primary_key=True, autoincrement=True)
    order_uuid = Column(UUID(as_uuid=True), default=uuid.uuid4, unique=True, nullable=False)
    
    customer_name = Column(String(150), nullable=False)
    customer_phone = Column(String(50), nullable=False)
    customer_email = Column(String(255), nullable=True)
    delivery_address = Column(Text, nullable=False)
    delivery_zone = Column(String(100), nullable=True)
    scheduled_delivery_date = Column(DateTime(timezone=True), nullable=True)
    
    status = Column(String(50), default='pending', nullable=False) 
    total_amount = Column(Numeric(10, 2), default=0.0, nullable=False)
    
    logistics_notes = Column(Text, nullable=True)
    

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    created_by = Column(BigInteger, ForeignKey("swapp.staff_users.staff_id"))

    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    creator = relationship("staff_users", foreign_keys=[created_by])


class OrderItem(Base):
    __tablename__ = "order_items"
    __table_args__ = {"schema": "swapp"}

    item_id = Column(BigInteger, primary_key=True, autoincrement=True)
    order_id = Column(BigInteger, ForeignKey("swapp.orders.order_id", ondelete="CASCADE"), nullable=False)
    
    product_id = Column(BigInteger, ForeignKey("swapp.products.product_id"), nullable=False)
    variant_id = Column(BigInteger, ForeignKey("swapp.product_variants.variant_id"), nullable=True)
    discount_id = Column(BigInteger, ForeignKey("swapp.product_discounts.discount_id", ondelete="SET NULL"), nullable=True)
    campaign_name = Column(String(255), nullable=True)
    discount_amount = Column(Numeric(10, 2), default=0.0)
    
    unit_price = Column(Numeric(10, 2), nullable=False)
    quantity = Column(Integer, nullable=False)
    subtotal = Column(Numeric(10, 2), nullable=False)

    requires_return = Column(Boolean, default=False, nullable=False)
    expected_return_qty = Column(Integer, default=0, nullable=False)
    actual_return_qty = Column(Integer, default=0, nullable=False)

    order = relationship("Order", back_populates="items")
    product = relationship("Product")
    variant = relationship("ProductVariant")