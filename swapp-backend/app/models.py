import uuid
from sqlalchemy import Column, String, Integer, Float, ForeignKey, DateTime, Boolean, Text, BigInteger, Numeric
from sqlalchemy.dialects.postgresql import UUID, JSONB, INET
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base
from sqlalchemy.sql import func

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


class staff_users(Base):
    __tablename__ = "staff_users"
    __table_args__ = {"schema": "swapp"}

    staff_id = Column(BigInteger, primary_key=True, index=True)
    staff_uuid = Column(UUID(as_uuid=True), default=uuid.uuid4, unique=True, nullable=False)
    
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    
    role = Column(String(50), default="viewer", nullable=False)
    
    permissions = Column(JSONB, default=[])
    is_active = Column(Boolean, default=True)
    is_locked = Column(Boolean, default=False)
    locked_until = Column(DateTime(timezone=True))
    login_attempts = Column(Integer, default=0)
    last_login_at = Column(DateTime(timezone=True))
    last_login_ip = Column(INET)
    last_login_user_agent = Column(String)
    two_factor_secret = Column(String(255))
    two_factor_enabled = Column(Boolean, default=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    created_by = Column(BigInteger, ForeignKey('swapp.staff_users.staff_id'))
    updated_by = Column(BigInteger, ForeignKey('swapp.staff_users.staff_id'))
    deleted_at = Column(DateTime(timezone=True))

    meta_data = Column("metadata", JSONB, default={})


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

    parent = relationship("ProductCategory", remote_side=[category_id], backref="children")
    products = relationship("Product", back_populates="category")


class ProductRelationship(Base):
    __tablename__ = "product_relationships"
    __table_args__ = {"schema": "swapp"}

    relationship_id = Column(BigInteger, primary_key=True, autoincrement=True)
    relationship_uuid = Column(UUID(as_uuid=True), default=uuid.uuid4, unique=True, nullable=False)
    
    source_product_id = Column(BigInteger, ForeignKey("swapp.products.product_id", ondelete="CASCADE"), nullable=False)
    target_product_id = Column(BigInteger, ForeignKey("swapp.products.product_id", ondelete="CASCADE"), nullable=False)
    
    relationship_type = Column(String(50), nullable=False)
    is_bidirectional = Column(Boolean, default=False)
    priority = Column(Integer, default=0)

    source_product = relationship("Product", foreign_keys=[source_product_id], back_populates="related_to")
    target_product = relationship("Product", foreign_keys=[target_product_id], back_populates="related_from")


# --- IMPUESTOS ---
class TaxClass(Base):
    __tablename__ = "tax_classes"
    __table_args__ = {"schema": "swapp"}

    tax_class_id = Column(BigInteger, primary_key=True, autoincrement=True)
    
    name = Column(String(100), nullable=False)
    rate = Column(Numeric(5, 2), nullable=False)
    is_active = Column(Boolean, default=True)

    products = relationship("Product", back_populates="tax_class")


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
    tax_class_id = Column(BigInteger, ForeignKey("swapp.tax_classes.tax_class_id"), nullable=True)
    
    cost_price = Column(Numeric(10,2), default=0.0, nullable=False)
    base_price = Column(Numeric(10,2), default=0.0, nullable=False)
    stock_quantity = Column(Integer, default=0)
    
    main_image_url = Column(Text, nullable=True)
    is_featured = Column(Boolean, default=False)
    is_published = Column(Boolean, default=False)
    sold_count = Column(Integer, default=0)
    is_returnable = Column(Boolean, default=False)
    
    # Relaciones
    category = relationship("ProductCategory", back_populates="products")
    brand = relationship("Brand", back_populates="products")
    tax_class = relationship("TaxClass", back_populates="products")
    
    discounts = relationship("ProductDiscount", back_populates="product", cascade="all, delete-orphan")
    price_history = relationship("ProductPriceHistory", back_populates="product", viewonly=True)
    
    analyses = relationship("UserImageAnalysis", foreign_keys="[UserImageAnalysis.product_id]", back_populates="product")
    related_to = relationship("ProductRelationship", foreign_keys="[ProductRelationship.source_product_id]", back_populates="source_product")
    related_from = relationship("ProductRelationship", foreign_keys="[ProductRelationship.target_product_id]", back_populates="target_product")
    inventory_movements = relationship("InventoryMovement", back_populates="product", cascade="all, delete")


# --- HISTORIAL AUTOMÁTICO DE PRECIOS ---
class ProductPriceHistory(Base):
    __tablename__ = "product_price_history"
    __table_args__ = {"schema": "swapp"}

    history_id = Column(BigInteger, primary_key=True, autoincrement=True)
    
    product_id = Column(BigInteger, ForeignKey("swapp.products.product_id", ondelete="CASCADE"), nullable=False)
    old_price = Column(Numeric(10, 2), nullable=False)
    new_price = Column(Numeric(10, 2), nullable=False)
    changed_at = Column(DateTime(timezone=True), server_default=func.now())

    product = relationship("Product", back_populates="price_history")


# --- MOTOR DE OFERTAS ---
class ProductDiscount(Base):
    __tablename__ = "product_discounts"
    __table_args__ = {"schema": "swapp"}

    discount_id = Column(BigInteger, primary_key=True, autoincrement=True)
    
    product_id = Column(BigInteger, ForeignKey("swapp.products.product_id", ondelete="CASCADE"), nullable=False)
    discount_type = Column(String(50), nullable=False) 
    value = Column(Numeric(10, 2), nullable=False)
    start_date = Column(DateTime(timezone=True), nullable=False)
    end_date = Column(DateTime(timezone=True), nullable=False)

    product = relationship("Product", back_populates="discounts")


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


class InventoryMovement(Base):
    __tablename__ = "inventory_movements"
    __table_args__ = {"schema": "swapp"}

    movement_id = Column(BigInteger, primary_key=True, index=True)
    movement_uuid = Column(UUID(as_uuid=True), default=uuid.uuid4, unique=True)
    product_id = Column(BigInteger, ForeignKey("swapp.products.product_id", ondelete="CASCADE"), nullable=False)
    
    movement_type = Column(String(20), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_cost = Column(Numeric(10, 2), nullable=True) # Nuevo campo
    stock_before = Column(Integer)
    stock_after = Column(Integer)
    
    reference_id = Column(BigInteger)
    reference_type = Column(String(50))
    
    reason = Column(Text)
    notes = Column(Text)
    
    created_by = Column(BigInteger, ForeignKey("swapp.users.user_id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    movement_metadata = Column("metadata", JSONB, server_default='{}')

    product = relationship("Product", back_populates="inventory_movements")
    user = relationship("User")