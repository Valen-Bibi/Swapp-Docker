from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from .. import models, schemas
from ..database import get_db

router = APIRouter(
    prefix="/api/products",
    tags=["Catálogo de Productos"]
)

@router.get("/catalog", response_model=List[schemas.ProductoCatalogoResponse])
def get_catalog_products(db: Session = Depends(get_db)):
    """
    Obtiene todos los productos publicados para la vista del catálogo.
    """
    # Filtramos para traer solo los productos que están marcados como publicados
    products = db.query(models.Product).filter(models.Product.is_published == True).all()
    return products

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