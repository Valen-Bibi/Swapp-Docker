"""move low_stock_threshold to variants

Revision ID: 341ce0ed174e
Revises: 67731c6dba70
Create Date: 2026-08-20 12:52:54.305988

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '341ce0ed174e'
down_revision: Union[str, None] = '67731c6dba70'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    # 1. Agregamos la columna a las variantes. 
    # Usamos server_default='5' para que las variantes que ya tenés guardadas
    # en la base de datos se completen con un 5 y no de error de valor nulo.
    op.add_column(
        'product_variants', 
        sa.Column('low_stock_threshold', sa.Integer(), server_default='5', nullable=False),
        schema='swapp'
    )
    
    # 2. Eliminamos la columna del padre
    op.drop_column('products', 'low_stock_threshold', schema='swapp')

def downgrade():
    # 1. Revertimos el proceso: volvemos a poner la columna en el padre
    op.add_column(
        'products', 
        sa.Column('low_stock_threshold', sa.Integer(), server_default='5', nullable=True),
        schema='swapp'
    )
    
    # 2. Eliminamos la columna de las variantes
    op.drop_column('product_variants', 'low_stock_threshold', schema='swapp')
