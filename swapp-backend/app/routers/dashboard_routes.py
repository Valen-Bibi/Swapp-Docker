from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..auth import get_current_admin_user

from .. import models
from ..database import get_db
from ..schemas.dashboard import DashboardSummaryResponse

router = APIRouter(prefix="/api/dashboard/admin", tags=["Dashboard"])

@router.get("/summary", response_model=DashboardSummaryResponse)
def get_dashboard_summary(db: Session = Depends(get_db)):
    low_stock_count = db.query(models.ProductVariant).filter(
        models.ProductVariant.stock_quantity <= models.ProductVariant.low_stock_threshold,
        models.ProductVariant.is_active == True
    ).count()

    active_containers_result = db.query(
        func.sum(models.ClientContainerLedger.quantity_change)
    ).scalar() or 0

    stock_full_result = db.query(func.sum(models.ReturnablePhysicalStock.stock_full)).scalar() or 0
    stock_empty_result = db.query(func.sum(models.ReturnablePhysicalStock.stock_empty)).scalar() or 0
    
    warehouse_containers_count = int(stock_full_result + stock_empty_result)

    return {
        "low_stock_alerts": low_stock_count,
        "active_containers": int(active_containers_result),
        "warehouse_containers": warehouse_containers_count
    }

@router.get("/active-containers", tags=["Dashboard"])
def get_active_containers_breakdown(
    db: Session = Depends(get_db),
    admin_user = Depends(get_current_admin_user)
):
    # Agrupamos el Ledger por Producto y cruzamos con Marca y Multimedia
    results = db.query(
        models.Product.product_id,
        models.Product.name.label("product_name"),
        models.Brand.name.label("brand_name"),
        models.ProductMedia.file_url.label("image_url"),
        func.sum(models.ClientContainerLedger.quantity_change).label("circulating")
    ).join(
        models.ClientContainerLedger, 
        models.Product.product_id == models.ClientContainerLedger.product_id
    ).outerjoin(
        models.Brand, 
        models.Product.brand_id == models.Brand.brand_id
    ).outerjoin(
        models.ProductMedia, 
        (models.Product.product_id == models.ProductMedia.product_id) & 
        (models.ProductMedia.media_subtype == 'main')
    ).group_by(
        models.Product.product_id,
        models.Brand.name,
        models.ProductMedia.file_url
    ).having(
        func.sum(models.ClientContainerLedger.quantity_change) > 0
    ).order_by(
        func.sum(models.ClientContainerLedger.quantity_change).desc()
    ).all()
    
    breakdown = []
    for r in results:
        breakdown.append({
            "product_id": r.product_id,
            "product_name": r.product_name,
            "brand_name": r.brand_name or "Generico",
            "image_url": r.image_url,
            "circulating_qty": int(r.circulating)
        })
        
    return breakdown