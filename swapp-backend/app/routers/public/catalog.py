from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List
from ... import models
from ...database import get_db
from ...schemas.public import catalog as public_schemas

router = APIRouter(prefix="/api/catalog", tags=["Public Catalog"])

def _serialize_public_product(p: models.Product) -> public_schemas.PublicProductCatalogResponse:
    prod_schema = public_schemas.PublicProductCatalogResponse.model_validate(p)
    
    prod_schema.media = sorted(
        [m for m in p.media if m.is_active], 
        key=lambda x: x.display_order or 0
    )
    active_variants = [v for v in p.variants if v.is_active]
    prod_schema.variants = active_variants

    container_rel = next(
        (rel for rel in p.related_to if rel.relationship_type == 'container_return'), 
        None
    )
    if container_rel and container_rel.target_product and container_rel.target_product.is_active:
        internal_prod = container_rel.target_product
        internal_variants = [v for v in internal_prod.variants if v.is_active]
        if internal_variants:
            int_var = internal_variants[0]
            prod_schema.exchange_option = public_schemas.ExchangeOptionResponse(
                internal_product_uuid=internal_prod.product_uuid,
                internal_variant_uuid=int_var.variant_uuid,
                sku=int_var.sku,
                price=float(int_var.price),
                is_available=any(v.stock_quantity > 0 for v in active_variants)
            )

    prod_schema.tax_rate = float(p.tax_class.rate) if p.tax_class else 0.0
    return prod_schema

@router.get("/products", response_model=List[public_schemas.PublicProductCatalogResponse], status_code=status.HTTP_200_OK)
def get_public_catalog_products(db: Session = Depends(get_db)):
    products = db.query(models.Product)\
                 .options(
                     joinedload(models.Product.tax_class),
                     joinedload(models.Product.brand),
                     joinedload(models.Product.media),
                     joinedload(models.Product.variants),
                     joinedload(models.Product.related_to)
                         .joinedload(models.ProductRelationship.target_product)
                         .joinedload(models.Product.variants)
                 )\
                 .filter(
                     models.Product.is_active == True,
                     models.Product.is_published == True,
                     models.Product.is_internal == False
                 )\
                 .order_by(models.Product.name)\
                 .all()

    return [_serialize_public_product(p) for p in products]

@router.get("/products/{slug}", response_model=public_schemas.PublicProductCatalogResponse, status_code=status.HTTP_200_OK)
def get_public_product_by_slug(slug: str, db: Session = Depends(get_db)):
    product = db.query(models.Product)\
                 .options(
                     joinedload(models.Product.tax_class),
                     joinedload(models.Product.brand),
                     joinedload(models.Product.media),
                     joinedload(models.Product.variants),
                     joinedload(models.Product.related_to)
                         .joinedload(models.ProductRelationship.target_product)
                         .joinedload(models.Product.variants)
                 )\
                 .filter(
                     models.Product.is_active == True,
                     models.Product.is_published == True,
                     models.Product.is_internal == False,
                     models.Product.slug == slug
                 ).first()

    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado")

    return _serialize_public_product(product)