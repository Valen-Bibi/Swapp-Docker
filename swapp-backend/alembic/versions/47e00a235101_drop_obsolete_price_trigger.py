"""drop_obsolete_price_trigger

Revision ID: 47e00a235101
Revises: 32ec58e24a24
Create Date: 2026-08-19 14:31:10.388936

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '47e00a235101'
down_revision: Union[str, None] = '32ec58e24a24'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    op.execute("DROP TRIGGER IF EXISTS trg_variant_price_change ON swapp.product_variants CASCADE")
    op.execute("DROP FUNCTION IF EXISTS swapp.log_variant_price_change() CASCADE")

def downgrade():
    pass
