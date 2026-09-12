from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID

from .. import models
from ..database import get_db
from ..auth import get_current_admin_user

# Importamos nuestro nuevo esquema aislado
from ..schemas.payments import PaymentCreate, PaymentResponse

router = APIRouter(prefix="/api/payments/admin", tags=["Admin Payments"])

@router.post("/order/{order_uuid}", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
def create_payment(
    order_uuid: UUID,
    payment_data: PaymentCreate,
    db: Session = Depends(get_db),
    admin_user = Depends(get_current_admin_user)
):
    # 1. Verificamos a qué pedido pertenece este pago
    order = db.query(models.Order).filter(models.Order.order_uuid == order_uuid).first()
    if not order:
        raise HTTPException(status_code=404, detail="El pedido especificado no existe.")

    # 2. Registramos el ingreso de dinero
    new_payment = models.Payment(
        order_id=order.order_id,
        payment_method=payment_data.payment_method,
        amount=payment_data.amount,
        transaction_reference=payment_data.transaction_reference,
        payment_status=payment_data.payment_status,
        created_by=admin_user.staff_id
    )
    
    db.add(new_payment)
    db.commit()
    db.refresh(new_payment)
    
    return new_payment

@router.delete("/{payment_uuid}")
def void_payment(
    payment_uuid: UUID,
    db: Session = Depends(get_db),
    admin_user = Depends(get_current_admin_user)
):
    payment = db.query(models.Payment).filter(models.Payment.payment_uuid == payment_uuid).first()
    if not payment:
        raise HTTPException(status_code=404, detail="El pago no existe.")
        
    # Anulación lógica (Soft Delete) para mantener el rastro de auditoría
    payment.payment_status = 'voided'
    db.commit()
    
    return {"message": "El pago ha sido anulado correctamente."}