"""fix_fkeys_staff"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'f47cb62c1370'
down_revision = '6b8b7fd5e94b'
branch_labels = None
depends_on = None

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