import uuid
from sqlalchemy import Column, String, Integer, ForeignKey, DateTime, Boolean, Text, BigInteger, Numeric
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base

class Brand(Base):
    __tablename__ = "brands"
    __table_args__ = {"schema": "swapp"}

    brand_id = Column(BigInteger, primary_key=True, autoincrement=True)
    brand_uuid = Column(UUID(as_uuid=True), default=uuid.uuid4, unique=True, nullable=False)
    name = Column(String(100), nullable=False, unique=True)
    slug = Column(String(120), nullable=False, unique=True)
    description = Column(Text, nullable=True)
    logo_url = Column(Text, nullable=True)
    logo_thumbnail_url = Column(Text)
    cover_image_url = Column(Text)
    website_url = Column(Text)
    meta_title = Column(String(70))
    meta_description = Column(String(160))
    is_active = Column(Boolean, default=True)
    display_order = Column(Integer, default=0)
    featured = Column(Boolean, default=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    created_by = Column(BigInteger, ForeignKey("swapp.staff_users.staff_id"))
    updated_by = Column(BigInteger, ForeignKey("swapp.staff_users.staff_id"))
    meta_data = Column("metadata", JSONB, default={})
    
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
    path = Column(Text)
    path_ids = Column(ARRAY(Integer))
    is_active = Column(Boolean, default=True)
    display_order = Column(Integer, default=0)
    image_url = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    meta_data = Column("metadata", JSONB, default={})

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
    reason = Column(Text)
    condition = Column(Text)
    suggested_quantity = Column(Integer, default=1)
    is_required = Column(Boolean, default=False)
    display_context = Column(JSONB)
    display_text = Column(Text)
    confidence_score = Column(Numeric(5,4))
    usage_count = Column(Integer, default=0)
    click_count = Column(Integer, default=0)
    conversion_count = Column(Integer, default=0)
    valid_from = Column(DateTime(timezone=True))
    valid_until = Column(DateTime(timezone=True))
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    created_by = Column(BigInteger, ForeignKey("swapp.staff_users.staff_id"))
    updated_by = Column(BigInteger, ForeignKey("swapp.staff_users.staff_id"))
    meta_data = Column("metadata", JSONB, default={})

    source_product = relationship("Product", foreign_keys=[source_product_id], back_populates="related_to")
    target_product = relationship("Product", foreign_keys=[target_product_id], back_populates="related_from")


class TaxClass(Base):
    __tablename__ = "tax_classes"
    __table_args__ = {"schema": "swapp"}

    tax_class_id = Column(BigInteger, primary_key=True, autoincrement=True)
    name = Column(String(50), nullable=False)
    rate = Column(Numeric(5, 2), nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    products = relationship("Product", back_populates="tax_class")


class Product(Base):
    __tablename__ = "products"
    __table_args__ = {"schema": "swapp"}

    product_id = Column(BigInteger, primary_key=True, autoincrement=True)
    product_uuid = Column(UUID(as_uuid=True), default=uuid.uuid4, unique=True, nullable=False)
    
    # Datos Estructurales (Sin SKU ni atributos de variante)
    name = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    short_description = Column(String(500), nullable=True)
    category_id = Column(BigInteger, ForeignKey("swapp.product_categories.category_id"), nullable=True)
    tags = Column(ARRAY(Text))
    
    currency = Column(String(3), default='ARS')
    reference_price = Column(Numeric(10, 2), nullable=True)
    reference_cost = Column(Numeric(10, 2), nullable=True)
    track_inventory = Column(Boolean, default=True)
    allow_backorder = Column(Boolean, default=False)
    max_order_quantity = Column(Integer)
    
    # Logística
    product_type = Column(String(50), default='physical')
    weight = Column(Numeric(10,2))
    weight_unit = Column(String(10), default='kg')
    dimensions = Column(JSONB)
    download_url = Column(Text)
    file_size = Column(BigInteger)
    file_extension = Column(String(10))
    
    # SEO
    meta_title = Column(String(70))
    meta_description = Column(String(160))
    meta_keywords = Column(Text)
    
    # Estados
    is_featured = Column(Boolean, default=False)
    is_published = Column(Boolean, default=False)
    published_at = Column(DateTime(timezone=True))
    visibility = Column(String(20), default='catalog')
    has_variants = Column(Boolean, default=False)
    
    # Métricas
    view_count = Column(Integer, default=0)
    sold_count = Column(Integer, default=0)
    rating_avg = Column(Numeric(3,2), default=0)
    review_count = Column(Integer, default=0)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    deleted_at = Column(DateTime(timezone=True))
    created_by = Column(BigInteger, ForeignKey("swapp.staff_users.staff_id"))
    updated_by = Column(BigInteger, ForeignKey("swapp.staff_users.staff_id"))
    
    meta_data = Column("metadata", JSONB, default={})
    custom_attributes = Column(JSONB, default={})
    
    brand_id = Column(BigInteger, ForeignKey("swapp.brands.brand_id"), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    is_returnable = Column(Boolean, default=False, nullable=False)
    tax_class_id = Column(BigInteger, ForeignKey("swapp.tax_classes.tax_class_id"), nullable=True)
    
    # --- RELACIONES ---
    category = relationship("ProductCategory", back_populates="products")
    brand = relationship("Brand", back_populates="products")
    tax_class = relationship("TaxClass", back_populates="products")
    
    variants = relationship("ProductVariant", back_populates="product", cascade="all, delete-orphan")
    discounts = relationship("ProductDiscount", back_populates="product", cascade="all, delete-orphan")
    price_history = relationship("ProductPriceHistory", back_populates="product", cascade="all, delete-orphan")
    media = relationship("ProductMedia", back_populates="product", cascade="all, delete-orphan")
    
    analyses = relationship("UserImageAnalysis", foreign_keys="[UserImageAnalysis.product_id]", back_populates="product")
    related_to = relationship("ProductRelationship", foreign_keys="[ProductRelationship.source_product_id]", back_populates="source_product")
    related_from = relationship("ProductRelationship", foreign_keys="[ProductRelationship.target_product_id]", back_populates="target_product")
    inventory_movements = relationship("InventoryMovement", back_populates="product", cascade="all, delete")


# --- NUEVA TABLA HIJO: VARIANTE FÍSICA ---
class ProductVariant(Base):
    __tablename__ = "product_variants"
    __table_args__ = {"schema": "swapp"}

    variant_id = Column(BigInteger, primary_key=True, autoincrement=True)
    variant_uuid = Column(UUID(as_uuid=True), default=uuid.uuid4, unique=True, nullable=False)
    product_id = Column(BigInteger, ForeignKey("swapp.products.product_id", ondelete="CASCADE"), nullable=False)
    
    sku = Column(String(50), unique=True, index=True)
    price = Column(Numeric(10,2), default=0.0, nullable=False)
    cost_price = Column(Numeric(10,2), default=0.0, nullable=False)
    stock_quantity = Column(Integer, default=0)
    
    low_stock_threshold = Column(Integer, default=5, nullable=False)
    
    variant_attributes = Column(JSONB, default={})

    image_url = Column(String(500), nullable=True)
    
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    product = relationship("Product", back_populates="variants")


class ProductMedia(Base):
    __tablename__ = "product_media"
    __table_args__ = {"schema": "swapp"}
    
    media_id = Column(BigInteger, primary_key=True, autoincrement=True)
    media_uuid = Column(UUID(as_uuid=True), default=uuid.uuid4, unique=True, nullable=False)
    product_id = Column(BigInteger, ForeignKey("swapp.products.product_id", ondelete="CASCADE"), nullable=False)
    media_type = Column(String(20), nullable=False)
    media_subtype = Column(String(30))
    file_url = Column(Text, nullable=False)
    thumbnail_url = Column(Text)
    title = Column(String(255))
    alt_text = Column(String(255))
    display_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    width = Column(Integer)
    height = Column(Integer)
    duration = Column(Integer)
    file_size = Column(BigInteger)
    mime_type = Column(String(100))
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    meta_data = Column("metadata", JSONB, default={})
    
    product = relationship("Product", back_populates="media")