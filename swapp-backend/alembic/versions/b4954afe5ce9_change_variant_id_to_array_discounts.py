"""change_variant_id_to_array_discounts

Revision ID: b4954afe5ce9
Revises: c0973ef1f325
Create Date: 2026-08-20 20:30:36.585469

"""
from typing import Sequence, Union

from sqlalchemy.dialects import postgresql
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b4954afe5ce9'
down_revision: Union[str, None] = 'c0973ef1f325'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    # 1. Eliminar la Foreign Key
    op.drop_constraint(
        'fk_product_discounts_variant_id_product_variants', 
        'product_discounts', 
        schema='swapp', 
        type_='foreignkey'
    )
    
    # 2. Eliminar la columna vieja
    op.drop_column('product_discounts', 'variant_id', schema='swapp')
    
    # 3. Crear la nueva columna como ARRAY de BigInteger
    op.add_column(
        'product_discounts', 
        sa.Column('variant_ids', postgresql.ARRAY(sa.BigInteger()), nullable=True), 
        schema='swapp'
    )

def downgrade():
    # 1. Eliminar la columna nueva
    op.drop_column('product_discounts', 'variant_ids', schema='swapp')
    
    # 2. Recrear la columna vieja
    op.add_column(
        'product_discounts', 
        sa.Column('variant_id', sa.BigInteger(), autoincrement=False, nullable=True), 
        schema='swapp'
    )
    
    # 3. Recrear la Foreign Key
    op.create_foreign_key(
        'fk_product_discounts_variant_id_product_variants', 
        'product_discounts', 
        'product_variants', 
        ['variant_id'], 
        ['variant_id'], 
        source_schema='swapp', 
        referent_schema='swapp', 
        ondelete='CASCADE'
    )