from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
# Asegurate de importar tus modelos y tu dependencia de base de datos
from app.models.products import ProductVariant
from app.database import get_db

router = APIRouter(prefix="/api/dashboard/admin", tags=["Dashboard"])

@router.get("/summary")
def get_dashboard_summary(db: Session = Depends(get_db)):
    # 1. Alertas de Stock: Contamos variantes donde el stock actual es menor o igual al umbral crítico.
    low_stock_count = db.query(ProductVariant).filter(
        ProductVariant.stock_quantity <= ProductVariant.low_stock_threshold,
        ProductVariant.is_active == True
    ).count()

    # (Acá en el futuro agregaremos la consulta de 'Envases en Circulación')
    active_containers_count = 0 

    return {
        "low_stock_alerts": low_stock_count,
        "active_containers": active_containers_count
    }