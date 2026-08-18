from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile
from sqlalchemy.orm import Session, joinedload
from typing import List
from uuid import UUID
from datetime import datetime, timezone
from decimal import Decimal
from .. import models, schemas
from ..database import get_db
from ..auth import get_current_admin_user
from ..services.obs_service import process_and_upload_image

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
    # Usamos joinedload para traer los descuentos y la media en la misma consulta a la DB
    products = db.query(models.Product)\
                 .options(joinedload(models.Product.discounts), joinedload(models.Product.media))\
                 .order_by(models.Product.name)\
                 .all()
    now = datetime.now(timezone.utc)
    
    result = []
    result = []
    for p in products:
        prod_schema = schemas.ProductoCatalogoResponse.model_validate(p)
        prod_schema.media = [m for m in p.media if m.is_active] 
        active_discounts = [d for d in p.discounts if d.start_date <= now <= d.end_date]
        if active_discounts:
            d = active_discounts[0]
            if d.discount_type == 'percentage':
                multiplier = (Decimal('100') - d.value) / Decimal('100')
                prod_schema.sale_price = float(round(p.base_price * multiplier, 2))
            elif d.discount_type == 'fixed':
                prod_schema.sale_price = float(p.base_price - d.value)
                
        result.append(prod_schema)
        
    return result

# --- CATEGORÍAS Y MARCAS ---
@router.get("/categories", response_model=List[schemas.CategoriaResponse])
def get_categories(db: Session = Depends(get_db)):
    categories = db.query(models.ProductCategory)\
                   .filter(models.ProductCategory.is_active == True)\
                   .order_by(models.ProductCategory.display_order)\
                   .all()
    return categories

@router.get("/brands", response_model=List[schemas.BrandResponse])
def get_brands(db: Session = Depends(get_db)):
    brands = db.query(models.Brand)\
               .filter(models.Brand.is_active == True)\
               .order_by(models.Brand.display_order)\
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

    if movement.movement_type == 'purchase' and movement.unit_cost is not None and movement.unit_cost > 0:
        product.cost_price = movement.unit_cost 

    db.commit() 
    
    return {"message": "Movimiento de inventario registrado y costos actualizados con éxito"}

# --- CREACIÓN DE PRODUCTOS ---
@router.post("", status_code=status.HTTP_201_CREATED)
def create_product_admin(
    product_in: schemas.ProductCreateSchema,
    db: Session = Depends(get_db),
    admin_user = Depends(get_current_admin_user)
):
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


@router.post("/brands", status_code=status.HTTP_201_CREATED)
def create_brand(
    brand_in: schemas.BrandCreate,
    db: Session = Depends(get_db),
    admin_user = Depends(get_current_admin_user)
):
    if db.query(models.Brand).filter(models.Brand.name == brand_in.name).first():
        raise HTTPException(status_code=400, detail="Ya existe una marca con este nombre.")
    if db.query(models.Brand).filter(models.Brand.slug == brand_in.slug).first():
        raise HTTPException(status_code=400, detail="El slug ya está en uso.")
        
    new_brand = models.Brand(
        name=brand_in.name,
        slug=brand_in.slug,
        logo_url=brand_in.logo_url,
        display_order=brand_in.display_order,
        is_active=brand_in.is_active,
        featured=brand_in.featured
    )
    db.add(new_brand)
    db.commit()
    return {"message": "Marca creada exitosamente"}

@router.put("/brands/{brand_id}")
def update_brand(
    brand_id: int,
    brand_in: schemas.BrandUpdate,
    db: Session = Depends(get_db),
    admin_user = Depends(get_current_admin_user)
):
    brand = db.query(models.Brand).filter(models.Brand.brand_id == brand_id).first()
    if not brand:
        raise HTTPException(status_code=404, detail="Marca no encontrada.")
        
    update_data = brand_in.model_dump(exclude_unset=True)
    
    if 'name' in update_data and update_data['name'] != brand.name:
        if db.query(models.Brand).filter(models.Brand.name == update_data['name']).first():
            raise HTTPException(status_code=400, detail="El nombre de marca ya existe.")
    if 'slug' in update_data and update_data['slug'] != brand.slug:
        if db.query(models.Brand).filter(models.Brand.slug == update_data['slug']).first():
            raise HTTPException(status_code=400, detail="El slug ya está en uso.")

    for key, value in update_data.items():
        setattr(brand, key, value)
        
    db.commit()
    return {"message": "Marca actualizada correctamente"}


@router.post("/categories", status_code=status.HTTP_201_CREATED)
def create_category(
    cat_in: schemas.CategoryCreate,
    db: Session = Depends(get_db),
    admin_user = Depends(get_current_admin_user)
):
    if db.query(models.ProductCategory).filter(models.ProductCategory.slug == cat_in.slug).first():
        raise HTTPException(status_code=400, detail="El slug ya está en uso por otra categoría.")
        
    new_category = models.ProductCategory(
        name=cat_in.name,
        slug=cat_in.slug,
        parent_id=cat_in.parent_id,
        image_url=cat_in.image_url,
        display_order=cat_in.display_order,
        is_active=cat_in.is_active
    )
    db.add(new_category)
    db.commit()
    return {"message": "Categoría creada exitosamente"}

@router.put("/categories/{category_id}")
def update_category(
    category_id: int,
    cat_in: schemas.CategoryUpdate,
    db: Session = Depends(get_db),
    admin_user = Depends(get_current_admin_user)
):
    category = db.query(models.ProductCategory).filter(models.ProductCategory.category_id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Categoría no encontrada.")
        
    update_data = cat_in.model_dump(exclude_unset=True)
    
    if 'slug' in update_data and update_data['slug'] != category.slug:
        if db.query(models.ProductCategory).filter(models.ProductCategory.slug == update_data['slug']).first():
            raise HTTPException(status_code=400, detail="El slug ya está en uso.")
            
    if 'parent_id' in update_data and update_data['parent_id'] == category_id:
        raise HTTPException(status_code=400, detail="Una categoría no puede ser su propia categoría padre.")

    for key, value in update_data.items():
        setattr(category, key, value)
        
    db.commit()
    return {"message": "Categoría actualizada correctamente"}

# --- GESTOR MULTIMEDIA REFACTORIZADO ---
@router.post("/{product_uuid}/main-image")
async def upload_main_image(
    product_uuid: UUID,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    admin_user = Depends(get_current_admin_user)
):
    product = db.query(models.Product).filter(models.Product.product_uuid == product_uuid).first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
        
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="El archivo debe ser una imagen válida.")

    folder_prefix = f"products/{product.slug}"
    
    image_url = await process_and_upload_image(file, prefix=folder_prefix)
    
    main_image = db.query(models.ProductMedia).filter(
        models.ProductMedia.product_id == product.product_id,
        models.ProductMedia.media_type == 'image',
        models.ProductMedia.media_subtype == 'main'
    ).first()

    if main_image:
        main_image.file_url = image_url
        main_image.is_active = True
        if file.size:
            main_image.file_size = file.size
        main_image.mime_type = "image/webp"
    else:
        new_media = models.ProductMedia(
            product_id=product.product_id,
            media_type='image',
            media_subtype='main',
            file_url=image_url,
            display_order=0,
            is_active=True,
            file_size=file.size if file.size else None,
            mime_type="image/webp"
        )
        db.add(new_media)
    
    product.updated_by = admin_user.staff_id
    db.commit()
    
    return {"message": "Imagen subida y enlazada exitosamente", "url": image_url}


@router.post("/{product_uuid}/gallery-images")
async def upload_gallery_images(
    product_uuid: UUID,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    admin_user = Depends(get_current_admin_user)
):
    product = db.query(models.Product).filter(models.Product.product_uuid == product_uuid).first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    folder_prefix = f"products/{product.slug}/gallery"
    
    current_gallery_count = db.query(models.ProductMedia).filter(
        models.ProductMedia.product_id == product.product_id,
        models.ProductMedia.media_type == 'image',
        models.ProductMedia.media_subtype == 'gallery'
    ).count()
    
    next_order = current_gallery_count + 1
    uploaded_urls = []

    for file in files:
        if not file.content_type.startswith("image/"):
            continue
            
        # Procesar y subir al bucket
        image_url = await process_and_upload_image(file, prefix=folder_prefix)

        new_media = models.ProductMedia(
            product_id=product.product_id,
            media_type='image',
            media_subtype='gallery',
            file_url=image_url,
            display_order=next_order,
            is_active=True,
            file_size=file.size if file.size else None,
            mime_type="image/webp"
        )
        db.add(new_media)
        uploaded_urls.append(image_url)
        next_order += 1

    product.updated_by = admin_user.staff_id
    db.commit()

    return {
        "message": f"{len(uploaded_urls)} imágenes de galería subidas exitosamente",
        "urls": uploaded_urls
    }

@router.delete("/{product_uuid}/media/{media_uuid}")
def delete_product_media(
    product_uuid: UUID,
    media_uuid: UUID,
    db: Session = Depends(get_db),
    admin_user = Depends(get_current_admin_user)
):
    product = db.query(models.Product).filter(models.Product.product_uuid == product_uuid).first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
        
    media_record = db.query(models.ProductMedia).filter(
        models.ProductMedia.media_uuid == media_uuid,
        models.ProductMedia.product_id == product.product_id
    ).first()
    
    if not media_record:
        raise HTTPException(status_code=404, detail="Imagen no encontrada")
        
    if not media_record.is_active:
        return {"message": "La imagen ya se encontraba eliminada (inactiva)"}

    media_record.is_active = False
    
    product.updated_by = admin_user.staff_id 
    
    db.commit()
    
    return {"message": "Imagen eliminada correctamente del catálogo"}