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
    client_id = Column(BigInteger, ForeignKey("swapp.clients.client_id", ondelete="RESTRICT"), nullable=False)
    
    delivery_address = Column(Text, nullable=False)
    delivery_zone = Column(String(100), nullable=True)
    
    # Fechas comerciales y operativas
    order_date = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    scheduled_delivery_date = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    status = Column(String(50), nullable=False, default="pending")
    
    # Totales simétricos (Venta vs Costo)
    total_price = Column(Numeric(10, 2), nullable=False, default=0.00)
    total_cost = Column(Numeric(10, 2), nullable=False, server_default="0.00")
    
    logistics_notes = Column(Text, nullable=True)
    
    # Auditoría de sistema
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    created_by = Column(BigInteger, ForeignKey("swapp.staff_users.staff_id"), nullable=True)
    updated_by = Column(BigInteger, ForeignKey("swapp.staff_users.staff_id"), nullable=True)

    # Relaciones
    client = relationship("Client", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    status_history = relationship("OrderStatusHistory", back_populates="order", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="order", cascade="all, delete-orphan")


class OrderItem(Base):
    __tablename__ = "order_items"
    __table_args__ = {"schema": "swapp"}

    item_id = Column(BigInteger, primary_key=True, autoincrement=True)
    order_id = Column(BigInteger, ForeignKey("swapp.orders.order_id", ondelete="CASCADE"), nullable=False)
    product_id = Column(BigInteger, ForeignKey("swapp.products.product_id"), nullable=False)
    variant_id = Column(BigInteger, ForeignKey("swapp.product_variants.variant_id"), nullable=True)
    
    # Descuentos y Promociones
    discount_id = Column(BigInteger, ForeignKey("swapp.product_discounts.discount_id", ondelete="SET NULL"), nullable=True)
    campaign_name = Column(String(255), nullable=True)
    discount_amount = Column(Numeric(10, 2), nullable=False, server_default="0.00")
    
    # Precios, Costos e Impuestos Inmutables
    unit_price = Column(Numeric(10, 2), nullable=False)
    unit_cost = Column(Numeric(10, 2), nullable=False, server_default="0.00")
    internal_unit_price = Column(Numeric(10, 2), nullable=False, server_default="0.00")
    internal_unit_cost = Column(Numeric(10, 2), nullable=False, server_default="0.00")
    
    quantity = Column(Integer, nullable=False)
    
    subtotal_price = Column(Numeric(10, 2), nullable=False)
    subtotal_cost = Column(Numeric(10, 2), nullable=False, server_default="0.00")
    
    tax_rate = Column(Numeric(5, 2), nullable=False, server_default="0.00")
    is_custom_price = Column(Boolean, nullable=False, server_default="false")
    
    # Logística Inversa
    requires_return = Column(Boolean, nullable=False, default=False)
    expected_return_qty = Column(Integer, nullable=False, default=0)
    actual_return_qty = Column(Integer, nullable=False, default=0)
    internal_product_id = Column(BigInteger, ForeignKey("swapp.products.product_id"), nullable=True)
    internal_variant_id = Column(BigInteger, ForeignKey("swapp.product_variants.variant_id"), nullable=True)

    # Relaciones explícitas
    order = relationship("Order", back_populates="items")
    product = relationship("Product", foreign_keys=[product_id], back_populates="order_items")
    variant = relationship("ProductVariant", foreign_keys=[variant_id], back_populates="order_items")
    internal_product = relationship("Product", foreign_keys=[internal_product_id])
    internal_variant = relationship("ProductVariant", foreign_keys=[internal_variant_id])


class OrderStatusHistory(Base):
    __tablename__ = "order_status_history"
    __table_args__ = {"schema": "swapp"}

    history_id = Column(BigInteger, primary_key=True, autoincrement=True)
    order_id = Column(BigInteger, ForeignKey("swapp.orders.order_id", ondelete="CASCADE"), nullable=False)
    old_status = Column(String(50), nullable=False)
    new_status = Column(String(50), nullable=False)
    notes = Column(Text, nullable=True)
    changed_at = Column(DateTime(timezone=True), server_default=func.now())
    changed_by = Column(BigInteger, ForeignKey("swapp.staff_users.staff_id"), nullable=False)

    order = relationship("Order", back_populates="status_history")

class Payment(Base):
    __tablename__ = "payments"
    __table_args__ = {"schema": "swapp"}

    payment_id = Column(BigInteger, primary_key=True, autoincrement=True)
    payment_uuid = Column(UUID(as_uuid=True), default=uuid.uuid4, unique=True, nullable=False)
    order_id = Column(BigInteger, ForeignKey("swapp.orders.order_id", ondelete="CASCADE"), nullable=False)

    payment_method = Column(String(50), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    transaction_reference = Column(String(255), nullable=True) 
    payment_status = Column(String(50), default='completed', nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    created_by = Column(BigInteger, ForeignKey("swapp.staff_users.staff_id"), nullable=False)

    order = relationship("Order", back_populates="payments")
    creator = relationship("staff_users", foreign_keys=[created_by])