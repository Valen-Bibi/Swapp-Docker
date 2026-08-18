import uuid
from sqlalchemy import Column, String, Integer, ForeignKey, DateTime, Boolean, Text, BigInteger, Numeric, Date
from sqlalchemy.dialects.postgresql import UUID, JSONB, INET, ARRAY
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base

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
    
    created_by = Column(BigInteger, ForeignKey("swapp.staff_users.staff_id"))
    updated_by = Column(BigInteger, ForeignKey("swapp.staff_users.staff_id"))
    
    accepted_terms_at = Column(DateTime(timezone=True))
    accepted_privacy_at = Column(DateTime(timezone=True))
    marketing_consent = Column(Boolean, default=False)
    marketing_consent_at = Column(DateTime(timezone=True))
    
    meta_data = Column("metadata", JSONB, default={})
    settings = Column(JSONB, default={})
    
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