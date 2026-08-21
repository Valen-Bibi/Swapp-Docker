"""drop_legacy_prices_from_products

Revision ID: f6c08e8ad03e
Revises: 85c7e4ae105d
Create Date: 2026-08-21 13:50:52.001964

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f6c08e8ad03e'
down_revision: Union[str, None] = '85c7e4ae105d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Eliminamos las columnas obsoletas de la carcasa
    op.drop_column('products', 'base_price', schema='swapp')
    op.drop_column('products', 'cost_price', schema='swapp')


def downgrade() -> None:
    # Restauramos las columnas en caso de rollback
    op.add_column('products', sa.Column('base_price', sa.Numeric(precision=10, scale=2), server_default='0.0', nullable=False), schema='swapp')
    op.add_column('products', sa.Column('cost_price', sa.Numeric(precision=10, scale=2), server_default='0.0', nullable=False), schema='swapp')