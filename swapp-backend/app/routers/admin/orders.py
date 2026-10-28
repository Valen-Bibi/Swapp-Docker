from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List, Optional
from uuid import UUID
from datetime import datetime, timezone

from ... import models, schemas
from ...database import get_db
from ...auth import get_current_admin_user

router = APIRouter(prefix="/api/orders/admin", tags=["Admin Orders"])


def _resolve_unit_cost(
    db: Session,
    product_id: int,
    variant_id: Optional[int],
    target_date: Optional[datetime],
    fallback_cost: float = 0.0
) -> float:
    """
    Busca el costo histórico en swapp.product_price_history (record_type = 'cost_price').
    Si se especifica target_date, busca el costo vigente en esa fecha; si no encuentra,
    toma el último registrado o el cost_price actual de la variante.
    """
    base_query = db.query(models.ProductPriceHistory).filter(
        models.ProductPriceHistory.product_id == product_id,
        models.ProductPriceHistory.record_type == "cost_price"
    )
    if variant_id is not None:
        base_query = base_query.filter(models.ProductPriceHistory.variant_id == variant_id)

    history_record = None
    if target_date is not None:
        history_record = base_query.filter(
            models.ProductPriceHistory.changed_at <= target_date
        ).order_by(
            models.ProductPriceHistory.changed_at.desc(),
            models.ProductPriceHistory.history_id.desc()
        ).first()

    if not history_record:
        history_record = base_query.order_by(
            models.ProductPriceHistory.changed_at.desc(),
            models.ProductPriceHistory.history_id.desc()
        ).first()

    if history_record and history_record.new_value is not None:
        return float(history_record.new_value)

    return float(fallback_cost or 0.0)


@router.post("", response_model=schemas.OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order_admin(
    order_data: schemas.OrderCreate,
    db: Session = Depends(get_db),
    admin_user = Depends(get_current_admin_user)
):
    try:
        client = db.query(models.Client).filter(models.Client.client_id == order_data.client_id).first()
        if not client:
            raise HTTPException(status_code=400, detail="El cliente seleccionado no existe.")

        effective_order_date = order_data.order_date or datetime.now(timezone.utc)

        new_order = models.Order(
            client_id=order_data.client_id,
            delivery_address=order_data.delivery_address,
            delivery_zone=order_data.delivery_zone,
            order_date=effective_order_date,
            scheduled_delivery_date=order_data.scheduled_delivery_date,
            logistics_notes=order_data.logistics_notes,
            total_price=order_data.total_price,
            total_cost=0.0,
            status="pending",
            created_by=admin_user.staff_id,
            updated_by=admin_user.staff_id
        )
        db.add(new_order)
        db.flush()

        # Registro Inicial en la Bitácora
        history = models.OrderStatusHistory(
            order_id=new_order.order_id,
            old_status="created",
            new_status="pending",
            notes="Creación inicial del pedido",
            changed_by=admin_user.staff_id
        )
        db.add(history)

        accumulated_total_cost = 0.0

        for item in order_data.items:
            product = db.query(models.Product).filter(models.Product.product_id == item.product_id).first()
            if not product:
                raise HTTPException(status_code=400, detail=f"El producto principal con ID {item.product_id} no existe.")

            # 1. Resolución de Alícuota de IVA (tax_rate)
            tax_rate_val = 0.0
            if product.tax_class_id:
                tax_obj = db.query(models.TaxClass).filter(
                    models.TaxClass.tax_class_id == product.tax_class_id
                ).first()
                if tax_obj and tax_obj.rate is not None:
                    tax_rate_val = float(tax_obj.rate)

            # 2. Bloqueo y validación de la variante principal (Reserva Dura)
            variant = None
            if item.variant_id:
                variant = db.query(models.ProductVariant).filter(
                    models.ProductVariant.variant_id == item.variant_id
                ).with_for_update().first()

                if not variant:
                    raise HTTPException(status_code=400, detail=f"La variante con ID {item.variant_id} no existe.")

            # 3. Costo unitario del producto principal
            if item.unit_cost is not None:
                resolved_unit_cost = float(item.unit_cost)
            else:
                fallback_main_cost = float(variant.cost_price) if (variant and variant.cost_price is not None) else 0.0
                resolved_unit_cost = _resolve_unit_cost(
                    db=db,
                    product_id=product.product_id,
                    variant_id=item.variant_id,
                    target_date=effective_order_date,
                    fallback_cost=fallback_main_cost
                )

            # 4. Resolución del Producto Interno (Envase Vacío / Recarga)
            resolved_internal_prod_id = item.internal_product_id or product.linked_internal_product_id
            internal_var_id = None
            resolved_internal_price = float(item.internal_unit_price or 0.0)
            resolved_internal_cost = 0.0

            if resolved_internal_prod_id:
                int_prod = db.query(models.Product).options(joinedload(models.Product.variants)).filter(
                    models.Product.product_id == resolved_internal_prod_id
                ).first()
                if int_prod and int_prod.variants:
                    int_var = int_prod.variants[0]  # Regla 1: Única variante activa
                    internal_var_id = int_var.variant_id

                    # Si no vino precio de recarga explícito en el payload, usamos el de la variante interna
                    if resolved_internal_price <= 0 and int_var.price is not None:
                        resolved_internal_price = float(int_var.price)

                    if item.internal_unit_cost is not None:
                        resolved_internal_cost = float(item.internal_unit_cost)
                    else:
                        fallback_int_cost = float(int_var.cost_price) if int_var.cost_price is not None else 0.0
                        resolved_internal_cost = _resolve_unit_cost(
                            db=db,
                            product_id=int_prod.product_id,
                            variant_id=internal_var_id,
                            target_date=effective_order_date,
                            fallback_cost=fallback_int_cost
                        )

            # 5. Cálculo matemático de subtotal_cost (Nuevos vs Recargas)
            qty = max(0, item.quantity)
            refills_qty = min(max(0, item.expected_return_qty), qty) if item.requires_return else 0
            news_qty = qty - refills_qty

            item_subtotal_cost = round(
                (news_qty * resolved_unit_cost) + (refills_qty * resolved_internal_cost),
                2
            )
            accumulated_total_cost += item_subtotal_cost

            new_item = models.OrderItem(
                order_id=new_order.order_id,
                product_id=item.product_id,
                variant_id=item.variant_id,
                unit_price=item.unit_price,
                unit_cost=resolved_unit_cost,
                internal_unit_price=resolved_internal_price,
                internal_unit_cost=resolved_internal_cost,
                quantity=item.quantity,
                subtotal_price=item.subtotal_price,
                subtotal_cost=item_subtotal_cost,
                tax_rate=tax_rate_val,
                is_custom_price=item.is_custom_price,
                requires_return=item.requires_return,
                expected_return_qty=item.expected_return_qty,
                actual_return_qty=0,
                internal_product_id=resolved_internal_prod_id,
                internal_variant_id=internal_var_id,
                discount_id=item.discount_id,
                campaign_name=item.campaign_name,
                discount_amount=item.discount_amount or 0.0
            )
            db.add(new_item)

            # 6. Descuento de Stock Físico (Reserva Dura)
            if variant:
                stock_before = variant.stock_quantity
                stock_after = stock_before - item.quantity
                variant.stock_quantity = stock_after

                sale_movement = models.InventoryMovement(
                    product_id=item.product_id,
                    variant_id=item.variant_id,
                    movement_type='sale',
                    quantity=-(item.quantity),
                    unit_cost=resolved_unit_cost,
                    stock_before=stock_before,
                    stock_after=stock_after,
                    reference_id=new_order.order_id,
                    reference_type='order',
                    reason=f"Venta descontada en pedido {new_order.order_uuid}",
                    created_by=admin_user.staff_id
                )
                db.add(sale_movement)

        new_order.total_cost = round(accumulated_total_cost, 2)

        db.commit()
        db.refresh(new_order)
        return new_order

    except HTTPException as e:
        db.rollback()
        raise e
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al registrar pedido: {str(e)}")


@router.get("", response_model=List[schemas.OrderResponse])
def get_orders(
    status_filter: str = None,
    zone_filter: str = None,
    db: Session = Depends(get_db),
    admin_user = Depends(get_current_admin_user)
):
    query = db.query(models.Order).options(
        joinedload(models.Order.items),
        joinedload(models.Order.client),
        joinedload(models.Order.payments)
    )

    if status_filter:
        query = query.filter(models.Order.status == status_filter)
    if zone_filter:
        query = query.filter(models.Order.delivery_zone == zone_filter)

    orders = query.order_by(
        models.Order.order_date.desc(),
        models.Order.created_at.desc()
    ).all()
    return orders


@router.get("/{order_uuid}", response_model=schemas.OrderResponse)
def get_order_detail(
    order_uuid: UUID,
    db: Session = Depends(get_db),
    admin_user = Depends(get_current_admin_user)
):
    order = db.query(models.Order)\
              .options(
                  joinedload(models.Order.items),
                  joinedload(models.Order.client),
                  joinedload(models.Order.payments)
              )\
              .filter(models.Order.order_uuid == order_uuid)\
              .first()

    if not order:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")

    return order


@router.patch("/{order_uuid}/status")
def update_order_status(
    order_uuid: UUID,
    payload: schemas.OrderStatusUpdate,
    db: Session = Depends(get_db),
    admin_user = Depends(get_current_admin_user)
):
    order = db.query(models.Order).options(joinedload(models.Order.items)).filter(models.Order.order_uuid == order_uuid).first()
    if not order:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")

    old_status = order.status
    new_status = payload.new_status

    if old_status == 'completed' and new_status == 'cancelled':
        raise HTTPException(status_code=400, detail="No puedes cancelar un pedido que ya fue entregado.")

    if old_status == new_status:
        return {"message": "El pedido ya tiene ese estado."}

    order.status = new_status
    order.updated_by = admin_user.staff_id

    if new_status == 'completed' and not order.completed_at:
        order.completed_at = func.now()

    history = models.OrderStatusHistory(
        order_id=order.order_id,
        old_status=old_status,
        new_status=new_status,
        notes=payload.notes,
        changed_by=admin_user.staff_id
    )
    db.add(history)

    # 1. CANCELACIÓN: Devolver la reserva dura al producto principal
    if new_status == 'cancelled' and old_status == 'pending':
        for item in order.items:
            if item.variant_id:
                variant = db.query(models.ProductVariant).filter(
                    models.ProductVariant.variant_id == item.variant_id
                ).with_for_update().first()

                if variant:
                    stock_before = variant.stock_quantity
                    stock_after = stock_before + item.quantity
                    variant.stock_quantity = stock_after

                    return_movement = models.InventoryMovement(
                        product_id=item.product_id,
                        variant_id=item.variant_id,
                        movement_type='return',
                        quantity=item.quantity,
                        unit_cost=item.unit_cost,
                        stock_before=stock_before,
                        stock_after=stock_after,
                        reference_id=order.order_id,
                        reference_type='order_cancellation',
                        reason=f"Reintegro por cancelación de pedido {order.order_uuid}",
                        created_by=admin_user.staff_id
                    )
                    db.add(return_movement)

    # 2. CIERRE DE ENVASES Y LEDGER (Solo al completarse)
    elif new_status == 'completed' and old_status == 'pending':
        actual_returns = {int(k): v for k, v in (payload.actual_returns or {}).items()}

        for item in order.items:
            returned_qty = actual_returns.get(item.item_id, 0)
            item.actual_return_qty = returned_qty

            main_product = db.query(models.Product).filter(models.Product.product_id == item.product_id).first()
            internal_prod_id = item.internal_product_id or (main_product.linked_internal_product_id if main_product else None)

            if item.requires_return and internal_prod_id:
                # Buscamos la variante física del envase vacío
                internal_variant_query = db.query(models.ProductVariant)
                if item.internal_variant_id:
                    internal_variant_query = internal_variant_query.filter(
                        models.ProductVariant.variant_id == item.internal_variant_id
                    )
                else:
                    internal_variant_query = internal_variant_query.filter(
                        models.ProductVariant.product_id == internal_prod_id
                    )

                internal_variant = internal_variant_query.with_for_update().first()
                if not internal_variant:
                    continue

                # A. ABSORCIÓN: Chequeamos el saldo de envases VACÍOS del cliente
                current_balance = db.query(func.sum(models.ClientContainerLedger.quantity_change)).filter(
                    models.ClientContainerLedger.client_id == order.client_id,
                    models.ClientContainerLedger.product_id == internal_prod_id
                ).scalar() or 0

                if returned_qty > current_balance:
                    absorbed_qty = returned_qty - current_balance
                    absorption_ledger = models.ClientContainerLedger(
                        client_id=order.client_id,
                        product_id=internal_prod_id,
                        order_id=order.order_id,
                        transaction_type='absorption',
                        quantity_change=absorbed_qty,
                        staff_id=admin_user.staff_id,
                        notes=f"Absorción automática de envases externos ({absorbed_qty} un.)"
                    )
                    db.add(absorption_ledger)

                # B. ENTREGA: Al darle un lleno, el cliente nos debe un VACÍO (+ quantity_change)
                ledger_delivery = models.ClientContainerLedger(
                    client_id=order.client_id,
                    product_id=internal_prod_id,
                    order_id=order.order_id,
                    transaction_type='delivery',
                    quantity_change=item.quantity,
                    staff_id=admin_user.staff_id,
                    notes="Deuda generada por entrega de envases llenos"
                )
                db.add(ledger_delivery)

                # C. RETORNO Y GALPÓN: Si devuelve vacíos...
                if returned_qty > 0:
                    ledger_return = models.ClientContainerLedger(
                        client_id=order.client_id,
                        product_id=internal_prod_id,
                        order_id=order.order_id,
                        transaction_type='return',
                        quantity_change=-returned_qty,
                        staff_id=admin_user.staff_id,
                        notes="Descargo por devolución de envases vacíos"
                    )
                    db.add(ledger_return)

                    stock_before = internal_variant.stock_quantity
                    stock_after = stock_before + returned_qty
                    internal_variant.stock_quantity = stock_after

                    empty_container_movement = models.InventoryMovement(
                        product_id=internal_prod_id,
                        variant_id=internal_variant.variant_id,
                        movement_type='return',
                        quantity=returned_qty,
                        unit_cost=item.internal_unit_cost,
                        stock_before=stock_before,
                        stock_after=stock_after,
                        reference_id=order.order_id,
                        reference_type='empty_container_return',
                        reason=f"Ingreso de envases vacíos (Pedido {order.order_uuid})",
                        created_by=admin_user.staff_id
                    )
                    db.add(empty_container_movement)

    db.commit()
    return {"message": f"Estado actualizado a {new_status}. El inventario y la cuenta corriente se ajustaron correctamente."}


@router.patch("/{order_uuid}", response_model=schemas.OrderResponse)
def update_order_details(
    order_uuid: UUID,
    update_data: schemas.OrderUpdate,
    db: Session = Depends(get_db),
    admin_user = Depends(get_current_admin_user)
):
    order = db.query(models.Order).filter(models.Order.order_uuid == order_uuid).first()
    if not order:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")

    update_dict = update_data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(order, key, value)

    order.updated_by = admin_user.staff_id

    db.commit()
    db.refresh(order)
    return order