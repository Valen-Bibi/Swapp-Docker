"""add_pim_attributes_ecosystem

Revision ID: c7178d385fe7
Revises: 82c93ad906c3
Create Date: 2026-08-24 14:51:00.019486

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c7178d385fe7'
down_revision: Union[str, None] = '82c93ad906c3'
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


def downgrade() -> None:
    op.drop_table('subcategory_attributes', schema='swapp')
    op.drop_table('product_attribute_values', schema='swapp')
    op.drop_table('product_attributes', schema='swapp')
