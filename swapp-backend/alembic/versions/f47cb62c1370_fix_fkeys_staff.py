"""fix_fkeys_staff

Revision ID: f47cb62c1370
Revises: adcaf3ca6dfe
Create Date: 2026-08-06 16:02:49.583905

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f47cb62c1370'
down_revision: Union[str, None] = 'adcaf3ca6dfe'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    # 1. Eliminar llaves foráneas viejas y crear nuevas en 'products'
    op.drop_constraint('products_created_by_fkey', 'products', schema='swapp', type_='foreignkey')
    op.drop_constraint('products_updated_by_fkey', 'products', schema='swapp', type_='foreignkey')
    op.create_foreign_key('products_created_by_staff_fk', 'products', 'staff_users', ['created_by'], ['staff_id'], source_schema='swapp', referent_schema='swapp')
    op.create_foreign_key('products_updated_by_staff_fk', 'products', 'staff_users', ['updated_by'], ['staff_id'], source_schema='swapp', referent_schema='swapp')

    # 2. Eliminar llaves foráneas viejas y crear nuevas en 'brands'
    op.drop_constraint('brands_created_by_fkey', 'brands', schema='swapp', type_='foreignkey')
    op.drop_constraint('brands_updated_by_fkey', 'brands', schema='swapp', type_='foreignkey')
    op.create_foreign_key('brands_created_by_staff_fk', 'brands', 'staff_users', ['created_by'], ['staff_id'], source_schema='swapp', referent_schema='swapp')
    op.create_foreign_key('brands_updated_by_staff_fk', 'brands', 'staff_users', ['updated_by'], ['staff_id'], source_schema='swapp', referent_schema='swapp')

def downgrade():
    pass
