import uuid
from sqlalchemy import Column, String, Integer, Float, ForeignKey, DateTime, Boolean, Text, BigInteger, Numeric
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class User(Base):
    __tablename__ = "users"
    __table_args__ = {"schema": "swapp"}

    user_id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_uuid = Column(UUID(as_uuid=True), default=uuid.uuid4, unique=True, nullable=False)
    
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    username = Column(String(50), unique=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), default="user", nullable=False)
    is_active = Column(Boolean, default=True)
    
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    
    analyses = relationship("UserImageAnalysis", back_populates="user", cascade="all, delete-orphan")


# --- NUEVA TABLA: MARCAS ---
class Brand(Base):
    __tablename__ = "brands"
    __table_args__ = {"schema": "swapp"}

    brand_id = Column(BigInteger, primary_key=True, autoincrement=True)
    brand_uuid = Column(UUID(as_uuid=True), default=uuid.uuid4, unique=True, nullable=False)
    name = Column(String(100), nullable=False, unique=True)
    slug = Column(String(120), nullable=False, unique=True)
    description = Column(Text, nullable=True)
    logo_url = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    
    products = relationship("Product", back_populates="brand")


# --- CATEGORÍAS ACTUALIZADAS CON JERARQUÍA ---
class ProductCategory(Base):
    __tablename__ = "product_categories"
    __table_args__ = {"schema": "swapp"}

    category_id = Column(BigInteger, primary_key=True, autoincrement=True)
    category_uuid = Column(UUID(as_uuid=True), default=uuid.uuid4, unique=True, nullable=False)
    
    name = Column(String(100), nullable=False)
    slug = Column(String(120), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    parent_id = Column(BigInteger, ForeignKey("swapp.product_categories.category_id"), nullable=True)
    level = Column(Integer, nullable=True)
    image_url = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    display_order = Column(Integer, default=0)

    # Relaciones
    parent = relationship("ProductCategory", remote_side=[category_id], backref="children")
    products = relationship("Product", back_populates="category")


# --- NUEVA TABLA: RECOMENDACIONES Y RELACIONES ---
class ProductRelationship(Base):
    __tablename__ = "product_relationships"
    __table_args__ = {"schema": "swapp"}

    relationship_id = Column(BigInteger, primary_key=True, autoincrement=True)
    relationship_uuid = Column(UUID(as_uuid=True), default=uuid.uuid4, unique=True, nullable=False)
    
    source_product_id = Column(BigInteger, ForeignKey("swapp.products.product_id", ondelete="CASCADE"), nullable=False)
    target_product_id = Column(BigInteger, ForeignKey("swapp.products.product_id", ondelete="CASCADE"), nullable=False)
    
    relationship_type = Column(String(50), nullable=False) # ej: 'compatible', 'accessory', 'cross_sell'
    is_bidirectional = Column(Boolean, default=False)
    priority = Column(Integer, default=0)

    # Navegación ORM
    source_product = relationship("Product", foreign_keys=[source_product_id], back_populates="related_to")
    target_product = relationship("Product", foreign_keys=[target_product_id], back_populates="related_from")


# --- PRODUCTOS ACTUALIZADOS ---
class Product(Base):
    __tablename__ = "products"
    __table_args__ = {"schema": "swapp"}

    product_id = Column(BigInteger, primary_key=True, autoincrement=True)
    product_uuid = Column(UUID(as_uuid=True), default=uuid.uuid4, unique=True, nullable=False)
    
    sku = Column(String(50), unique=True, index=True)
    name = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    short_description = Column(String(500), nullable=True)
    
    # Claves Foráneas
    category_id = Column(BigInteger, ForeignKey("swapp.product_categories.category_id"), nullable=True)
    brand_id = Column(BigInteger, ForeignKey("swapp.brands.brand_id"), nullable=True)
    
    base_price = Column(Numeric(10,2), default=0.0, nullable=False)
    sale_price = Column(Numeric(10,2), nullable=True)
    stock_quantity = Column(Integer, default=0)
    
    main_image_url = Column(Text, nullable=True)
    is_featured = Column(Boolean, default=False)
    is_published = Column(Boolean, default=False)
    sold_count = Column(Integer, default=0) 
    
    # Relaciones
    category = relationship("ProductCategory", back_populates="products")
    brand = relationship("Brand", back_populates="products")
    
    analyses = relationship("UserImageAnalysis", foreign_keys="[UserImageAnalysis.product_id]", back_populates="product")
    
    related_to = relationship("ProductRelationship", foreign_keys="[ProductRelationship.source_product_id]", back_populates="source_product")
    related_from = relationship("ProductRelationship", foreign_keys="[ProductRelationship.target_product_id]", back_populates="target_product")


class UserImageAnalysis(Base):
    __tablename__ = "user_image_analyses"
    __table_args__ = {"schema": "swapp"}

    analysis_id = Column(BigInteger, primary_key=True, autoincrement=True)
    analysis_uuid = Column(UUID(as_uuid=True), default=uuid.uuid4, unique=True, nullable=False)
    user_id = Column(BigInteger, ForeignKey("swapp.users.user_id", ondelete="CASCADE"), nullable=False)
    product_id = Column(BigInteger, ForeignKey("swapp.products.product_id", ondelete="CASCADE"), nullable=True)
    
    image_url = Column(Text, nullable=True)
    confidence_score = Column(Numeric(5,2))
    recognized_product_id = Column(BigInteger, ForeignKey("swapp.products.product_id"), nullable=True)
    recognition_status = Column(String(50), default="pending")
    user_corrected_product_id = Column(BigInteger, ForeignKey("swapp.products.product_id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    
    user = relationship("User", back_populates="analyses")
    product = relationship("Product", foreign_keys=[product_id], back_populates="analyses")