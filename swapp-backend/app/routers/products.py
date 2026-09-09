from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List
from uuid import UUID
from datetime import datetime, timezone
from decimal import Decimal
from .. import models, schemas
from ..database import get_db
from ..auth import get_current_admin_user
from ..services.obs_service import process_and_upload_image
from ..models.products import ProductVariant

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
    product = db.query(models.Product).options(joinedload(models.Product.variants)).filter(models.Product.product_uuid == discount_data.product_uuid).first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
        
    if not product.variants:
        raise HTTPException(status_code=400, detail="El producto no tiene variantes asignadas para descontar")
    # 1. Analizamos el alcance (Scope) de la oferta
    target_variants = []
    target_variant_ids = None

    if discount_data.variant_uuids and len(discount_data.variant_uuids) > 0:
        # Modo Específico: Filtramos solo las variantes que el usuario seleccionó
        target_variants = [v for v in product.variants if v.variant_uuid in discount_data.variant_uuids]
        if not target_variants:
            raise HTTPException(status_code=400, detail="Ninguna de las variantes seleccionadas existe.")
        target_variant_ids = [v.variant_id for v in target_variants]
    else:
        # Modo Global: Aplica a todo el catálogo del producto
        target_variants = product.variants 

    # 2. Guardamos el descuento en la BD
    new_discount = models.ProductDiscount(
        product_id=product.product_id,
        variant_ids=target_variant_ids, # Acabamos de mapear esto
        name=discount_data.name,
        discount_type=discount_data.discount_type,
        value=discount_data.value,
        start_date=discount_data.start_date,
        end_date=discount_data.end_date,
        is_active=discount_data.is_active
    )
    db.add(new_discount)

    # 3. Guardamos el historial de precios SOLO para las variantes afectadas
    valor_descuento = Decimal(str(discount_data.value))
    
    for variant in target_variants:
        precio_base = Decimal(str(variant.price))
        calculated_sale_price = Decimal('0')

        if discount_data.discount_type == 'percentage':
            multiplier = (Decimal('100') - valor_descuento) / Decimal('100')
            calculated_sale_price = round(precio_base * multiplier, 2)
        else:
            calculated_sale_price = precio_base - valor_descuento
            
        history_record = models.ProductPriceHistory(
            product_id=product.product_id,
            variant_id=variant.variant_id,
            old_value=precio_base, 
            new_value=calculated_sale_price,
            record_type="cost_price"
        )
        db.add(history_record)

    db.commit()
    return {"message": "Descuento aplicado exitosamente"}

@router.get("/discounts/history", response_model=List[schemas.DiscountResponse])
def get_historical_discounts(db: Session = Depends(get_db), admin_user = Depends(get_current_admin_user)):
    now = datetime.now(timezone.utc)
    # Traemos las ofertas vencidas o inactivas
    discounts = db.query(models.ProductDiscount)\
                  .options(joinedload(models.ProductDiscount.product).joinedload(models.Product.variants))\
                  .filter(
                      (models.ProductDiscount.end_date < now) | 
                      (models.ProductDiscount.is_active == False)
                  ).all()
    
    result = []
    for d in discounts:
        variant_uuids = []
        if d.variant_ids and d.product and d.product.variants:
            variant_uuids = [
                v.variant_uuid for v in d.product.variants if v.variant_id in d.variant_ids
            ]

        result.append({
            "discount_id": d.discount_id,
            "product_id": d.product_id,
            "product_uuid": d.product.product_uuid,
            "product_name": d.product.name,
            "variant_uuids": variant_uuids,
            "name": d.name,
            "discount_type": d.discount_type,
            "value": float(d.value),
            "start_date": d.start_date,
            "end_date": d.end_date,
            "is_active": d.is_active
        })
    return result

@router.patch("/discounts/{discount_id}/toggle")
def toggle_discount_status(
    discount_id: int,
    toggle_data: schemas.ProductDiscountToggle,
    db: Session = Depends(get_db),
    admin_user = Depends(get_current_admin_user)
):
    discount = db.query(models.ProductDiscount).filter(models.ProductDiscount.discount_id == discount_id).first()
    if not discount:
        raise HTTPException(status_code=404, detail="Oferta no encontrada")
    
    discount.is_active = toggle_data.is_active
    db.commit()
    return {"message": f"Oferta {'activada' if toggle_data.is_active else 'desactivada'}"}

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
    
    # Mapeo inverso de UUIDs a IDs numéricos para la BD
    if 'variant_uuids' in update_data:
        uuids = update_data.pop('variant_uuids')
        if uuids and len(uuids) > 0:
            variants = db.query(models.ProductVariant.variant_id)\
                         .filter(models.ProductVariant.variant_uuid.in_(uuids)).all()
            discount.variant_ids = [v[0] for v in variants]
        else:
            discount.variant_ids = None

    for key, value in update_data.items():
        setattr(discount, key, value)

    db.commit()
    return {"message": "Oferta actualizada correctamente"}

@router.get("/discounts", response_model=List[schemas.DiscountResponse])
def get_active_discounts(db: Session = Depends(get_db), admin_user = Depends(get_current_admin_user)):
    now = datetime.now(timezone.utc)
    discounts = db.query(models.ProductDiscount)\
                  .options(joinedload(models.ProductDiscount.product).joinedload(models.Product.variants))\
                  .filter(models.ProductDiscount.end_date >= now).all()
    
    result = []
    for d in discounts:
        variant_uuids = []
        if d.variant_ids and d.product and d.product.variants:
            variant_uuids = [
                v.variant_uuid for v in d.product.variants if v.variant_id in d.variant_ids
            ]

        result.append({
            "discount_id": d.discount_id,
            "product_id": d.product_id,
            "product_uuid": d.product.product_uuid,
            "product_name": d.product.name,
            "variant_uuids": variant_uuids, # <-- Exponemos el nuevo array
            "name": d.name,
            "discount_type": d.discount_type,
            "value": float(d.value),
            "start_date": d.start_date,
            "end_date": d.end_date,
            "is_active": d.is_active
        })
    return result

# --- CATÁLOGO PRINCIPAL ---
@router.get("", response_model=List[schemas.ProductCatalogResponse], status_code=status.HTTP_200_OK)
def get_all_products_admin(
    db: Session = Depends(get_db),
    admin_user = Depends(get_current_admin_user)
):
    # Agregamos joinedload(variants) para que traiga la información física
    products = db.query(models.Product)\
                 .options(
                     joinedload(models.Product.discounts), 
                     joinedload(models.Product.media),
                     joinedload(models.Product.variants)
                 )\
                 .order_by(models.Product.name)\
                 .all()
                 
    result = []
    for p in products:
        prod_schema = schemas.ProductCatalogResponse.model_validate(p)
        prod_schema.media = [m for m in p.media if m.is_active]
        result.append(prod_schema)
        
    return result

@router.get("/categories", response_model=List[schemas.CategoryResponse])
def get_categories(include_inactive: bool = False, db: Session = Depends(get_db)):
    """Obtiene el árbol de categorías, con opción de incluir las archivadas"""
    query = db.query(models.ProductCategory)
    
    # Si no nos piden las inactivas, filtramos solo las activas
    if not include_inactive:
        query = query.filter(models.ProductCategory.is_active == True)
        
    categories = query.order_by(models.ProductCategory.display_order).all()
    return categories

@router.get("/brands", response_model=List[schemas.BrandResponse])
def get_brands(db: Session = Depends(get_db)):
    """Obtiene todas las marcas activas del catálogo"""
    brands = db.query(models.Brand)\
               .filter(models.Brand.is_active == True)\
               .order_by(models.Brand.display_order)\
               .all()
    return brands

# --- ACTUALIZACIÓN DE PRODUCTOS (PLANTILLA) ---
@router.put("/{product_uuid}")
def update_product_admin(
    product_uuid: UUID,
    product_update: schemas.ProductUpdate,
    db: Session = Depends(get_db),
    admin_user = Depends(get_current_admin_user)
):
    product = db.query(models.Product).filter(models.Product.product_uuid == product_uuid).first()
    
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado")
    
    update_data = product_update.model_dump(exclude_unset=True)

    # --- NUEVA REGLA: BLINDAJE DE SUBCATEGORÍA AL EDITAR ---
    if 'category_id' in update_data and update_data['category_id'] is not None:
        category = db.query(models.ProductCategory).filter(models.ProductCategory.category_id == update_data['category_id']).first()
        if not category:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="La categoría seleccionada no existe.")
        if category.parent_id is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="Operación rechazada: Los productos solo pueden asociarse a subcategorías finales."
            )

    if 'slug' in update_data and update_data['slug'] is not None:
        existing_slug = db.query(models.Product).filter(
            models.Product.slug == update_data['slug'], 
            models.Product.product_uuid != product_uuid
        ).first()
        if existing_slug:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="La URL amigable (slug) ya está en uso.")

    for key, value in update_data.items():
        setattr(product, key, value)

    product.updated_by = admin_user.staff_id
    
    db.commit()
    db.refresh(product)
    
    return {"message": "Producto actualizado correctamente", "product_uuid": str(product.product_uuid)}

# --- ACTUALIZACIÓN DE VARIANTE (HIJO) ---
@router.put("/{product_uuid}/variants/{variant_uuid}")
def update_product_variant_admin(
    product_uuid: UUID,
    variant_uuid: UUID,
    variant_update: schemas.ProductVariantUpdate,
    db: Session = Depends(get_db),
    admin_user = Depends(get_current_admin_user)
):
    product = db.query(models.Product).filter(models.Product.product_uuid == product_uuid).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto padre no encontrado")

    variant = db.query(models.ProductVariant).filter(
        models.ProductVariant.variant_uuid == variant_uuid,
        models.ProductVariant.product_id == product.product_id
    ).first()
    
    if not variant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Variante física no encontrada")

    update_data = variant_update.model_dump(exclude_unset=True)

    if 'sku' in update_data and update_data['sku'] is not None and update_data['sku'] != variant.sku:
        existing_sku = db.query(models.ProductVariant).filter(models.ProductVariant.sku == update_data['sku']).first()
        if existing_sku:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="Operación rechazada: El SKU ya está en uso."
            )

    if 'price' in update_data and update_data['price'] != variant.price:
        hist_price = models.ProductPriceHistory(
            product_id=product.product_id,
            old_value=variant.price,
            new_value=update_data['price'],
            record_type="base_price"
        )
        db.add(hist_price)

    if 'cost_price' in update_data and update_data['cost_price'] != variant.cost_price:
        hist_cost = models.ProductPriceHistory(
            product_id=product.product_id,
            old_value=variant.cost_price,
            new_value=update_data['cost_price'],
            record_type="cost_price"
        )
        db.add(hist_cost)

    for key, value in update_data.items():
        setattr(variant, key, value)
    
    product.updated_by = admin_user.staff_id
    
    db.commit()
    
    return {"message": "Variante física e historial actualizados correctamente"}

@router.post("/{product_uuid}/variants/{variant_uuid}/movements", status_code=status.HTTP_201_CREATED)
def create_product_movement(
    product_uuid: UUID,
    variant_uuid: UUID,
    movement: schemas.ProductMovementCreate,
    db: Session = Depends(get_db),
    admin_user = Depends(get_current_admin_user)
):
    product = db.query(models.Product).filter(models.Product.product_uuid == product_uuid).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto padre no encontrado")

    variant = db.query(models.ProductVariant).filter(
        models.ProductVariant.variant_uuid == variant_uuid,
        models.ProductVariant.product_id == product.product_id
    ).first()
    if not variant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Variante física no encontrada")

    stock_before = variant.stock_quantity or 0
    stock_after = stock_before + movement.quantity

    new_movement = models.InventoryMovement(
        product_id=product.product_id,
        variant_id=variant.variant_id,
        movement_type=movement.movement_type,
        quantity=movement.quantity,
        unit_cost=movement.unit_cost,
        stock_before=stock_before,
        stock_after=stock_after,
        reason=movement.reason,
        notes=movement.notes,
        created_by=admin_user.staff_id 
    )
    db.add(new_movement)

    variant.stock_quantity = stock_after

    if movement.movement_type == 'purchase' and movement.unit_cost is not None and movement.unit_cost > 0:
        # Guardamos historial de costos
        hist_cost = models.ProductPriceHistory(
            product_id=product.product_id,
            variant_id=variant.variant_id,
            old_value=variant.cost_price, 
            new_value=movement.unit_cost,
            record_type="cost_price"
        )
        db.add(hist_cost)
        variant.cost_price = movement.unit_cost 

    db.commit() 
    return {"message": "Movimiento registrado y stock actualizado con éxito"}

# --- CREACIÓN DE MARCAS / CATEGORÍAS ---
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

@router.post("/categories/reorder")
def reorder_categories(
    payload: schemas.CategoryReorderRequest,
    db: Session = Depends(get_db),
    admin_user = Depends(get_current_admin_user)
):
    """Actualiza el display_order de múltiples categorías en una sola transacción"""
    try:
        for item in payload.categories:
            db.query(models.ProductCategory)\
              .filter(models.ProductCategory.category_id == item.category_id)\
              .update({"display_order": item.display_order})
        
        db.commit()
        return {"message": "Orden actualizado correctamente"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Error al reordenar las categorías.")

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

@router.post("", status_code=status.HTTP_201_CREATED)
def create_product_admin(
    product_in: schemas.ProductCreate,
    db: Session = Depends(get_db),
    admin_user = Depends(get_current_admin_user)
):
    existing_slug = db.query(models.Product).filter(models.Product.slug == product_in.slug).first()
    if existing_slug:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Operación rechazada: La URL amigable (slug) ya está en uso."
        )

    category = db.query(models.ProductCategory).filter(models.ProductCategory.category_id == product_in.category_id).first()
    if not category:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="La categoría seleccionada no existe.")
    
    if category.parent_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Operación rechazada: Los productos solo pueden asociarse a subcategorías finales, no a categorías generales o rubros."
        )

    try:
        new_product = models.Product(
            name=product_in.name,
            slug=product_in.slug,
            short_description=product_in.short_description,
            description=product_in.description,
            is_returnable=product_in.is_returnable,
            is_published=product_in.is_published,
            is_featured=product_in.is_featured,
            brand_id=product_in.brand_id,
            category_id=product_in.category_id,
            tax_class_id=product_in.tax_class_id,
            reference_price=product_in.base_price, 
            reference_cost=product_in.cost_price,
            meta_title=product_in.meta_title,
            meta_description=product_in.meta_description,
            meta_keywords=product_in.meta_keywords,
            max_order_quantity=product_in.max_order_quantity,
            weight=product_in.weight,
            weight_unit=product_in.weight_unit,
            dimensions=product_in.dimensions,
            download_url=product_in.download_url,
            file_size=product_in.file_size,
            file_extension=product_in.file_extension,
            custom_attributes=product_in.custom_attributes,
            has_variants=False,
            created_by=admin_user.staff_id, 
            updated_by=admin_user.staff_id,
            sold_count=0 
        )
        db.add(new_product)
        db.commit()
        db.refresh(new_product)
        
        return {"message": "Carcasa creada con éxito", "product_uuid": str(new_product.product_uuid)}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Fallo crítico en la persistencia: {str(e)}"
        )

@router.post("/{product_uuid}/variants", status_code=status.HTTP_201_CREATED)
def create_product_variant_admin(
    product_uuid: UUID,
    variant_in: schemas.ProductVariantUpdate,
    db: Session = Depends(get_db),
    admin_user = Depends(get_current_admin_user)
):
    product = db.query(models.Product)\
                .options(joinedload(models.Product.variants))\
                .filter(models.Product.product_uuid == product_uuid)\
                .first()
                
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto padre no encontrado")

    if variant_in.sku:
        existing_sku = db.query(models.ProductVariant).filter(models.ProductVariant.sku == variant_in.sku).first()
        if existing_sku:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="Operación rechazada: El SKU ya está en uso."
            )

    reference_price = product.reference_price or 0
    reference_cost = product.reference_cost or 0

    if product.variants and len(product.variants) > 0:
        reference_price = product.variants[0].price
        reference_cost = product.variants[0].cost_price

    final_price = variant_in.price if variant_in.price and variant_in.price > 0 else reference_price
    final_cost = variant_in.cost_price if variant_in.cost_price and variant_in.cost_price > 0 else reference_cost

    new_variant = models.ProductVariant(
        product_id=product.product_id,
        sku=variant_in.sku,
        price=final_price,
        cost_price=final_cost,
        refill_price=variant_in.refill_price,
        stock_quantity=variant_in.stock_quantity or 0,
        variant_attributes=variant_in.variant_attributes,
        is_active=True
    )
    db.add(new_variant)
    db.flush() 
    
    db.add(models.ProductPriceHistory(
        product_id=product.product_id,
        variant_id=new_variant.variant_id,
        old_value=0,
        new_value=new_variant.price,
        record_type="base_price"
    ))
    db.add(models.ProductPriceHistory(
        product_id=product.product_id,
        variant_id=new_variant.variant_id,
        old_value=0,
        new_value=new_variant.cost_price,
        record_type="cost_price"
    ))

    product.updated_by = admin_user.staff_id
    if not product.has_variants:
        product.has_variants = True
        
    db.commit()
    return {"message": "Variante creada y vinculada", "variant_uuid": str(new_variant.variant_uuid)}

@router.get("/attributes", response_model=List[schemas.AttributeResponse])
def get_attributes(db: Session = Depends(get_db), admin_user = Depends(get_current_admin_user)):
    attributes = db.query(models.ProductAttribute)\
                   .filter(models.ProductAttribute.is_active == True)\
                   .all()
    return attributes

@router.post("/attributes")
def create_attribute(
    payload: schemas.AttributeCreate,
    db: Session = Depends(get_db),
    admin_user = Depends(get_current_admin_user)
):

    existing_attr = db.query(models.ProductAttribute).filter(
        func.lower(models.ProductAttribute.name) == payload.name.lower()
    ).first()

    if existing_attr:
        if existing_attr.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="Ya existe un atributo activo con este nombre."
            )
        else:
            if existing_attr.is_variant != payload.is_variant:
                tipo_viejo = "Divisor de Stock" if existing_attr.is_variant else "Ficha Técnica"
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST, 
                    detail=f"El atributo '{existing_attr.name}' está archivado como '{tipo_viejo}'. No podés recrearlo con un comportamiento distinto porque corrompería el historial del catálogo."
                )
            
            existing_attr.is_active = True
            
            for val_str in payload.values:
                existing_val = db.query(models.ProductAttributeValue).filter(
                    models.ProductAttributeValue.attribute_id == existing_attr.attribute_id,
                    func.lower(models.ProductAttributeValue.value) == val_str.lower()
                ).first()

                if existing_val:
                    existing_val.is_active = True # Lo reactivamos
                else:
                    new_val = models.ProductAttributeValue(
                        attribute_id=existing_attr.attribute_id,
                        value=val_str,
                        is_active=True
                    )
                    db.add(new_val)
            
            db.commit()
            return existing_attr

    new_attr = models.ProductAttribute(
        name=payload.name,
        is_variant=payload.is_variant,
        is_active=True
    )
    db.add(new_attr)
    db.commit()
    db.refresh(new_attr)

    # Agregamos los valores iniciales si los enviaron
    for val_str in payload.values:
        new_val = models.ProductAttributeValue(
            attribute_id=new_attr.attribute_id,
            value=val_str,
            is_active=True
        )
        db.add(new_val)
        
    db.commit()
    return new_attr

@router.post("/attributes/{attribute_id}/values", status_code=status.HTTP_201_CREATED)
def add_attribute_value(
    attribute_id: int,
    value_in: schemas.AttributeValueCreate,
    db: Session = Depends(get_db),
    admin_user = Depends(get_current_admin_user)
):
    """Agrega un nuevo valor normalizado a un atributo existente"""
    attr = db.query(models.ProductAttribute).filter(models.ProductAttribute.attribute_id == attribute_id).first()
    if not attr:
        raise HTTPException(status_code=404, detail="Atributo no encontrado.")
        
    existing_val = db.query(models.ProductAttributeValue).filter(
        models.ProductAttributeValue.attribute_id == attribute_id,
        func.lower(models.ProductAttributeValue.value) == value_in.value.lower()
    ).first()
    
    if existing_val:
        raise HTTPException(status_code=400, detail="Este valor ya existe para el atributo seleccionado.")
    max_order = db.query(func.max(models.ProductAttributeValue.display_order))\
                  .filter(models.ProductAttributeValue.attribute_id == attribute_id)\
                  .scalar()
    
    next_order = (max_order + 1) if max_order is not None else 0

    new_val = models.ProductAttributeValue(
        attribute_id=attribute_id,
        value=value_in.value.strip(),
        display_order=next_order
    )
    db.add(new_val)
    db.commit()
    return {"message": "Valor agregado exitosamente"}


@router.delete("/attributes/values/{value_id}")
def delete_attribute_value(
    value_id: int,
    db: Session = Depends(get_db),
    admin_user = Depends(get_current_admin_user)
):
    val = db.query(models.ProductAttributeValue).filter(models.ProductAttributeValue.value_id == value_id).first()
    if not val:
        raise HTTPException(status_code=404, detail="Valor no encontrado.")
        
    val.is_active = False
    db.commit()
    return {"message": "Valor eliminado del diccionario"}

@router.delete("/attributes/{attribute_id}")
def delete_attribute(
    attribute_id: int,
    db: Session = Depends(get_db),
    admin_user = Depends(get_current_admin_user)
):
    attr = db.query(models.ProductAttribute).filter(models.ProductAttribute.attribute_id == attribute_id).first()
    
    if not attr:
        raise HTTPException(status_code=404, detail="Atributo no encontrado.")
        
    attr.is_active = False

    db.query(models.ProductAttributeValue)\
      .filter(models.ProductAttributeValue.attribute_id == attribute_id)\
      .update({"is_active": False})
    
    db.commit()
    
    return {"message": "Atributo archivado correctamente"}

@router.get("/categories/{category_id}/attributes")
def get_category_attributes(
    category_id: int, 
    db: Session = Depends(get_db), 
    admin_user = Depends(get_current_admin_user)
):
    category = db.query(models.ProductCategory).filter(models.ProductCategory.category_id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Categoría no encontrada.")

    # Traemos los enlaces pivot con la información del atributo
    links = db.query(models.SubcategoryAttribute)\
              .options(joinedload(models.SubcategoryAttribute.attribute))\
              .filter(models.SubcategoryAttribute.category_id == category_id)\
              .all()
    
    return [
        {
            "attribute_id": link.attribute_id,
            "name": link.attribute.name,
            "is_variant": link.attribute.is_variant,
            "is_required": link.is_required
        } for link in links
    ]

@router.get("/categories/{category_id}/products/count")
def count_category_products(
    category_id: int, 
    db: Session = Depends(get_db),
    admin_user = Depends(get_current_admin_user)
):

    subcategories = db.query(models.ProductCategory.category_id).filter(models.ProductCategory.parent_id == category_id).all()

    target_ids = [category_id] + [sub[0] for sub in subcategories]
    
    count = db.query(models.Product).filter(
        models.Product.category_id.in_(target_ids),
        models.Product.is_active == True
    ).count()
    
    return {"active_products_count": count}

@router.post("/categories/{category_id}/archive")
def archive_category_with_resolution(
    category_id: int,
    payload: schemas.CategoryArchiveRequest,
    db: Session = Depends(get_db),
    admin_user = Depends(get_current_admin_user)
):
    """Archiva la categoría y aplica la resolución elegida para sus productos (incluyendo hijos)"""
    category = db.query(models.ProductCategory).filter(models.ProductCategory.category_id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Categoría no encontrada.")

    subcategories = db.query(models.ProductCategory.category_id).filter(models.ProductCategory.parent_id == category_id).all()
    target_ids = [category_id] + [sub[0] for sub in subcategories]

    active_products = db.query(models.Product).filter(
        models.Product.category_id.in_(target_ids),
        models.Product.is_active == True
    ).all()

    if payload.action == "reassign":
        if not payload.new_category_id:
            raise HTTPException(status_code=400, detail="Debe especificar una subcategoría de destino.")
            
        new_cat = db.query(models.ProductCategory).filter(models.ProductCategory.category_id == payload.new_category_id).first()
        if not new_cat or new_cat.parent_id is None:
            raise HTTPException(
                status_code=400, 
                detail="La categoría de destino no es válida o es un rubro principal (debe ser una subcategoría)."
            )

        for prod in active_products:
            prod.category_id = payload.new_category_id
            prod.updated_by = admin_user.staff_id

    elif payload.action == "archive_products":
        for prod in active_products:
            prod.is_active = False
            prod.updated_by = admin_user.staff_id

    category.is_active = False
    
    db.commit()
    return {"message": "Categoría archivada y productos resueltos correctamente."}


@router.post("/categories/{category_id}/attributes")
def link_attribute_to_category(
    category_id: int,
    link_data: schemas.SubcategoryAttributeLink,
    db: Session = Depends(get_db),
    admin_user = Depends(get_current_admin_user)
):
    """Vincula un atributo a una subcategoría (Crea el candado)"""
    # 1. Verificamos que la categoría exista y sea una SUBCATEGORÍA (tenga padre)
    category = db.query(models.ProductCategory).filter(models.ProductCategory.category_id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Categoría no encontrada.")
    if category.parent_id is None:
        raise HTTPException(status_code=400, detail="Los atributos solo pueden asignarse a subcategorías (nodos finales).")

    # 2. Verificamos que el atributo exista
    attribute = db.query(models.ProductAttribute).filter(models.ProductAttribute.attribute_id == link_data.attribute_id).first()
    if not attribute:
        raise HTTPException(status_code=404, detail="Atributo no encontrado.")

    # 3. Verificamos que no esté ya vinculado
    existing_link = db.query(models.SubcategoryAttribute).filter(
        models.SubcategoryAttribute.category_id == category_id,
        models.SubcategoryAttribute.attribute_id == link_data.attribute_id
    ).first()
    
    if existing_link:
        # Si ya existe, solo actualizamos el is_required
        existing_link.is_required = link_data.is_required
    else:
        # Si no existe, creamos el vínculo en la tabla Pivot
        new_link = models.SubcategoryAttribute(
            category_id=category_id,
            attribute_id=link_data.attribute_id,
            is_required=link_data.is_required
        )
        db.add(new_link)

    db.commit()
    return {"message": "Atributo vinculado a la subcategoría exitosamente."}


@router.delete("/categories/{category_id}/attributes/{attribute_id}")
def unlink_attribute_from_category(
    category_id: int,
    attribute_id: int,
    db: Session = Depends(get_db),
    admin_user = Depends(get_current_admin_user)
):
    """Rompe el vínculo entre un atributo y una subcategoría"""
    link = db.query(models.SubcategoryAttribute).filter(
        models.SubcategoryAttribute.category_id == category_id,
        models.SubcategoryAttribute.attribute_id == attribute_id
    ).first()
    
    if not link:
        raise HTTPException(status_code=404, detail="El atributo no está vinculado a esta subcategoría.")
        
    db.delete(link)
    db.commit()
    return {"message": "Atributo desvinculado exitosamente."}