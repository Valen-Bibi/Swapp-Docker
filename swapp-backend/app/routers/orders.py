from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List
from uuid import UUID

from .. import models, schemas
from ..database import get_db
from ..auth import get_current_admin_user

router = APIRouter(prefix="/api/orders/admin", tags=["Admin Orders"])

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

        new_order = models.Order(
            client_id=order_data.client_id,
            delivery_address=order_data.delivery_address,
            delivery_zone=order_data.delivery_zone,
            scheduled_delivery_date=order_data.scheduled_delivery_date,
            logistics_notes=order_data.logistics_notes,
            total_amount=order_data.total_amount,
            status="pending",
            created_by=admin_user.staff_id
        )
        db.add(new_order)
        db.flush() 

        # Registro Inicial en la Bitácora
        history = models.OrderStatusHistory(
            order_id=new_order.order_id,
            old_status="created",
            new_status="pending",
            changed_by=admin_user.staff_id
        )
        db.add(history)

        for item in order_data.items:
            product = db.query(models.Product).filter(models.Product.product_id == item.product_id).first()
            if not product:
                raise HTTPException(status_code=400, detail=f"El producto principal con ID {item.product_id} no existe.")

            # Resolución Automática de la Variante Interna
            internal_var_id = None
            if item.internal_product_id:
                int_prod = db.query(models.Product).options(joinedload(models.Product.variants)).filter(
                    models.Product.product_id == item.internal_product_id
                ).first()
                if int_prod and int_prod.variants:
                    internal_var_id = int_prod.variants[0].variant_id # Regla 1: Única variante activa

            new_item = models.OrderItem(
                order_id=new_order.order_id,
                product_id=item.product_id,
                variant_id=item.variant_id,
                unit_price=item.unit_price,
                quantity=item.quantity,
                subtotal=item.subtotal,
                requires_return=item.requires_return,
                expected_return_qty=item.expected_return_qty,
                actual_return_qty=0,
                internal_product_id=item.internal_product_id, # Trazabilidad
                internal_variant_id=internal_var_id,          # Trazabilidad
                discount_id=item.discount_id,
                campaign_name=item.campaign_name,
                discount_amount=item.discount_amount
            )
            db.add(new_item)

            # --- RESERVA DURA (Opción A) ---
            if item.variant_id:
                variant = db.query(models.ProductVariant).filter(
                    models.ProductVariant.variant_id == item.variant_id
                ).with_for_update().first()

                if not variant:
                    raise HTTPException(status_code=400, detail=f"La variante con ID {item.variant_id} no existe.")

                stock_before = variant.stock_quantity
                stock_after = stock_before - item.quantity
                variant.stock_quantity = stock_after # Descuento inmediato

                sale_movement = models.InventoryMovement(
                    product_id=item.product_id,
                    variant_id=item.variant_id,
                    movement_type='sale',
                    quantity=-(item.quantity),
                    stock_before=stock_before,
                    stock_after=stock_after,
                    reference_id=new_order.order_id,
                    reference_type='order',
                    reason=f"Venta descontada en pedido {new_order.order_uuid}",
                    created_by=admin_user.staff_id
                )
                db.add(sale_movement)

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
        joinedload(models.Order.client)
    )
    
    if status_filter:
        query = query.filter(models.Order.status == status_filter)
    if zone_filter:
        query = query.filter(models.Order.delivery_zone == zone_filter)
        
    orders = query.order_by(models.Order.created_at.desc()).all()
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
                  joinedload(models.Order.client)
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

    history = models.OrderStatusHistory(
        order_id=order.order_id,
        old_status=old_status,
        new_status=new_status,
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
        actual_returns = payload.actual_returns or {}

        for item in order.items:
            returned_qty = actual_returns.get(item.item_id, 0)
            item.actual_return_qty = returned_qty

            # Solo procesamos la logística inversa si hay un Producto Interno enlazado
            if item.internal_product_id and item.internal_variant_id:
                
                # A. ABSORCIÓN: Chequeamos el saldo de envases VACÍOS del cliente
                current_balance = db.query(func.sum(models.ClientContainerLedger.quantity_change)).filter(
                    models.ClientContainerLedger.client_id == order.client_id,
                    models.ClientContainerLedger.product_id == item.internal_product_id
                ).scalar() or 0

                if returned_qty > current_balance:
                    absorbed_qty = returned_qty - current_balance
                    absorption_ledger = models.ClientContainerLedger(
                        client_id=order.client_id,
                        product_id=item.internal_product_id, # Apunta al Vacío
                        order_id=order.order_id,
                        transaction_type='absorption', 
                        quantity_change=absorbed_qty,  
                        staff_id=admin_user.staff_id,
                        notes=f"Absorción automática de envases externos ({absorbed_qty} un.)"
                    )
                    db.add(absorption_ledger)

                # B. ENTREGA: Al darle un lleno, el cliente ahora nos debe un VACÍO (+ quantity_change)
                ledger_delivery = models.ClientContainerLedger(
                    client_id=order.client_id,
                    product_id=item.internal_product_id, # Apunta al Vacío
                    order_id=order.order_id,
                    transaction_type='delivery',
                    quantity_change=item.quantity, 
                    staff_id=admin_user.staff_id,
                    notes="Deuda generada por entrega de envases llenos"
                )
                db.add(ledger_delivery)

                # C. RETORNO Y GALPÓN: Si devuelve vacíos...
                if returned_qty > 0:
                    # Cancelamos su deuda (- quantity_change)
                    ledger_return = models.ClientContainerLedger(
                        client_id=order.client_id,
                        product_id=item.internal_product_id, # Apunta al Vacío
                        order_id=order.order_id,
                        transaction_type='return',
                        quantity_change=-returned_qty, 
                        staff_id=admin_user.staff_id,
                        notes="Descargo por devolución de envases vacíos"
                    )
                    db.add(ledger_return)

                    # INGRESO AL GALPÓN: Sumamos stock físico a la variante del Producto Interno (El Vacío)
                    internal_variant = db.query(models.ProductVariant).filter(
                        models.ProductVariant.variant_id == item.internal_variant_id
                    ).with_for_update().first()

                    if internal_variant:
                        stock_before = internal_variant.stock_quantity
                        stock_after = stock_before + returned_qty
                        internal_variant.stock_quantity = stock_after

                        empty_container_movement = models.InventoryMovement(
                            product_id=item.internal_product_id,
                            variant_id=item.internal_variant_id,
                            movement_type='return',
                            quantity=returned_qty,
                            stock_before=stock_before,
                            stock_after=stock_after,
                            reference_id=order.order_id,
                            reference_type='empty_container_return',
                            reason=f"Ingreso de envases vacíos (Pedido {order.order_uuid})",
                            created_by=admin_user.staff_id
                        )
                        db.add(empty_container_movement)

    db.commit()
    return {"message": f"Estado actualizado a {new_status}. El inventario y los envases se ajustaron automáticamente."}

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

    db.commit()
    db.refresh(order)
    return order