"""Migracion Inicial Maestra

Revision ID: 416336249dc3
Revises: 
Create Date: 2026-09-01 22:33:51.095310

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '416336249dc3'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('product_attributes',
    sa.Column('attribute_id', sa.BigInteger(), autoincrement=True, nullable=False),
    sa.Column('attribute_uuid', sa.UUID(), nullable=False),
    sa.Column('name', sa.String(length=100), nullable=False),
    sa.Column('is_variant', sa.Boolean(), nullable=False),
    sa.Column('is_active', sa.Boolean(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.PrimaryKeyConstraint('attribute_id'),
    sa.UniqueConstraint('attribute_uuid'),
    sa.UniqueConstraint('name'),
    schema='swapp'
    )
    op.create_table('product_categories',
    sa.Column('category_id', sa.BigInteger(), autoincrement=True, nullable=False),
    sa.Column('category_uuid', sa.UUID(), nullable=False),
    sa.Column('name', sa.String(length=100), nullable=False),
    sa.Column('slug', sa.String(length=120), nullable=False),
    sa.Column('description', sa.Text(), nullable=True),
    sa.Column('parent_id', sa.BigInteger(), nullable=True),
    sa.Column('level', sa.Integer(), nullable=True),
    sa.Column('path', sa.Text(), nullable=True),
    sa.Column('path_ids', postgresql.ARRAY(sa.Integer()), nullable=True),
    sa.Column('is_active', sa.Boolean(), nullable=True),
    sa.Column('display_order', sa.Integer(), nullable=True),
    sa.Column('image_url', sa.Text(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('metadata', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    sa.ForeignKeyConstraint(['parent_id'], ['swapp.product_categories.category_id'], ),
    sa.PrimaryKeyConstraint('category_id'),
    sa.UniqueConstraint('category_uuid'),
    sa.UniqueConstraint('slug'),
    schema='swapp'
    )
    op.create_table('staff_users',
    sa.Column('staff_id', sa.BigInteger(), autoincrement=True, nullable=False),
    sa.Column('staff_uuid', sa.UUID(), nullable=False),
    sa.Column('email', sa.String(length=255), nullable=False),
    sa.Column('password_hash', sa.String(length=255), nullable=False),
    sa.Column('first_name', sa.String(length=100), nullable=False),
    sa.Column('last_name', sa.String(length=100), nullable=False),
    sa.Column('role', sa.String(length=50), nullable=False),
    sa.Column('permissions', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    sa.Column('is_active', sa.Boolean(), nullable=True),
    sa.Column('is_locked', sa.Boolean(), nullable=True),
    sa.Column('locked_until', sa.DateTime(timezone=True), nullable=True),
    sa.Column('login_attempts', sa.Integer(), nullable=True),
    sa.Column('last_login_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('last_login_ip', postgresql.INET(), nullable=True),
    sa.Column('last_login_user_agent', sa.String(), nullable=True),
    sa.Column('two_factor_secret', sa.String(length=255), nullable=True),
    sa.Column('two_factor_enabled', sa.Boolean(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('created_by', sa.BigInteger(), nullable=True),
    sa.Column('updated_by', sa.BigInteger(), nullable=True),
    sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('metadata', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    sa.ForeignKeyConstraint(['created_by'], ['swapp.staff_users.staff_id'], ),
    sa.ForeignKeyConstraint(['updated_by'], ['swapp.staff_users.staff_id'], ),
    sa.PrimaryKeyConstraint('staff_id'),
    sa.UniqueConstraint('staff_uuid'),
    schema='swapp'
    )
    op.create_index(op.f('ix_swapp_staff_users_email'), 'staff_users', ['email'], unique=True, schema='swapp')
    op.create_table('tax_classes',
    sa.Column('tax_class_id', sa.BigInteger(), autoincrement=True, nullable=False),
    sa.Column('name', sa.String(length=50), nullable=False),
    sa.Column('rate', sa.Numeric(precision=5, scale=2), nullable=False),
    sa.Column('description', sa.Text(), nullable=True),
    sa.Column('is_active', sa.Boolean(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.PrimaryKeyConstraint('tax_class_id'),
    schema='swapp'
    )
    op.create_table('brands',
    sa.Column('brand_id', sa.BigInteger(), autoincrement=True, nullable=False),
    sa.Column('brand_uuid', sa.UUID(), nullable=False),
    sa.Column('name', sa.String(length=100), nullable=False),
    sa.Column('slug', sa.String(length=120), nullable=False),
    sa.Column('description', sa.Text(), nullable=True),
    sa.Column('logo_url', sa.Text(), nullable=True),
    sa.Column('logo_thumbnail_url', sa.Text(), nullable=True),
    sa.Column('cover_image_url', sa.Text(), nullable=True),
    sa.Column('website_url', sa.Text(), nullable=True),
    sa.Column('meta_title', sa.String(length=70), nullable=True),
    sa.Column('meta_description', sa.String(length=160), nullable=True),
    sa.Column('is_active', sa.Boolean(), nullable=True),
    sa.Column('display_order', sa.Integer(), nullable=True),
    sa.Column('featured', sa.Boolean(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('created_by', sa.BigInteger(), nullable=True),
    sa.Column('updated_by', sa.BigInteger(), nullable=True),
    sa.Column('metadata', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    sa.ForeignKeyConstraint(['created_by'], ['swapp.staff_users.staff_id'], ),
    sa.ForeignKeyConstraint(['updated_by'], ['swapp.staff_users.staff_id'], ),
    sa.PrimaryKeyConstraint('brand_id'),
    sa.UniqueConstraint('brand_uuid'),
    sa.UniqueConstraint('name'),
    sa.UniqueConstraint('slug'),
    schema='swapp'
    )
    op.create_table('orders',
    sa.Column('order_id', sa.BigInteger(), autoincrement=True, nullable=False),
    sa.Column('order_uuid', sa.UUID(), nullable=False),
    sa.Column('customer_name', sa.String(length=150), nullable=False),
    sa.Column('customer_phone', sa.String(length=50), nullable=False),
    sa.Column('customer_email', sa.String(length=255), nullable=True),
    sa.Column('delivery_address', sa.Text(), nullable=False),
    sa.Column('delivery_zone', sa.String(length=100), nullable=True),
    sa.Column('scheduled_delivery_date', sa.DateTime(timezone=True), nullable=True),
    sa.Column('status', sa.String(length=50), nullable=False),
    sa.Column('total_amount', sa.Numeric(precision=10, scale=2), nullable=False),
    sa.Column('logistics_notes', sa.Text(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('created_by', sa.BigInteger(), nullable=True),
    sa.ForeignKeyConstraint(['created_by'], ['swapp.staff_users.staff_id'], ),
    sa.PrimaryKeyConstraint('order_id'),
    sa.UniqueConstraint('order_uuid'),
    schema='swapp'
    )
    op.create_table('product_attribute_values',
    sa.Column('value_id', sa.BigInteger(), autoincrement=True, nullable=False),
    sa.Column('value_uuid', sa.UUID(), nullable=False),
    sa.Column('attribute_id', sa.BigInteger(), nullable=False),
    sa.Column('value', sa.String(length=255), nullable=False),
    sa.Column('display_order', sa.Integer(), nullable=True),
    sa.Column('is_active', sa.Boolean(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.ForeignKeyConstraint(['attribute_id'], ['swapp.product_attributes.attribute_id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('value_id'),
    sa.UniqueConstraint('value_uuid'),
    schema='swapp'
    )
    op.create_table('subcategory_attributes',
    sa.Column('category_id', sa.BigInteger(), nullable=False),
    sa.Column('attribute_id', sa.BigInteger(), nullable=False),
    sa.Column('is_required', sa.Boolean(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.ForeignKeyConstraint(['attribute_id'], ['swapp.product_attributes.attribute_id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['category_id'], ['swapp.product_categories.category_id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('category_id', 'attribute_id'),
    schema='swapp'
    )
    op.create_table('users',
    sa.Column('user_id', sa.BigInteger(), autoincrement=True, nullable=False),
    sa.Column('user_uuid', sa.UUID(), nullable=False),
    sa.Column('first_name', sa.String(length=100), nullable=False),
    sa.Column('last_name', sa.String(length=100), nullable=False),
    sa.Column('email', sa.String(length=255), nullable=False),
    sa.Column('phone_number', sa.String(length=50), nullable=True),
    sa.Column('birth_date', sa.Date(), nullable=True),
    sa.Column('password_hash', sa.String(length=255), nullable=False),
    sa.Column('email_verified', sa.Boolean(), nullable=True),
    sa.Column('email_verified_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('phone_verified', sa.Boolean(), nullable=True),
    sa.Column('phone_verified_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('username', sa.String(length=50), nullable=True),
    sa.Column('avatar_url', sa.Text(), nullable=True),
    sa.Column('bio', sa.Text(), nullable=True),
    sa.Column('preferred_language', sa.String(length=10), nullable=True),
    sa.Column('timezone', sa.String(length=50), nullable=True),
    sa.Column('role', sa.String(length=50), nullable=False),
    sa.Column('permissions', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    sa.Column('is_active', sa.Boolean(), nullable=True),
    sa.Column('is_locked', sa.Boolean(), nullable=True),
    sa.Column('locked_until', sa.DateTime(timezone=True), nullable=True),
    sa.Column('login_attempts', sa.Integer(), nullable=True),
    sa.Column('last_login_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('last_login_ip', postgresql.INET(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('created_by', sa.BigInteger(), nullable=True),
    sa.Column('updated_by', sa.BigInteger(), nullable=True),
    sa.Column('accepted_terms_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('accepted_privacy_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('marketing_consent', sa.Boolean(), nullable=True),
    sa.Column('marketing_consent_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('metadata', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    sa.Column('settings', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    sa.ForeignKeyConstraint(['created_by'], ['swapp.staff_users.staff_id'], ),
    sa.ForeignKeyConstraint(['updated_by'], ['swapp.staff_users.staff_id'], ),
    sa.PrimaryKeyConstraint('user_id'),
    sa.UniqueConstraint('user_uuid'),
    sa.UniqueConstraint('username'),
    schema='swapp'
    )
    op.create_index(op.f('ix_swapp_users_email'), 'users', ['email'], unique=True, schema='swapp')
    op.create_table('email_verifications',
    sa.Column('verification_id', sa.BigInteger(), autoincrement=True, nullable=False),
    sa.Column('user_id', sa.BigInteger(), nullable=False),
    sa.Column('token', sa.UUID(), nullable=False),
    sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('verified_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.ForeignKeyConstraint(['user_id'], ['swapp.users.user_id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('verification_id'),
    schema='swapp'
    )
    op.create_table('login_history',
    sa.Column('login_id', sa.BigInteger(), autoincrement=True, nullable=False),
    sa.Column('user_id', sa.BigInteger(), nullable=False),
    sa.Column('ip_address', postgresql.INET(), nullable=True),
    sa.Column('user_agent', sa.Text(), nullable=True),
    sa.Column('login_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('success', sa.Boolean(), nullable=True),
    sa.Column('failure_reason', sa.String(length=255), nullable=True),
    sa.ForeignKeyConstraint(['user_id'], ['swapp.users.user_id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('login_id'),
    schema='swapp'
    )
    op.create_table('order_status_history',
    sa.Column('history_id', sa.BigInteger(), autoincrement=True, nullable=False),
    sa.Column('order_id', sa.BigInteger(), nullable=False),
    sa.Column('old_status', sa.String(length=50), nullable=False),
    sa.Column('new_status', sa.String(length=50), nullable=False),
    sa.Column('changed_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('changed_by', sa.BigInteger(), nullable=False),
    sa.ForeignKeyConstraint(['changed_by'], ['swapp.staff_users.staff_id'], ),
    sa.ForeignKeyConstraint(['order_id'], ['swapp.orders.order_id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('history_id'),
    schema='swapp'
    )
    op.create_table('password_resets',
    sa.Column('reset_id', sa.BigInteger(), autoincrement=True, nullable=False),
    sa.Column('user_id', sa.BigInteger(), nullable=False),
    sa.Column('token', sa.UUID(), nullable=False),
    sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('used_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.ForeignKeyConstraint(['user_id'], ['swapp.users.user_id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('reset_id'),
    schema='swapp'
    )
    op.create_table('payments',
    sa.Column('payment_id', sa.BigInteger(), autoincrement=True, nullable=False),
    sa.Column('payment_uuid', sa.UUID(), nullable=False),
    sa.Column('order_id', sa.BigInteger(), nullable=False),
    sa.Column('payment_method', sa.String(length=50), nullable=False),
    sa.Column('amount', sa.Numeric(precision=10, scale=2), nullable=False),
    sa.Column('transaction_reference', sa.String(length=255), nullable=True),
    sa.Column('payment_status', sa.String(length=50), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('created_by', sa.BigInteger(), nullable=False),
    sa.ForeignKeyConstraint(['created_by'], ['swapp.staff_users.staff_id'], ),
    sa.ForeignKeyConstraint(['order_id'], ['swapp.orders.order_id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('payment_id'),
    sa.UniqueConstraint('payment_uuid'),
    schema='swapp'
    )
    op.create_table('products',
    sa.Column('product_id', sa.BigInteger(), autoincrement=True, nullable=False),
    sa.Column('product_uuid', sa.UUID(), nullable=False),
    sa.Column('name', sa.String(length=255), nullable=False),
    sa.Column('slug', sa.String(length=255), nullable=False),
    sa.Column('description', sa.Text(), nullable=True),
    sa.Column('short_description', sa.String(length=500), nullable=True),
    sa.Column('category_id', sa.BigInteger(), nullable=True),
    sa.Column('tags', postgresql.ARRAY(sa.Text()), nullable=True),
    sa.Column('currency', sa.String(length=3), nullable=True),
    sa.Column('reference_price', sa.Numeric(precision=10, scale=2), nullable=True),
    sa.Column('reference_cost', sa.Numeric(precision=10, scale=2), nullable=True),
    sa.Column('track_inventory', sa.Boolean(), nullable=True),
    sa.Column('allow_backorder', sa.Boolean(), nullable=True),
    sa.Column('max_order_quantity', sa.Integer(), nullable=True),
    sa.Column('product_type', sa.String(length=50), nullable=True),
    sa.Column('weight', sa.Numeric(precision=10, scale=2), nullable=True),
    sa.Column('weight_unit', sa.String(length=10), nullable=True),
    sa.Column('dimensions', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    sa.Column('download_url', sa.Text(), nullable=True),
    sa.Column('file_size', sa.BigInteger(), nullable=True),
    sa.Column('file_extension', sa.String(length=10), nullable=True),
    sa.Column('meta_title', sa.String(length=70), nullable=True),
    sa.Column('meta_description', sa.String(length=160), nullable=True),
    sa.Column('meta_keywords', sa.Text(), nullable=True),
    sa.Column('is_featured', sa.Boolean(), nullable=True),
    sa.Column('is_published', sa.Boolean(), nullable=True),
    sa.Column('published_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('visibility', sa.String(length=20), nullable=True),
    sa.Column('has_variants', sa.Boolean(), nullable=True),
    sa.Column('view_count', sa.Integer(), nullable=True),
    sa.Column('sold_count', sa.Integer(), nullable=True),
    sa.Column('rating_avg', sa.Numeric(precision=3, scale=2), nullable=True),
    sa.Column('review_count', sa.Integer(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('created_by', sa.BigInteger(), nullable=True),
    sa.Column('updated_by', sa.BigInteger(), nullable=True),
    sa.Column('metadata', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    sa.Column('custom_attributes', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    sa.Column('brand_id', sa.BigInteger(), nullable=True),
    sa.Column('is_active', sa.Boolean(), nullable=False),
    sa.Column('is_returnable', sa.Boolean(), nullable=False),
    sa.Column('tax_class_id', sa.BigInteger(), nullable=True),
    sa.ForeignKeyConstraint(['brand_id'], ['swapp.brands.brand_id'], ),
    sa.ForeignKeyConstraint(['category_id'], ['swapp.product_categories.category_id'], ),
    sa.ForeignKeyConstraint(['created_by'], ['swapp.staff_users.staff_id'], ),
    sa.ForeignKeyConstraint(['tax_class_id'], ['swapp.tax_classes.tax_class_id'], ),
    sa.ForeignKeyConstraint(['updated_by'], ['swapp.staff_users.staff_id'], ),
    sa.PrimaryKeyConstraint('product_id'),
    sa.UniqueConstraint('product_uuid'),
    sa.UniqueConstraint('slug'),
    schema='swapp'
    )
    op.create_table('user_sessions',
    sa.Column('session_id', sa.BigInteger(), autoincrement=True, nullable=False),
    sa.Column('user_id', sa.BigInteger(), nullable=False),
    sa.Column('session_uuid', sa.UUID(), nullable=False),
    sa.Column('refresh_token', sa.UUID(), nullable=True),
    sa.Column('ip_address', postgresql.INET(), nullable=True),
    sa.Column('user_agent', sa.Text(), nullable=True),
    sa.Column('device_info', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('revoked_at', sa.DateTime(timezone=True), nullable=True),
    sa.ForeignKeyConstraint(['user_id'], ['swapp.users.user_id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('session_id'),
    sa.UniqueConstraint('session_uuid'),
    schema='swapp'
    )
    op.create_table('product_discounts',
    sa.Column('discount_id', sa.BigInteger(), autoincrement=True, nullable=False),
    sa.Column('product_id', sa.BigInteger(), nullable=False),
    sa.Column('variant_ids', postgresql.ARRAY(sa.BigInteger()), nullable=True),
    sa.Column('name', sa.String(length=255), nullable=False),
    sa.Column('discount_type', sa.String(length=20), nullable=False),
    sa.Column('value', sa.Numeric(precision=10, scale=2), nullable=False),
    sa.Column('start_date', sa.DateTime(timezone=True), nullable=False),
    sa.Column('end_date', sa.DateTime(timezone=True), nullable=False),
    sa.Column('is_active', sa.Boolean(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.ForeignKeyConstraint(['product_id'], ['swapp.products.product_id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('discount_id'),
    schema='swapp'
    )
    op.create_table('product_media',
    sa.Column('media_id', sa.BigInteger(), autoincrement=True, nullable=False),
    sa.Column('media_uuid', sa.UUID(), nullable=False),
    sa.Column('product_id', sa.BigInteger(), nullable=False),
    sa.Column('media_type', sa.String(length=20), nullable=False),
    sa.Column('media_subtype', sa.String(length=30), nullable=True),
    sa.Column('file_url', sa.Text(), nullable=False),
    sa.Column('thumbnail_url', sa.Text(), nullable=True),
    sa.Column('title', sa.String(length=255), nullable=True),
    sa.Column('alt_text', sa.String(length=255), nullable=True),
    sa.Column('display_order', sa.Integer(), nullable=True),
    sa.Column('is_active', sa.Boolean(), nullable=True),
    sa.Column('width', sa.Integer(), nullable=True),
    sa.Column('height', sa.Integer(), nullable=True),
    sa.Column('duration', sa.Integer(), nullable=True),
    sa.Column('file_size', sa.BigInteger(), nullable=True),
    sa.Column('mime_type', sa.String(length=100), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('metadata', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    sa.ForeignKeyConstraint(['product_id'], ['swapp.products.product_id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('media_id'),
    sa.UniqueConstraint('media_uuid'),
    schema='swapp'
    )
    op.create_table('product_relationships',
    sa.Column('relationship_id', sa.BigInteger(), autoincrement=True, nullable=False),
    sa.Column('relationship_uuid', sa.UUID(), nullable=False),
    sa.Column('source_product_id', sa.BigInteger(), nullable=False),
    sa.Column('target_product_id', sa.BigInteger(), nullable=False),
    sa.Column('relationship_type', sa.String(length=50), nullable=False),
    sa.Column('is_bidirectional', sa.Boolean(), nullable=True),
    sa.Column('priority', sa.Integer(), nullable=True),
    sa.Column('reason', sa.Text(), nullable=True),
    sa.Column('condition', sa.Text(), nullable=True),
    sa.Column('suggested_quantity', sa.Integer(), nullable=True),
    sa.Column('is_required', sa.Boolean(), nullable=True),
    sa.Column('display_context', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    sa.Column('display_text', sa.Text(), nullable=True),
    sa.Column('confidence_score', sa.Numeric(precision=5, scale=4), nullable=True),
    sa.Column('usage_count', sa.Integer(), nullable=True),
    sa.Column('click_count', sa.Integer(), nullable=True),
    sa.Column('conversion_count', sa.Integer(), nullable=True),
    sa.Column('valid_from', sa.DateTime(timezone=True), nullable=True),
    sa.Column('valid_until', sa.DateTime(timezone=True), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('created_by', sa.BigInteger(), nullable=True),
    sa.Column('updated_by', sa.BigInteger(), nullable=True),
    sa.Column('metadata', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    sa.ForeignKeyConstraint(['created_by'], ['swapp.staff_users.staff_id'], ),
    sa.ForeignKeyConstraint(['source_product_id'], ['swapp.products.product_id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['target_product_id'], ['swapp.products.product_id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['updated_by'], ['swapp.staff_users.staff_id'], ),
    sa.PrimaryKeyConstraint('relationship_id'),
    sa.UniqueConstraint('relationship_uuid'),
    schema='swapp'
    )
    op.create_table('product_variants',
    sa.Column('variant_id', sa.BigInteger(), autoincrement=True, nullable=False),
    sa.Column('variant_uuid', sa.UUID(), nullable=False),
    sa.Column('product_id', sa.BigInteger(), nullable=False),
    sa.Column('sku', sa.String(length=50), nullable=True),
    sa.Column('price', sa.Numeric(precision=10, scale=2), nullable=False),
    sa.Column('cost_price', sa.Numeric(precision=10, scale=2), nullable=False),
    sa.Column('stock_quantity', sa.Integer(), nullable=True),
    sa.Column('low_stock_threshold', sa.Integer(), nullable=False),
    sa.Column('variant_attributes', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    sa.Column('image_url', sa.String(length=500), nullable=True),
    sa.Column('is_active', sa.Boolean(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.ForeignKeyConstraint(['product_id'], ['swapp.products.product_id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('variant_id'),
    sa.UniqueConstraint('variant_uuid'),
    schema='swapp'
    )
    op.create_index(op.f('ix_swapp_product_variants_sku'), 'product_variants', ['sku'], unique=True, schema='swapp')
    op.create_table('user_image_analyses',
    sa.Column('analysis_id', sa.BigInteger(), autoincrement=True, nullable=False),
    sa.Column('analysis_uuid', sa.UUID(), nullable=False),
    sa.Column('user_id', sa.BigInteger(), nullable=False),
    sa.Column('product_id', sa.BigInteger(), nullable=True),
    sa.Column('image_url', sa.Text(), nullable=False),
    sa.Column('thumbnail_url', sa.Text(), nullable=True),
    sa.Column('original_filename', sa.String(length=255), nullable=True),
    sa.Column('file_size', sa.BigInteger(), nullable=True),
    sa.Column('mime_type', sa.String(length=100), nullable=True),
    sa.Column('image_width', sa.Integer(), nullable=True),
    sa.Column('image_height', sa.Integer(), nullable=True),
    sa.Column('upload_timestamp', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('recognition_status', sa.String(length=50), nullable=True),
    sa.Column('recognized_product_id', sa.BigInteger(), nullable=True),
    sa.Column('confidence_score', sa.Numeric(precision=5, scale=4), nullable=True),
    sa.Column('modelarts_response', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    sa.Column('modelarts_request_id', sa.String(length=255), nullable=True),
    sa.Column('modelarts_processing_time', sa.Integer(), nullable=True),
    sa.Column('modelarts_model_version', sa.String(length=50), nullable=True),
    sa.Column('detection_details', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    sa.Column('alternative_matches', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    sa.Column('detected_labels', postgresql.ARRAY(sa.Text()), nullable=True),
    sa.Column('detected_objects', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    sa.Column('exif_data', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    sa.Column('geolocation', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    sa.Column('user_feedback', sa.String(length=20), nullable=True),
    sa.Column('user_corrected_product_id', sa.BigInteger(), nullable=True),
    sa.Column('user_feedback_comment', sa.Text(), nullable=True),
    sa.Column('user_feedback_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('metadata', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    sa.ForeignKeyConstraint(['product_id'], ['swapp.products.product_id'], ondelete='SET NULL'),
    sa.ForeignKeyConstraint(['recognized_product_id'], ['swapp.products.product_id'], ondelete='SET NULL'),
    sa.ForeignKeyConstraint(['user_corrected_product_id'], ['swapp.products.product_id'], ondelete='SET NULL'),
    sa.ForeignKeyConstraint(['user_id'], ['swapp.users.user_id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('analysis_id'),
    sa.UniqueConstraint('analysis_uuid'),
    schema='swapp'
    )
    op.create_table('inventory_movements',
    sa.Column('movement_id', sa.BigInteger(), nullable=False),
    sa.Column('movement_uuid', sa.UUID(), nullable=True),
    sa.Column('product_id', sa.BigInteger(), nullable=False),
    sa.Column('variant_id', sa.BigInteger(), nullable=False),
    sa.Column('movement_type', sa.String(length=20), nullable=False),
    sa.Column('quantity', sa.Integer(), nullable=False),
    sa.Column('unit_cost', sa.Numeric(precision=10, scale=2), nullable=True),
    sa.Column('stock_before', sa.Integer(), nullable=True),
    sa.Column('stock_after', sa.Integer(), nullable=True),
    sa.Column('reference_id', sa.BigInteger(), nullable=True),
    sa.Column('reference_type', sa.String(length=50), nullable=True),
    sa.Column('reason', sa.Text(), nullable=True),
    sa.Column('notes', sa.Text(), nullable=True),
    sa.Column('created_by', sa.BigInteger(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('metadata', postgresql.JSONB(astext_type=sa.Text()), server_default='{}', nullable=True),
    sa.ForeignKeyConstraint(['created_by'], ['swapp.staff_users.staff_id'], ),
    sa.ForeignKeyConstraint(['product_id'], ['swapp.products.product_id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['variant_id'], ['swapp.product_variants.variant_id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('movement_id'),
    sa.UniqueConstraint('movement_uuid'),
    schema='swapp'
    )
    op.create_index(op.f('ix_swapp_inventory_movements_movement_id'), 'inventory_movements', ['movement_id'], unique=False, schema='swapp')
    op.create_table('order_items',
    sa.Column('item_id', sa.BigInteger(), autoincrement=True, nullable=False),
    sa.Column('order_id', sa.BigInteger(), nullable=False),
    sa.Column('product_id', sa.BigInteger(), nullable=False),
    sa.Column('variant_id', sa.BigInteger(), nullable=True),
    sa.Column('discount_id', sa.BigInteger(), nullable=True),
    sa.Column('campaign_name', sa.String(length=255), nullable=True),
    sa.Column('discount_amount', sa.Numeric(precision=10, scale=2), nullable=True),
    sa.Column('unit_price', sa.Numeric(precision=10, scale=2), nullable=False),
    sa.Column('quantity', sa.Integer(), nullable=False),
    sa.Column('subtotal', sa.Numeric(precision=10, scale=2), nullable=False),
    sa.Column('requires_return', sa.Boolean(), nullable=False),
    sa.Column('expected_return_qty', sa.Integer(), nullable=False),
    sa.Column('actual_return_qty', sa.Integer(), nullable=False),
    sa.ForeignKeyConstraint(['discount_id'], ['swapp.product_discounts.discount_id'], ondelete='SET NULL'),
    sa.ForeignKeyConstraint(['order_id'], ['swapp.orders.order_id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['product_id'], ['swapp.products.product_id'], ),
    sa.ForeignKeyConstraint(['variant_id'], ['swapp.product_variants.variant_id'], ),
    sa.PrimaryKeyConstraint('item_id'),
    schema='swapp'
    )
    op.create_table('product_price_history',
    sa.Column('history_id', sa.BigInteger(), autoincrement=True, nullable=False),
    sa.Column('product_id', sa.BigInteger(), nullable=False),
    sa.Column('variant_id', sa.BigInteger(), nullable=True),
    sa.Column('old_value', sa.Numeric(precision=10, scale=2), nullable=False),
    sa.Column('new_value', sa.Numeric(precision=10, scale=2), nullable=False),
    sa.Column('changed_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('record_type', sa.String(length=20), nullable=False),
    sa.ForeignKeyConstraint(['product_id'], ['swapp.products.product_id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['variant_id'], ['swapp.product_variants.variant_id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('history_id'),
    schema='swapp'
    )
    
    op.execute("""
    CREATE FUNCTION swapp.log_price_change() RETURNS trigger
        LANGUAGE plpgsql
        AS $$
    BEGIN
        IF NEW.base_price <> OLD.base_price THEN
            INSERT INTO swapp.product_price_history (product_id, old_value, new_value, record_type)
            VALUES (NEW.product_id, OLD.base_price, NEW.base_price, 'base_price');
        END IF;
        IF NEW.cost_price IS DISTINCT FROM OLD.cost_price THEN
            INSERT INTO swapp.product_price_history (product_id, old_value, new_value, record_type)
            VALUES (NEW.product_id, OLD.cost_price, NEW.cost_price, 'cost_price');
        END IF;
        RETURN NEW;
    END;
    $$;

    CREATE FUNCTION swapp.process_inventory_movement() RETURNS trigger
        LANGUAGE plpgsql
        AS $$
    DECLARE
        current_stock INTEGER;
    BEGIN
        SELECT stock_quantity INTO current_stock
        FROM swapp.product_variants
        WHERE variant_id = NEW.variant_id
        FOR UPDATE;
        NEW.stock_before := COALESCE(current_stock, 0);
        NEW.stock_after := COALESCE(current_stock, 0) + NEW.quantity;
        UPDATE swapp.product_variants
        SET stock_quantity = NEW.stock_after,
            updated_at = NOW()
        WHERE variant_id = NEW.variant_id;
        RETURN NEW;
    END;
    $$;

    CREATE FUNCTION swapp.update_updated_at_column() RETURNS trigger
        LANGUAGE plpgsql
        AS $$
    BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
    END;
    $$;

    CREATE TRIGGER trg_process_inventory_movement BEFORE INSERT ON swapp.inventory_movements FOR EACH ROW EXECUTE FUNCTION swapp.process_inventory_movement();
    CREATE TRIGGER update_product_media_updated_at BEFORE UPDATE ON swapp.product_media FOR EACH ROW EXECUTE FUNCTION swapp.update_updated_at_column();
    CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON swapp.users FOR EACH ROW EXECUTE FUNCTION swapp.update_updated_at_column();
    """)


def downgrade() -> None:
    op.drop_table('product_price_history', schema='swapp')
    op.drop_table('order_items', schema='swapp')
    op.drop_index(op.f('ix_swapp_inventory_movements_movement_id'), table_name='inventory_movements', schema='swapp')
    op.drop_table('inventory_movements', schema='swapp')
    op.drop_table('user_image_analyses', schema='swapp')
    op.drop_index(op.f('ix_swapp_product_variants_sku'), table_name='product_variants', schema='swapp')
    op.drop_table('product_variants', schema='swapp')
    op.drop_table('product_relationships', schema='swapp')
    op.drop_table('product_media', schema='swapp')
    op.drop_table('product_discounts', schema='swapp')
    op.drop_table('user_sessions', schema='swapp')
    op.drop_table('products', schema='swapp')
    op.drop_table('payments', schema='swapp')
    op.drop_table('password_resets', schema='swapp')
    op.drop_table('order_status_history', schema='swapp')
    op.drop_table('login_history', schema='swapp')
    op.drop_table('email_verifications', schema='swapp')
    op.drop_index(op.f('ix_swapp_users_email'), table_name='users', schema='swapp')
    op.drop_table('users', schema='swapp')
    op.drop_table('subcategory_attributes', schema='swapp')
    op.drop_table('product_attribute_values', schema='swapp')
    op.drop_table('orders', schema='swapp')
    op.drop_table('brands', schema='swapp')
    op.drop_table('tax_classes', schema='swapp')
    op.drop_index(op.f('ix_swapp_staff_users_email'), table_name='staff_users', schema='swapp')
    op.drop_table('staff_users', schema='swapp')
    op.drop_table('product_categories', schema='swapp')
    op.drop_table('product_attributes', schema='swapp')
