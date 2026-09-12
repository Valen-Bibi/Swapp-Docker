export interface DashboardMetrics {
  low_stock_alerts: number;
  active_containers: number;
  warehouse_containers: number;
}

export interface ContainerBreakdown {
	product_id: number;
	product_name: string;
	brand_name: string;
	image_url: string | null;
	circulating_qty: number;
}