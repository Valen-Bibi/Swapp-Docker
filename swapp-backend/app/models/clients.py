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
    
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    dni = Column(String(20), nullable=True)
    whatsapp_number = Column(String(50), unique=True, nullable=False)
    email = Column(String(255), nullable=True)
    
    default_delivery_address = Column(Text, nullable=False)
    default_delivery_zone = Column(String(100), nullable=False)

    metrics = Column(JSONB, default=dict, nullable=False)
    
    is_active = Column(Boolean, default=True, nullable=False)
    
    user_id = Column(BigInteger, ForeignKey("swapp.users.user_id", ondelete="SET NULL"), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    created_by = Column(BigInteger, ForeignKey("swapp.staff_users.staff_id"), nullable=True)
    updated_by = Column(BigInteger, ForeignKey("swapp.staff_users.staff_id"), nullable=True)

    orders = relationship("Order", back_populates="client")
    user = relationship("User", foreign_keys=[user_id])
    creator = relationship("staff_users", foreign_keys=[created_by])
    updater = relationship("staff_users", foreign_keys=[updated_by])

class ClientContainerLedger(Base):
    __tablename__ = "client_container_ledger"
    __table_args__ = {"schema": "swapp"}

    ledger_id = Column(BigInteger, primary_key=True, autoincrement=True)
    ledger_uuid = Column(UUID(as_uuid=True), default=uuid.uuid4, unique=True)
    
    client_id = Column(BigInteger, ForeignKey("swapp.clients.client_id", ondelete="CASCADE"), nullable=False)
    product_id = Column(BigInteger, ForeignKey("swapp.products.product_id"), nullable=False) 
    
    # Opcional: Para saber en qué pedido ocurrió este movimiento
    order_id = Column(BigInteger, ForeignKey("swapp.orders.order_id"), nullable=True)
    
    # Ej: 'delivery' (entregás lleno), 'return' (devuelve vacío), 'absorption' (trae tubo propio)
    transaction_type = Column(String(50), nullable=False) 
    
    # El valor mágico: +1 (se lo queda el cliente), -1 (te lo devuelve)
    quantity_change = Column(Integer, nullable=False)

    # Para auditoría
    staff_id = Column(BigInteger, ForeignKey("swapp.staff_users.staff_id"), nullable=True)
    
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relaciones
    client = relationship("Client", backref="container_movements")
    product = relationship("Product")
    order = relationship("Order")