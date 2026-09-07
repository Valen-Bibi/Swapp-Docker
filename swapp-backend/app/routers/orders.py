from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List
from uuid import UUID
from datetime import datetime, timezone

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
        new_order = models.Order(
            customer_name=order_data.customer_name,
            customer_phone=order_data.customer_phone,
            customer_email=order_data.customer_email,
            delivery_address=order_data.delivery_address,
            delivery_zone=order_data.delivery_zone,
            scheduled_delivery_date=order_data.scheduled_delivery_date,
            logistics_notes=order_data.logistics_notes,
            total_amount=order_data.total_amount,
            status="pending",
            created_by=admin_user.staff_id
        )
        db.add(new_order)
        db.flush() # Flush nos da el new_order.order_id sin cerrar la transacción

        for item in order_data.items:
            product = db.query(models.Product).filter(models.Product.product_id == item.product_id).first()
            if not product:
                raise HTTPException(status_code=400, detail=f"El producto con ID {item.product_id} no existe.")

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
                discount_id=item.discount_id,
                campaign_name=item.campaign_name,
                discount_amount=item.discount_amount
            )
            db.add(new_item)

            if item.variant_id:
                # 1. Buscamos la variante y BLOQUEAMOS LA FILA hasta que termine la transacción
                variant = db.query(models.ProductVariant).filter(
                    models.ProductVariant.variant_id == item.variant_id
                ).with_for_update().first()

                if not variant:
                    raise HTTPException(status_code=400, detail=f"La variante con ID {item.variant_id} no existe.")

                # 2. Calculamos los valores de stock
                stock_before = variant.stock_quantity
                stock_after = stock_before - item.quantity

                # 3. Aplicamos el descuento FÍSICO al stock real
                variant.stock_quantity = stock_after

                # 4. Registramos el movimiento con el historial perfecto
                sale_movement = models.InventoryMovement(
                    product_id=item.product_id,
                    variant_id=item.variant_id,
                    movement_type='sale',
                    quantity=-(item.quantity),
                    stock_before=stock_before,       # <--- DATO SOLUCIONADO
                    stock_after=stock_after,         # <--- DATO SOLUCIONADO
                    reference_id=new_order.order_id,
                    reference_type='order',
                    reason=f"Venta reservada en pedido {new_order.order_uuid}",
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

    query = db.query(models.Order).options(joinedload(models.Order.items))
    
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
              .options(joinedload(models.Order.items))\
              .filter(models.Order.order_uuid == order_uuid)\
              .first()
              
    if not order:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
        
    return order


@router.patch("/{order_uuid}/status")
def update_order_status(
    order_uuid: UUID,
    new_status: str,
    db: Session = Depends(get_db),
    admin_user = Depends(get_current_admin_user)
):
    order = db.query(models.Order).options(joinedload(models.Order.items)).filter(models.Order.order_uuid == order_uuid).first()
    if not order:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
        
    old_status = order.status
    order.status = new_status

    # Lógica de devolución de stock por Cancelación
    if new_status == 'cancelled' and old_status != 'cancelled':
        for item in order.items:
            if item.variant_id:
                # 1. Buscamos la variante con bloqueo
                variant = db.query(models.ProductVariant).filter(
                    models.ProductVariant.variant_id == item.variant_id
                ).with_for_update().first()

                if variant:
                    # 2. Calculamos devolviendo el stock
                    stock_before = variant.stock_quantity
                    stock_after = stock_before + item.quantity

                    # 3. Restauramos el stock físico
                    variant.stock_quantity = stock_after

                    # 4. Registramos el historial de la devolución
                    return_movement = models.InventoryMovement(
                        product_id=item.product_id,
                        variant_id=item.variant_id,
                        movement_type='return',
                        quantity=item.quantity, # Cantidad en positivo porque es un ingreso
                        stock_before=stock_before,
                        stock_after=stock_after,
                        reference_id=order.order_id,
                        reference_type='order_cancellation',
                        reason=f"Reintegro por cancelación de pedido {order.order_uuid}",
                        created_by=admin_user.staff_id
                    )
                    db.add(return_movement)

    db.commit()
    return {"message": f"Estado actualizado a {new_status}. El inventario se ajustó automáticamente si fue necesario."}

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
        
    # Actualizamos solo los campos que vengan en el payload
    update_dict = update_data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(order, key, value)

    db.commit()
    db.refresh(order)
    return order