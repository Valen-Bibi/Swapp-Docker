from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from datetime import datetime, timezone
from decimal import Decimal
from .. import models, schemas
from ..database import get_db
from ..auth import get_current_admin_user

router = APIRouter(prefix="/api/products/admin", tags=["Admin Products"])

@router.get("/taxes", response_model=List[schemas.TaxClassResponse])
def get_tax_classes(db: Session = Depends(get_db), admin_user = Depends(get_current_admin_user)):
    return db.query(models.TaxClass).filter(models.TaxClass.is_active == True).all()

@router.get("/{product_uuid}/price-history", response_model=List[schemas.PriceHistoryResponse])
def get_price_history(
    product_uuid: UUID, 
    db: Session = Depends(get_db),
    admin_user = Depends(get_current_admin_user)
):

    product = db.query(models.Product).filter(models.Product.product_uuid == product_uuid).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado")
        
    history = db.query(models.ProductPriceHistory)\
                .filter(models.ProductPriceHistory.product_id == product.product_id)\
                .order_by(models.ProductPriceHistory.changed_at.desc())\
                .all()
    return history

# --- MOTOR DE DESCUENTOS ---
@router.post("/discounts", status_code=status.HTTP_201_CREATED)
def create_product_discount(
    discount_data: schemas.ProductDiscountCreate, 
    db: Session = Depends(get_db),
    admin_user = Depends(get_current_admin_user)
):
    # 1. Buscamos el producto mediante el UUID proporcionado
    product = db.query(models.Product).filter(models.Product.product_uuid == discount_data.product_uuid).first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
        
    precio_base = Decimal(str(product.base_price))
    valor_descuento = Decimal(str(discount_data.value))
    calculated_sale_price = Decimal('0')

    if discount_data.discount_type == 'percentage':
        multiplier = (Decimal('100') - valor_descuento) / Decimal('100')
        calculated_sale_price = round(precio_base * multiplier, 2)
    else:
        calculated_sale_price = precio_base - valor_descuento

    # 3. Guardamos el descuento incluyendo el nombre (Campaña)
    new_discount = models.ProductDiscount(
        product_id=product.product_id,
        name=discount_data.name,
        discount_type=discount_data.discount_type,
        value=discount_data.value,
        start_date=discount_data.start_date,
        end_date=discount_data.end_date,
        is_active=discount_data.is_active
    )
    db.add(new_discount)
    
    # 4. Historial
    history_record = models.ProductPriceHistory(
        product_id=product.product_id,
        old_value=precio_base, 
        new_value=calculated_sale_price,
        record_type="special_offer_price"
    )
    db.add(history_record)

    db.commit()
    return {"message": "Descuento creado exitosamente"}


@router.put("/discounts/{discount_id}")
def update_product_discount(
    discount_id: int,
    discount_data: schemas.ProductDiscountUpdate,
    db: Session = Depends(get_db),
    admin_user = Depends(get_current_admin_user)
):
    discount = db.query(models.ProductDiscount).filter(models.ProductDiscount.discount_id == discount_id).first()
    if not discount:
        raise HTTPException(status_code=404, detail="Oferta no encontrada")

    update_data = discount_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(discount, key, value)

    db.commit()
    return {"message": "Oferta actualizada correctamente"}


@router.get("/discounts", response_model=List[schemas.DiscountResponse])
def get_active_discounts(db: Session = Depends(get_db), admin_user = Depends(get_current_admin_user)):
    """
    Obtiene solo los descuentos vigentes o programados para el futuro (fecha de fin >= ahora).
    """
    now = datetime.now(timezone.utc)
    discounts = db.query(models.ProductDiscount).join(models.Product).filter(
        models.ProductDiscount.end_date >= now
    ).all()
    
    result = []
    for d in discounts:
        result.append({
            "discount_id": d.discount_id,
            "product_id": d.product_id,
            "product_uuid": d.product.product_uuid,
            "product_name": d.product.name,
            "name": d.name,
            "discount_type": d.discount_type,
            "value": float(d.value),
            "start_date": d.start_date,
            "end_date": d.end_date,
            "is_active": d.is_active
        })
    return result

@router.get("/discounts/history", response_model=List[schemas.DiscountResponse])
def get_historical_discounts(db: Session = Depends(get_db), admin_user = Depends(get_current_admin_user)):
    """
    Obtiene el historial de descuentos vencidos (fecha de fin < ahora).
    """
    now = datetime.now(timezone.utc)
    discounts = db.query(models.ProductDiscount).join(models.Product).filter(
        models.ProductDiscount.end_date < now
    ).all()
    
    result = []
    for d in discounts:
        result.append({
            "discount_id": d.discount_id,
            "product_id": d.product_id,
            "product_uuid": d.product.product_uuid,
            "product_name": d.product.name,
            "name": d.name,
            "discount_type": d.discount_type,
            "value": float(d.value),
            "start_date": d.start_date,
            "end_date": d.end_date,
            "is_active": d.is_active
        })
    return result

@router.get("", response_model=List[schemas.ProductoCatalogoResponse], status_code=status.HTTP_200_OK)
def get_all_products_admin(
    db: Session = Depends(get_db),
    admin_user = Depends(get_current_admin_user)
):
    """
    Retorna TODOS los productos (publicados y borradores) para el Panel Administrativo.
    Calcula el precio dinámico de oferta para mostrarlo en las tablas.
    """
    products = db.query(models.Product).order_by(models.Product.name).all()
    now = datetime.now(timezone.utc)
    
    result = []
    for p in products:
        p_data = p.__dict__.copy()
        
        # Limpiamos la metadata interna de SQLAlchemy
        p_data.pop("_sa_instance_state", None) 
        
        p_data['sale_price'] = None
        
        active_discounts = [d for d in p.discounts if d.start_date <= now <= d.end_date]
        if active_discounts:
            d = active_discounts[0]
            if d.discount_type == 'percentage':
                multiplier = (Decimal('100') - d.value) / Decimal('100')
                p_data['sale_price'] = float(round(p.base_price * multiplier, 2))
            elif d.discount_type == 'fixed':
                p_data['sale_price'] = float(p.base_price - d.value)
                
        result.append(p_data)
        
    return result

# --- CATEGORÍAS Y MARCAS ---
@router.get("/categories", response_model=List[schemas.CategoriaResponse])
def get_categories(db: Session = Depends(get_db)):
    """
    Obtiene todas las categorías activas ordenadas por su display_order.
    """
    categories = db.query(models.ProductCategory)\
                   .filter(models.ProductCategory.is_active == True)\
                   .order_by(models.ProductCategory.display_order)\
                   .all()
    return categories

@router.get("/brands", response_model=List[schemas.BrandResponse])
def get_brands(db: Session = Depends(get_db)):
    brands = db.query(models.Brand)\
               .filter(models.Brand.is_active == True)\
               .order_by(models.Brand.name)\
               .all()
    return brands

# --- ACTUALIZACIÓN DE PRODUCTOS ---
@router.put("/{product_uuid}")
def update_product_admin(
    product_uuid: UUID,
    product_update: schemas.ProductUpdateSchema,
    db: Session = Depends(get_db),
    admin_user = Depends(get_current_admin_user)
):
    product = db.query(models.Product).filter(models.Product.product_uuid == product_uuid).first()
    
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado")
    
    update_data = product_update.model_dump(exclude_unset=True)

    if 'slug' in update_data and update_data['slug'] is not None:
        existing_slug = db.query(models.Product).filter(
            models.Product.slug == update_data['slug'], 
            models.Product.product_uuid != product_uuid
        ).first()
        if existing_slug:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="La URL amigable (slug) ya está en uso.")

    if 'sku' in update_data and update_data['sku'] is not None:
        existing_sku = db.query(models.Product).filter(
            models.Product.sku == update_data['sku'], 
            models.Product.product_uuid != product_uuid
        ).first()
        if existing_sku:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El SKU ya está en uso por otro producto.")

    for key, value in update_data.items():
        setattr(product, key, value)
    
    db.commit()
    db.refresh(product)
    
    return {"message": "Producto actualizado correctamente", "product_uuid": str(product.product_uuid)}

# --- MOVIMIENTOS DE INVENTARIO ---
@router.post("/{product_uuid}/movements", status_code=status.HTTP_201_CREATED)
def create_product_movement(
    product_uuid: UUID,
    movement: schemas.ProductMovementCreate,
    db: Session = Depends(get_db),
    admin_user = Depends(get_current_admin_user)
):
    """
    Registra un movimiento en la tabla 'inventory_movements'.
    Actualiza el costo del producto si es una compra.
    """
    product = db.query(models.Product).filter(models.Product.product_uuid == product_uuid).first()
    
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado")

    # 1. Registramos el movimiento 
    new_movement = models.InventoryMovement(
        product_id=product.product_id,
        movement_type=movement.movement_type,
        quantity=movement.quantity,
        unit_cost=movement.unit_cost,
        reason=movement.reason,
        notes=movement.notes,
        created_by=admin_user.staff_id 
    )
    db.add(new_movement)

    # 2. LA MAGIA: Si es una compra y el costo es distinto, actualizamos el catálogo maestro
    if movement.movement_type == 'purchase' and movement.unit_cost is not None and movement.unit_cost > 0:
        product.cost_price = movement.unit_cost 
        # Al asignar este nuevo valor, SQLAlchemy ejecutará un UPDATE en swapp.products

    db.commit() 
    
    return {"message": "Movimiento de inventario registrado y costos actualizados con éxito"}

# --- CREACIÓN DE PRODUCTOS ---
@router.post("", status_code=status.HTTP_201_CREATED)
def create_product_admin(
    product_in: schemas.ProductCreateSchema,
    db: Session = Depends(get_db),
    admin_user = Depends(get_current_admin_user)
):
    """
    Crea un producto nuevo en el catálogo maestro (esquema swapp).
    Valida unicidad de SKU y Slug antes de persistir.
    """
    if product_in.sku:
        existing_sku = db.query(models.Product).filter(models.Product.sku == product_in.sku).first()
        if existing_sku:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail=f"Operación rechazada: Ya existe un producto con el SKU '{product_in.sku}'."
            )

    existing_slug = db.query(models.Product).filter(models.Product.slug == product_in.slug).first()
    if existing_slug:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Operación rechazada: La URL amigable (slug) ya está en uso por otro producto."
        )

    new_product = models.Product(
        name=product_in.name,
        slug=product_in.slug,
        sku=product_in.sku,
        short_description=product_in.short_description,
        description=product_in.description,
        base_price=product_in.base_price,
        cost_price=product_in.cost_price, 
        stock_quantity=product_in.stock_quantity,
        is_returnable=product_in.is_returnable,
        is_published=product_in.is_published,
        is_featured=product_in.is_featured,
        brand_id=product_in.brand_id,
        tax_class_id=product_in.tax_class_id, 
        sold_count=0 
    )

    try:
        db.add(new_product)
        db.commit()
        db.refresh(new_product)
        return {"message": "Producto creado con éxito", "product_uuid": str(new_product.product_uuid)}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Fallo crítico en la persistencia de base de datos: {str(e)}"
        )