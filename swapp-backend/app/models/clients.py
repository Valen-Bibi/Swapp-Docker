import uuid
from sqlalchemy import Column, String, Boolean, Text, Integer, BigInteger, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base

class Client(Base):
    __tablename__ = "clients"
    __table_args__ = {"schema": "swapp"}

    client_id = Column(BigInteger, primary_key=True, autoincrement=True)
    client_uuid = Column(UUID(as_uuid=True), default=uuid.uuid4, unique=True, nullable=False)
    
    client_type = Column(String(50), nullable=False, server_default="consumer")
    
    first_name = Column(String(100), nullable=True)
    last_name = Column(String(100), nullable=True)
    dni = Column(String(20), nullable=True)

    company_name = Column(String(150), nullable=True)
    cuit = Column(String(20), nullable=True)
    
    whatsapp_number = Column(String(50), unique=True, nullable=True)
    email = Column(String(255), nullable=True)
    
    # Legacy: Se mantienen para no romper consultas viejas por ahora, 
    # pero las direcciones reales vivirán en ClientAddress.
    default_delivery_address = Column(Text, nullable=True)
    default_delivery_zone = Column(String(100), nullable=True)

    metrics = Column(JSONB, default=dict, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    
    user_id = Column(BigInteger, ForeignKey("swapp.users.user_id", ondelete="SET NULL"), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    created_by = Column(BigInteger, ForeignKey("swapp.staff_users.staff_id"), nullable=True)
    updated_by = Column(BigInteger, ForeignKey("swapp.staff_users.staff_id"), nullable=True)

    orders = relationship("Order", back_populates="client")
    addresses = relationship("ClientAddress", back_populates="client", cascade="all, delete-orphan")
    user = relationship("User", foreign_keys=[user_id])
    creator = relationship("staff_users", foreign_keys=[created_by])
    updater = relationship("staff_users", foreign_keys=[updated_by])


class ClientAddress(Base):
    __tablename__ = "client_addresses"
    __table_args__ = {"schema": "swapp"}

    address_id = Column(BigInteger, primary_key=True, autoincrement=True)
    address_uuid = Column(UUID(as_uuid=True), default=uuid.uuid4, unique=True, nullable=False)
    client_id = Column(BigInteger, ForeignKey("swapp.clients.client_id", ondelete="CASCADE"), nullable=False)
    
    address_line = Column(String(255), nullable=False)
    has_street_number = Column(Boolean, default=True, nullable=False)
    province = Column(String(100), nullable=True)
    locality = Column(String(100), nullable=True)
    zip_code = Column(String(20), nullable=True)
    apartment_lot = Column(String(100), nullable=True)
    
    is_default = Column(Boolean, default=False, nullable=False)
    notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    client = relationship("Client", back_populates="addresses")


class ClientContainerLedger(Base):
    __tablename__ = "client_container_ledger"
    __table_args__ = {"schema": "swapp"}

    ledger_id = Column(BigInteger, primary_key=True, autoincrement=True)
    ledger_uuid = Column(UUID(as_uuid=True), default=uuid.uuid4, unique=True)
    
    client_id = Column(BigInteger, ForeignKey("swapp.clients.client_id", ondelete="CASCADE"), nullable=False)
    product_id = Column(BigInteger, ForeignKey("swapp.products.product_id"), nullable=False) 
    
    order_id = Column(BigInteger, ForeignKey("swapp.orders.order_id"), nullable=True)
    transaction_type = Column(String(50), nullable=False) 
    quantity_change = Column(Integer, nullable=False)
    staff_id = Column(BigInteger, ForeignKey("swapp.staff_users.staff_id"), nullable=True)
    
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    client = relationship("Client", backref="container_movements")
    product = relationship("Product")
    order = relationship("Order")