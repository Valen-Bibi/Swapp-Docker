"""add_image_url_to_variants

Revision ID: ccb943c52da4
Revises: b4954afe5ce9
Create Date: 2026-08-21 12:27:47.333788

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ccb943c52da4'
down_revision: Union[str, None] = 'b4954afe5ce9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
