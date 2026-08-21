"""add_reference_prices_to_product

Revision ID: 6a6104c2a0f0
Revises: 341ce0ed174e
Create Date: 2026-08-20 16:26:26.496901

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6a6104c2a0f0'
down_revision: Union[str, None] = '341ce0ed174e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    op.add_column(
        'products',
        sa.Column('reference_price', sa.Numeric(precision=10, scale=2), server_default='0.0', nullable=False),
        schema='swapp'
    )
    op.add_column(
        'products',
        sa.Column('reference_cost', sa.Numeric(precision=10, scale=2), server_default='0.0', nullable=False),
        schema='swapp'
    )

def downgrade():
    op.drop_column('products', 'reference_cost', schema='swapp')
    op.drop_column('products', 'reference_price', schema='swapp')
