"""add variant_id to inventory_movements

Revision ID: 82c93ad906c3
Revises: 559c73250db4
Create Date: 2026-08-21 17:38:37.752769

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '82c93ad906c3'
down_revision: Union[str, None] = '559c73250db4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    # 1. Agregamos la columna permitiendo nulos temporalmente (por si hay movimientos viejos)
    op.add_column(
        'inventory_movements', 
        sa.Column('variant_id', sa.BigInteger(), nullable=True), 
        schema='swapp'
    )
    
    # 2. Creamos la llave foránea apuntando a la tabla de variantes
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
    # 1. Eliminamos la llave foránea
    op.drop_constraint(
        'fk_inventory_movements_variant_id', 
        table_name='inventory_movements', 
        schema='swapp', 
        type_='foreignkey'
    )
    
    # 2. Eliminamos la columna
    op.drop_column('inventory_movements', 'variant_id', schema='swapp')