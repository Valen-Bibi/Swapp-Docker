"""add_price_trigger

Revision ID: 32ec58e24a24
Revises: 65407143f7a8
Create Date: 2026-08-19 13:07:55.722954

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '32ec58e24a24'
down_revision: Union[str, None] = '65407143f7a8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    # 1. Creamos la función del trigger adaptada a las columnas de la variante
    op.execute("""
    CREATE OR REPLACE FUNCTION swapp.log_variant_price_change()
    RETURNS TRIGGER AS $$
    BEGIN
        -- Verificamos si el precio de venta o el costo realmente cambiaron
        IF OLD.price IS DISTINCT FROM NEW.price OR OLD.cost_price IS DISTINCT FROM NEW.cost_price THEN
            INSERT INTO swapp.product_price_history (
                product_id, 
                old_value, 
                new_value, 
                record_type,
                changed_at
            )
            VALUES (
                NEW.product_id, 
                OLD.price, 
                NEW.price, 
                'variant_price_update',
                NOW()
            );
        END IF;
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    """)

    # 2. Atamos el trigger a la tabla product_variants
    op.execute("""
    CREATE TRIGGER trg_variant_price_change
    AFTER UPDATE OF price, cost_price ON swapp.product_variants
    FOR EACH ROW
    EXECUTE FUNCTION swapp.log_variant_price_change();
    """)

def downgrade():
    # Para poder revertir la migración si algo sale mal
    op.execute("DROP TRIGGER IF EXISTS trg_variant_price_change ON swapp.product_variants")
    op.execute("DROP FUNCTION IF EXISTS swapp.log_variant_price_change()")
