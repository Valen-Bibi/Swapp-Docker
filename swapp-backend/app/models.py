import uuid
from sqlalchemy import Column, String, Integer, ForeignKey, DateTime, Boolean, Text, BigInteger, Numeric, Date
from sqlalchemy.dialects.postgresql import UUID, JSONB, INET, ARRAY
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
    email = Column(String(255), unique=True, index=True, nullable=False)
    phone_number = Column(String(50))
    birth_date = Column(Date)
    password_hash = Column(String(255), nullable=False)
    
    email_verified = Column(Boolean, default=False)
    email_verified_at = Column(DateTime(timezone=True))
    phone_verified = Column(Boolean, default=False)
    phone_verified_at = Column(DateTime(timezone=True))
    
    username = Column(String(50), unique=True)
    avatar_url = Column(Text)
    bio = Column(Text)
    preferred_language = Column(String(10), default='es')
    timezone = Column(String(50), default='America/Mexico_City')
    
    role = Column(String(50), default="user", nullable=False)
    permissions = Column(JSONB, default=[])
    is_active = Column(Boolean, default=True)
    is_locked = Column(Boolean, default=False)
    locked_until = Column(DateTime(timezone=True))
    login_attempts = Column(Integer, default=0)
    last_login_at = Column(DateTime(timezone=True))
    last_login_ip = Column(INET)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    deleted_at = Column(DateTime(timezone=True))
    
    created_by = Column(BigInteger, ForeignKey("swapp.users.user_id"))
    updated_by = Column(BigInteger, ForeignKey("swapp.users.user_id"))
    
    accepted_terms_at = Column(DateTime(timezone=True))
    accepted_privacy_at = Column(DateTime(timezone=True))
    marketing_consent = Column(Boolean, default=False)
    marketing_consent_at = Column(DateTime(timezone=True))
    
    meta_data = Column("metadata", JSONB, default={})
    settings = Column(JSONB, default={})
    
    # Relaciones virtuales
    analyses = relationship("UserImageAnalysis", back_populates="user", cascade="all, delete-orphan")
    email_verifications = relationship("EmailVerification", back_populates="user", cascade="all, delete-orphan")
    login_history = relationship("LoginHistory", back_populates="user", cascade="all, delete-orphan")
    password_resets = relationship("PasswordReset", back_populates="user", cascade="all, delete-orphan")
    sessions = relationship("UserSession", back_populates="user", cascade="all, delete-orphan")


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
    created_by = Column(BigInteger, ForeignKey("swapp.users.user_id"))
    updated_by = Column(BigInteger, ForeignKey("swapp.users.user_id"))
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
    sku = Column(String(50), unique=True, index=True)
    name = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    short_description = Column(String(500), nullable=True)
    category_id = Column(BigInteger, ForeignKey("swapp.product_categories.category_id"), nullable=True)
    tags = Column(ARRAY(Text))
    
    base_price = Column(Numeric(10,2), default=0.0, nullable=False)
    cost_price = Column(Numeric(10,2), default =0.0, nullable=False)
    currency = Column(String(3), default='ARS')
    stock_quantity = Column(Integer, default=0)
    low_stock_threshold = Column(Integer, default=5)
    track_inventory = Column(Boolean, default=True)
    allow_backorder = Column(Boolean, default=False)
    max_order_quantity = Column(Integer)
    
    product_type = Column(String(50), default='physical')
    weight = Column(Numeric(10,2))
    weight_unit = Column(String(10), default='kg')
    dimensions = Column(JSONB)
    download_url = Column(Text)
    file_size = Column(BigInteger)
    file_extension = Column(String(10))
    
    meta_title = Column(String(70))
    meta_description = Column(String(160))
    meta_keywords = Column(Text)
    
    is_featured = Column(Boolean, default=False)
    is_published = Column(Boolean, default=False)
    published_at = Column(DateTime(timezone=True))
    visibility = Column(String(20), default='catalog')
    has_variants = Column(Boolean, default=False)
    variant_attributes = Column(JSONB)
    
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
    
    category = relationship("ProductCategory", back_populates="products")
    brand = relationship("Brand", back_populates="products")
    tax_class = relationship("TaxClass", back_populates="products")
    
    discounts = relationship("ProductDiscount", back_populates="product", cascade="all, delete-orphan")
    price_history = relationship("ProductPriceHistory", back_populates="product", cascade="all, delete-orphan")
    media = relationship("ProductMedia", back_populates="product", cascade="all, delete-orphan")
    
    analyses = relationship("UserImageAnalysis", foreign_keys="[UserImageAnalysis.product_id]", back_populates="product")
    related_to = relationship("ProductRelationship", foreign_keys="[ProductRelationship.source_product_id]", back_populates="source_product")
    related_from = relationship("ProductRelationship", foreign_keys="[ProductRelationship.target_product_id]", back_populates="target_product")
    inventory_movements = relationship("InventoryMovement", back_populates="product", cascade="all, delete")


class ProductPriceHistory(Base):
    __tablename__ = "product_price_history"
    __table_args__ = {"schema": "swapp"}

    history_id = Column(BigInteger, primary_key=True, autoincrement=True)
    product_id = Column(BigInteger, ForeignKey('swapp.products.product_id', ondelete="CASCADE"), nullable=False)
    old_value = Column(Numeric(10, 2), nullable=False)
    new_value = Column(Numeric(10, 2), nullable=False)
    changed_at = Column(DateTime(timezone=True), server_default=func.now())
    record_type = Column(String(20), default="base_price", nullable=False)
    product = relationship("Product", back_populates="price_history")


class ProductDiscount(Base):
    __tablename__ = "product_discounts"
    __table_args__ = {"schema": "swapp"}

    discount_id = Column(BigInteger, primary_key=True, autoincrement=True)
    product_id = Column(BigInteger, ForeignKey("swapp.products.product_id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False) 
    discount_type = Column(String(20), nullable=False) 
    value = Column(Numeric(10, 2), nullable=False)
    start_date = Column(DateTime(timezone=True), nullable=False)
    end_date = Column(DateTime(timezone=True), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    product = relationship("Product", back_populates="discounts")


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


class InventoryMovement(Base):
    __tablename__ = "inventory_movements"
    __table_args__ = {"schema": "swapp"}

    movement_id = Column(BigInteger, primary_key=True, index=True)
    movement_uuid = Column(UUID(as_uuid=True), default=uuid.uuid4, unique=True)
    product_id = Column(BigInteger, ForeignKey("swapp.products.product_id", ondelete="CASCADE"), nullable=False)
    
    movement_type = Column(String(20), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_cost = Column(Numeric(10, 2), nullable=True)
    stock_before = Column(Integer)
    stock_after = Column(Integer)
    
    reference_id = Column(BigInteger)
    reference_type = Column(String(50))
    
    reason = Column(Text)
    notes = Column(Text)
    
    # FIX: Llave foránea apuntando correctamente al administrador
    created_by = Column(BigInteger, ForeignKey("swapp.staff_users.staff_id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    movement_metadata = Column("metadata", JSONB, server_default='{}')

    product = relationship("Product", back_populates="inventory_movements")
    # FIX: Enlace virtual sin colisión de nombres
    user = relationship(staff_users, foreign_keys=[created_by])


# ==========================================
# TABLAS NUEVAS (Agregadas del Volcado SQL)
# ==========================================

class EmailVerification(Base):
    __tablename__ = "email_verifications"
    __table_args__ = {"schema": "swapp"}

    verification_id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("swapp.users.user_id", ondelete="CASCADE"), nullable=False)
    token = Column(UUID(as_uuid=True), default=uuid.uuid4, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    verified_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User", back_populates="email_verifications")


class LoginHistory(Base):
    __tablename__ = "login_history"
    __table_args__ = {"schema": "swapp"}
    
    login_id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("swapp.users.user_id", ondelete="CASCADE"), nullable=False)
    ip_address = Column(INET)
    user_agent = Column(Text)
    login_at = Column(DateTime(timezone=True), server_default=func.now())
    success = Column(Boolean, default=True)
    failure_reason = Column(String(255))
    
    user = relationship("User", back_populates="login_history")


class PasswordReset(Base):
    __tablename__ = "password_resets"
    __table_args__ = {"schema": "swapp"}
    
    reset_id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("swapp.users.user_id", ondelete="CASCADE"), nullable=False)
    token = Column(UUID(as_uuid=True), default=uuid.uuid4, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    used_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User", back_populates="password_resets")


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


class UserSession(Base):
    __tablename__ = "user_sessions"
    __table_args__ = {"schema": "swapp"}
    
    session_id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("swapp.users.user_id", ondelete="CASCADE"), nullable=False)
    session_uuid = Column(UUID(as_uuid=True), default=uuid.uuid4, unique=True, nullable=False)
    refresh_token = Column(UUID(as_uuid=True), default=uuid.uuid4)
    ip_address = Column(INET)
    user_agent = Column(Text)
    device_info = Column(JSONB)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    revoked_at = Column(DateTime(timezone=True))
    
    user = relationship("User", back_populates="sessions")