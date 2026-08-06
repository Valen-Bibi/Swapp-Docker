from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'adcaf3ca6dfe'
down_revision: Union[str, None] = 'c1f1bb1b7895'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    # Eliminamos las columnas apuntando específicamente al esquema 'swapp'
    op.drop_column('products', 'main_image_url', schema='swapp')
    op.drop_column('products', 'gallery_images', schema='swapp')
    op.drop_column('products', 'video_url', schema='swapp')


def downgrade():
    # Instrucciones por si alguna vez querés deshacer este cambio y volver atrás
    op.add_column('products', sa.Column('main_image_url', sa.Text(), nullable=True), schema='swapp')
    op.add_column('products', sa.Column('gallery_images', postgresql.ARRAY(sa.Text()), nullable=True), schema='swapp')
    op.add_column('products', sa.Column('video_url', sa.Text(), nullable=True), schema='swapp')
