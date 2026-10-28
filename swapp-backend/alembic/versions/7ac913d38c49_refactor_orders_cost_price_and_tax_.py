"""refactor_orders_cost_price_and_tax_traceability

Revision ID: 7ac913d38c49
Revises: c3074a074f8a
Create Date: 2026-10-27 11:11:00.183965

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7ac913d38c49'
down_revision: Union[str, None] = 'c3074a074f8a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # =========================================================================
    # 1. TABLA: swapp.orders
    # =========================================================================
    # Renombramos total_amount -> total_price sin perder datos
    op.alter_column(
        "orders",
        "total_amount",
        new_column_name="total_price",
        schema="swapp"
    )

    op.add_column(
        "orders",
        sa.Column("total_cost", sa.Numeric(10, 2), server_default="0.00", nullable=False),
        schema="swapp"
    )
    op.add_column(
        "orders",
        sa.Column("order_date", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        schema="swapp"
    )
    op.add_column(
        "orders",
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        schema="swapp"
    )
    op.add_column(
        "orders",
        sa.Column("updated_by", sa.BigInteger(), nullable=True),
        schema="swapp"
    )

    op.create_foreign_key(
        "orders_updated_by_fkey",
        "orders",
        "staff_users",
        ["updated_by"],
        ["staff_id"],
        source_schema="swapp",
        referent_schema="swapp"
    )

    # Sincronizamos order_date con created_at para órdenes preexistentes
    op.execute("UPDATE swapp.orders SET order_date = created_at")

    # Índices de rendimiento en swapp.orders
    op.create_index("idx_orders_client_id", "orders", ["client_id"], schema="swapp")
    op.create_index("idx_orders_status", "orders", ["status"], schema="swapp")
    op.create_index("idx_orders_order_date", "orders", [sa.text("order_date DESC")], schema="swapp")
    op.create_index("idx_orders_scheduled_delivery", "orders", ["scheduled_delivery_date"], schema="swapp")

    # =========================================================================
    # 2. TABLA: swapp.order_items
    # =========================================================================
    # Renombramos subtotal -> subtotal_price sin perder datos
    op.alter_column(
        "order_items",
        "subtotal",
        new_column_name="subtotal_price",
        schema="swapp"
    )

    # Normalizamos discount_amount para evitar NULLs
    op.execute("UPDATE swapp.order_items SET discount_amount = 0.00 WHERE discount_amount IS NULL")
    op.alter_column(
        "order_items",
        "discount_amount",
        existing_type=sa.Numeric(10, 2),
        server_default="0.00",
        nullable=False,
        schema="swapp"
    )

    # Nuevas columnas de trazabilidad de costos, precios e IVA
    op.add_column(
        "order_items",
        sa.Column("unit_cost", sa.Numeric(10, 2), server_default="0.00", nullable=False),
        schema="swapp"
    )
    op.add_column(
        "order_items",
        sa.Column("internal_unit_price", sa.Numeric(10, 2), server_default="0.00", nullable=False),
        schema="swapp"
    )
    op.add_column(
        "order_items",
        sa.Column("internal_unit_cost", sa.Numeric(10, 2), server_default="0.00", nullable=False),
        schema="swapp"
    )
    op.add_column(
        "order_items",
        sa.Column("subtotal_cost", sa.Numeric(10, 2), server_default="0.00", nullable=False),
        schema="swapp"
    )
    op.add_column(
        "order_items",
        sa.Column("tax_rate", sa.Numeric(5, 2), server_default="0.00", nullable=False),
        schema="swapp"
    )
    op.add_column(
        "order_items",
        sa.Column("is_custom_price", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        schema="swapp"
    )

    # Backfill automático: poblamos tax_rate en ítems preexistentes según su producto actual
    op.execute("""
        UPDATE swapp.order_items oi
        SET tax_rate = tc.rate
        FROM swapp.products p
        JOIN swapp.tax_classes tc ON p.tax_class_id = tc.tax_class_id
        WHERE oi.product_id = p.product_id
    """)

    # Índices de rendimiento en swapp.order_items
    op.create_index("idx_order_items_order_id", "order_items", ["order_id"], schema="swapp")
    op.create_index("idx_order_items_product_id", "order_items", ["product_id"], schema="swapp")

    # =========================================================================
    # 3. TABLA: swapp.order_status_history
    # =========================================================================
    op.add_column(
        "order_status_history",
        sa.Column("notes", sa.Text(), nullable=True),
        schema="swapp"
    )
    op.create_index("idx_order_status_history_order_id", "order_status_history", ["order_id"], schema="swapp")


def downgrade() -> None:
    # 3. Revertir swapp.order_status_history
    op.drop_index("idx_order_status_history_order_id", table_name="order_status_history", schema="swapp")
    op.drop_column("order_status_history", "notes", schema="swapp")

    # 2. Revertir swapp.order_items
    op.drop_index("idx_order_items_product_id", table_name="order_items", schema="swapp")
    op.drop_index("idx_order_items_order_id", table_name="order_items", schema="swapp")
    op.drop_column("order_items", "is_custom_price", schema="swapp")
    op.drop_column("order_items", "tax_rate", schema="swapp")
    op.drop_column("order_items", "subtotal_cost", schema="swapp")
    op.drop_column("order_items", "internal_unit_cost", schema="swapp")
    op.drop_column("order_items", "internal_unit_price", schema="swapp")
    op.drop_column("order_items", "unit_cost", schema="swapp")

    op.alter_column(
        "order_items",
        "discount_amount",
        existing_type=sa.Numeric(10, 2),
        server_default=None,
        nullable=True,
        schema="swapp"
    )
    op.alter_column(
        "order_items",
        "subtotal_price",
        new_column_name="subtotal",
        schema="swapp"
    )

    # 1. Revertir swapp.orders
    op.drop_index("idx_orders_scheduled_delivery", table_name="orders", schema="swapp")
    op.drop_index("idx_orders_order_date", table_name="orders", schema="swapp")
    op.drop_index("idx_orders_status", table_name="orders", schema="swapp")
    op.drop_index("idx_orders_client_id", table_name="orders", schema="swapp")

    op.drop_constraint("orders_updated_by_fkey", "orders", schema="swapp", type_="foreignkey")
    op.drop_column("orders", "updated_by", schema="swapp")
    op.drop_column("orders", "completed_at", schema="swapp")
    op.drop_column("orders", "order_date", schema="swapp")
    op.drop_column("orders", "total_cost", schema="swapp")

    op.alter_column(
        "orders",
        "total_price",
        new_column_name="total_amount",
        schema="swapp"
    )