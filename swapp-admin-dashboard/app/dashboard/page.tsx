"use client";

import { useState, useEffect } from "react";
import {
	LayoutDashboard,
	RefreshCw,
	TrendingUp,
	Package,
	Box,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import PageHeader from "@/components/layout/PageHeader";
import { DashboardService } from "@/services/dashboard.service";
import { DashboardMetrics } from "@/types/dashboard";

export default function DashboardOverviewPage() {
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);

	const handleRefreshMetrics = async () => {
		setIsRefreshing(true);
		const toastId = toast.loading("Actualizando métricas...");
		try {
			const data = await DashboardService.getSummary();
            setMetrics(data);
			toast.success("Métricas actualizadas", { id: toastId });
		} catch (error) {
			toast.error("Error al conectar con el servidor", { id: toastId });
		} finally {
			setIsRefreshing(false);
		}
	};

    useEffect(() => {
        const loadInitialData = async () => {
            await handleRefreshMetrics();
        };
        loadInitialData();
    }, []);

	return (
		<div className="p-6 relative">
			<div className="mb-8 flex items-center justify-between">
				<PageHeader
					title="Resumen Operativo"
					description="Métricas generales del ecosistema logístico"
					icon={LayoutDashboard}
				/>

				<button
					onClick={handleRefreshMetrics}
					disabled={isRefreshing}
					className="inline-flex items-center gap-2 rounded-lg bg-swapp-blanco dark:bg-swapp-azul-oscuro px-4 py-2 font-medium text-swapp-azul-petroleo dark:text-swapp-tiza-verdoso border border-swapp-tiza-verdoso dark:border-swapp-azul-petroleo shadow-sm transition-colors hover:bg-swapp-tiza-verdoso dark:hover:bg-swapp-azul-petroleo disabled:opacity-50">
					<RefreshCw
						className={`h-4 w-4 ${isRefreshing ? "animate-spin text-swapp-verde-oscuro dark:text-swapp-verde-menta" : ""}`}
					/>
					{isRefreshing ? "Actualizando..." : "Actualizar Datos"}
				</button>
			</div>

			<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
				{/* Tarjeta 1 (Pendiente de conectar backend) */}
				<div className="rounded-xl border border-swapp-tiza-verdoso dark:border-swapp-azul-petroleo bg-swapp-blanco dark:bg-swapp-azul-oscuro p-6 shadow-sm transition-colors">
					<div className="flex items-center justify-between pb-4">
						<h3 className="text-sm font-medium text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70">
							Envases en Circulación
						</h3>
						<Package className="h-5 w-5 text-swapp-azul-oceano dark:text-swapp-verde-menta" />
					</div>
					<div className="text-3xl font-bold text-swapp-azul-oscuro dark:text-swapp-blanco">
						{metrics !== null ? metrics.active_containers : "-"}
					</div>
					<p className="mt-1 text-xs text-swapp-verde-pastel dark:text-swapp-verde-menta flex items-center gap-1 font-medium">
						<TrendingUp className="h-3 w-3" /> Pendiente
					</p>
				</div>

				{/* Tarjeta 2 (¡Conectada y Real!) */}
				<Link 
                    href="/dashboard/products/inventory/stock?low_stock=true"
                    className="rounded-xl border border-swapp-tiza-verdoso dark:border-swapp-azul-petroleo bg-swapp-blanco dark:bg-swapp-azul-oscuro p-6 shadow-sm transition-all hover:shadow-md hover:border-swapp-verde-oscuro/50 dark:hover:border-swapp-verde-menta/50 group block cursor-pointer"
                >
					<div className="flex items-center justify-between pb-4">
						<h3 className="text-sm font-medium text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70 group-hover:text-swapp-azul-petroleo dark:group-hover:text-swapp-tiza-verdoso transition-colors">
							Alertas de Stock
						</h3>
						<Box className={`h-5 w-5 transition-transform group-hover:scale-110 ${metrics?.low_stock_alerts && metrics.low_stock_alerts > 0 ? "text-red-500" : "text-swapp-verde-oscuro dark:text-swapp-verde-menta"}`} />
					</div>
					<div className="text-3xl font-bold text-swapp-azul-oscuro dark:text-swapp-blanco">
                        {metrics !== null ? metrics.low_stock_alerts : "-"}
					</div>
					<p className="mt-1 text-xs text-swapp-azul-petroleo/60 dark:text-swapp-tiza-verdoso/60">
						Productos requieren reposición urgente
					</p>
				</Link>
			</div>
		</div>
	);
}
