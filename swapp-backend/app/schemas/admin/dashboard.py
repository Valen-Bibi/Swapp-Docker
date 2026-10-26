from pydantic import BaseModel

class DashboardSummaryResponse(BaseModel):
    low_stock_alerts: int
    active_containers: int
    warehouse_containers: int