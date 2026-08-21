"""add variant_id to inventory_movements

Revision ID: 67731c6dba70
Revises: 4fb8d03a89e5
Create Date: 2026-08-20 12:09:07.775799

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '67731c6dba70'
down_revision: Union[str, None] = '4fb8d03a89e5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    # 1. Agregar la columna
    op.add_column(
        'inventory_movements', 
        sa.Column('variant_id', sa.BigInteger(), nullable=True), 
        schema='swapp'
    )
    
    # 2. Crear la llave foránea
    op.create_foreign_key(
        'fk_inventory_movements_variant_id',
        source_table='inventory_movements',
        referent_table='product_variants',
        local_cols=['variant_id'],
        remote_cols=['variant_id'],
        source_schema='swapp',
        referent_schema='swapp',
        ondelete='CASCADE'
    )

def downgrade():
    op.drop_constraint('fk_inventory_movements_variant_id', 'inventory_movements', schema='swapp', type_='foreignkey')
    op.drop_column('inventory_movements', 'variant_id', schema='swapp')
