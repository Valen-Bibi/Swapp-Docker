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

# --- IMPUESTOS ---
@router.get("/taxes", response_model=List[schemas.TaxClassResponse])
def get_tax_classes(db: Session = Depends(get_db)):
    """
    Obtiene todas las clases de impuestos activas.
    """
    return db.query(models.TaxClass).filter(models.TaxClass.is_active == True).all()

# --- HISTORIAL DE PRECIOS ---
@router.get("/{product_uuid}/price-history", response_model=List[schemas.PriceHistoryResponse])
def get_price_history(
    product_uuid: UUID, 
    db: Session = Depends(get_db),
    admin_user = Depends(get_current_admin_user)
):
    """
    Obtiene el historial de cambios de precio base de un producto. 
    (Solo lectura, la BD inserta automáticamente vía Trigger).
    """
    product = db.query(models.Product).filter(models.Product.product_uuid == product_uuid).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado")
        
    history = db.query(models.ProductPriceHistory)\
                .filter(models.ProductPriceHistory.product_id == product.product_id)\
                .order_by(models.ProductPriceHistory.changed_at.desc())\
                .all()
    return history

# --- MOTOR DE DESCUENTOS ---
@router.post("/{product_uuid}/discounts", response_model=schemas.DiscountResponse, status_code=status.HTTP_201_CREATED)
def create_product_discount(
    product_uuid: UUID,
    discount: schemas.DiscountCreate,
    db: Session = Depends(get_db),
    admin_user = Depends(get_current_admin_user)
):
    """
    Crea una promoción temporal para el producto.
    """
    product = db.query(models.Product).filter(models.Product.product_uuid == product_uuid).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado")
        
    new_discount = models.ProductDiscount(
        product_id=product.product_id,
        discount_type=discount.discount_type,
        value=discount.value,
        start_date=discount.start_date,
        end_date=discount.end_date
    )
    
    try:
        db.add(new_discount)
        db.commit()
        db.refresh(new_discount)
        return new_discount
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Error al crear el descuento (verifique que end_date > start_date).")

@router.get("/catalog", response_model=List[schemas.ProductoCatalogoResponse])
def get_catalog_products(db: Session = Depends(get_db)):
    """
    Obtiene todos los productos publicados. Calcula el sale_price al vuelo si hay descuentos.
    """
    products = db.query(models.Product).filter(models.Product.is_published == True).all()
    now = datetime.now(timezone.utc)
    
    result = []
    for p in products:
        p_data = p.__dict__.copy()
        
        # Limpiamos la metadata interna de SQLAlchemy para evitar el colapso de serialización JSON
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
    El trigger BEFORE INSERT en BD completará stock_before, stock_after y actualizará el maestro.
    """
    product = db.query(models.Product).filter(models.Product.product_uuid == product_uuid).first()
    
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado")

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
    db.commit() 
    
    return {"message": "Movimiento de inventario registrado con éxito"}

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