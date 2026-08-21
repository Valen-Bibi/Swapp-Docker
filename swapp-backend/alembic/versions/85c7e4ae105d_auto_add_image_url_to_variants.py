"""auto_add_image_url_to_variants

Revision ID: 85c7e4ae105d
Revises: ccb943c52da4
Create Date: 2026-08-21 12:36:55.519884

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '85c7e4ae105d'
down_revision: Union[str, None] = 'ccb943c52da4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Agregamos EXCLUSIVAMENTE la columna de la imagen para no interferir con otras ramas
    op.add_column('product_variants', sa.Column('image_url', sa.String(length=500), nullable=True), schema='swapp')


def downgrade() -> None:
    # El rollback correcto y aislado
    op.drop_column('product_variants', 'image_url', schema='swapp')