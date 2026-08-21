"""add_variant_id_to_price_history

Revision ID: 559c73250db4
Revises: f6c08e8ad03e
Create Date: 2026-08-21 14:04:03.633077

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '559c73250db4'
down_revision: Union[str, None] = 'f6c08e8ad03e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Agregamos la columna solo si no existe
    op.execute("""
        DO $$ 
        BEGIN 
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'swapp' 
                AND table_name = 'product_price_history' 
                AND column_name = 'variant_id'
            ) THEN
                ALTER TABLE swapp.product_price_history ADD COLUMN variant_id BIGINT;
            END IF;
        END $$;
    """)
    
    # 2. Creamos la llave foránea de forma segura (verificando si ya existe previamente para evitar duplicados)
    op.execute("""
        DO $$ 
        BEGIN 
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.table_constraints 
                WHERE table_schema = 'swapp' 
                AND table_name = 'product_price_history' 
                AND constraint_name = 'fk_price_history_variant_id'
            ) THEN
                ALTER TABLE swapp.product_price_history 
                ADD CONSTRAINT fk_price_history_variant_id 
                FOREIGN KEY (variant_id) 
                REFERENCES swapp.product_variants(variant_id) 
                ON DELETE CASCADE;
            END IF;
        END $$;
    """)


def downgrade() -> None:
    # Rollback ordenado
    op.drop_constraint('fk_price_history_variant_id', 'product_price_history', schema='swapp', type_='foreignkey')
    op.drop_column('product_price_history', 'variant_id', schema='swapp')