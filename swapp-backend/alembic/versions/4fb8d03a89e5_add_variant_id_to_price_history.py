"""add_variant_id_to_price_history

Revision ID: 4fb8d03a89e5
Revises: 47e00a235101
Create Date: 2026-08-19 20:20:14.889717

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4fb8d03a89e5'
down_revision: Union[str, None] = '47e00a235101'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    # Agregamos la columna como nullable=True para que no falle si la tabla ya tiene datos
    op.add_column(
        'product_price_history',
        sa.Column('variant_id', sa.BigInteger(), nullable=True),
        schema='swapp'
    )
    
    # Creamos la Foreign Key apuntando a product_variants
    op.create_foreign_key(
        'fk_price_history_variant_id',
        source_table='product_price_history',
        referent_table='product_variants',
        local_cols=['variant_id'],
        remote_cols=['variant_id'],
        source_schema='swapp',
        referent_schema='swapp',
        ondelete='CASCADE'
    )

def downgrade():
    # Deshacemos los cambios en orden inverso
    op.drop_constraint('fk_price_history_variant_id', 'product_price_history', schema='swapp', type_='foreignkey')
    op.drop_column('product_price_history', 'variant_id', schema='swapp')