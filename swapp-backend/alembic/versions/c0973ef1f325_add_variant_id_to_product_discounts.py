"""add_variant_id_to_product_discounts

Revision ID: c0973ef1f325
Revises: 6a6104c2a0f0
Create Date: 2026-08-20 18:07:40.769879

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c0973ef1f325'
down_revision: Union[str, None] = '6a6104c2a0f0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    # 1. Agregamos la columna permitiendo nulos
    op.add_column(
        'product_discounts',
        sa.Column('variant_id', sa.BigInteger(), nullable=True),
        schema='swapp'
    )
    
    # 2. Creamos la relación de Foreign Key
    op.create_foreign_key(
        'fk_product_discounts_variant_id_product_variants',
        source_table='product_discounts',
        referent_table='product_variants',
        local_cols=['variant_id'],
        remote_cols=['variant_id'],
        source_schema='swapp',
        referent_schema='swapp',
        ondelete='CASCADE'
    )

def downgrade():
    # 1. Eliminamos primero la Foreign Key
    op.drop_constraint(
        'fk_product_discounts_variant_id_product_variants',
        table_name='product_discounts',
        schema='swapp',
        type_='foreignkey'
    )
    
    # 2. Eliminamos la columna
    op.drop_column(
        'product_discounts',
        'variant_id',
        schema='swapp'
    )