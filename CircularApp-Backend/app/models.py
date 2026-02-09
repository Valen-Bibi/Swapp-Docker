import uuid
from sqlalchemy import Column, String, Integer, Float, ForeignKey, DateTime, Boolean, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class Usuario(Base):
    __tablename__ = "usuario"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    usuario = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    rol = Column(String, default="cliente")
    is_active = Column(Boolean, default=True)
    
    solicitudes = relationship("Solicitud", back_populates="usuario", cascade="all, delete-orphan")

class Producto(Base):
    __tablename__ = "producto"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nombre = Column(String, index=True, nullable=False)
    sku = Column(String, unique=True, index=True)
    descripcion = Column(Text, nullable=True)
    
    solicitudes = relationship("Solicitud", back_populates="producto")

class Solicitud(Base):
    __tablename__ = "solicitud"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    usuario_id = Column(UUID(as_uuid=True), ForeignKey("usuario.id"), nullable=False)
    producto_id = Column(UUID(as_uuid=True), ForeignKey("producto.id"), nullable=False)
    
    fecha_hora = Column(DateTime, default=datetime.utcnow)
    estado = Column(String, default="pendiente")
    cant_devuelta = Column(Integer, default=1)

    foto_url = Column(String, nullable=True)
    confianza = Column(Float)
    
    usuario = relationship("Usuario", back_populates="solicitudes") 
    producto = relationship("Producto", back_populates="solicitudes")