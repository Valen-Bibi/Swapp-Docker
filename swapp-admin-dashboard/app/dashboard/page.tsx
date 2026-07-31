"use client";

import { useState } from "react";
import {
	LayoutDashboard,
	RefreshCw,
	TrendingUp,
	Package,
	Box,
} from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/layout/PageHeader";

export default function DashboardOverviewPage() {
	const [isRefreshing, setIsRefreshing] = useState(false);

	const handleRefreshMetrics = async () => {
		setIsRefreshing(true);
		const toastId = toast.loading("Actualizando métricas...");
		try {
			await new Promise((resolve) => setTimeout(resolve, 800));
			toast.success("Métricas actualizadas", { id: toastId });
		} catch (error) {
			toast.error("Error al conectar con el servidor", { id: toastId });
		} finally {
			setIsRefreshing(false);
		}
	};

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
					className="inline-flex items-center gap-2 rounded-lg bg-swapp-blanco dark:bg-swapp-negro-azulado px-4 py-2 font-medium text-swapp-azul-petroleo dark:text-swapp-tiza border border-swapp-tiza dark:border-swapp-azul-petroleo shadow-sm transition-colors hover:bg-swapp-tiza dark:hover:bg-swapp-azul-petroleo disabled:opacity-50">
					<RefreshCw
						className={`h-4 w-4 ${isRefreshing ? "animate-spin text-swapp-turquesa-oscuro dark:text-swapp-menta" : ""}`}
					/>
					{isRefreshing ? "Actualizando..." : "Actualizar Datos"}
				</button>
			</div>

			<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
				{/* Tarjeta 1 */}
				<div className="rounded-xl border border-swapp-tiza dark:border-swapp-azul-petroleo bg-swapp-blanco dark:bg-swapp-negro-azulado p-6 shadow-sm transition-colors">
					<div className="flex items-center justify-between pb-4">
						<h3 className="text-sm font-medium text-swapp-azul-petroleo/70 dark:text-swapp-tiza/70">
							Envases en Circulación
						</h3>
						<Package className="h-5 w-5 text-swapp-azul-oceano dark:text-swapp-menta" />
					</div>
					<div className="text-3xl font-bold text-swapp-negro-azulado dark:text-swapp-blanco">
						1,248
					</div>
					<p className="mt-1 text-xs text-swapp-verde-agua dark:text-swapp-menta flex items-center gap-1 font-medium">
						<TrendingUp className="h-3 w-3" /> +12% este mes
					</p>
				</div>

				{/* Tarjeta 2 */}
				<div className="rounded-xl border border-swapp-tiza dark:border-swapp-azul-petroleo bg-swapp-blanco dark:bg-swapp-negro-azulado p-6 shadow-sm transition-colors">
					<div className="flex items-center justify-between pb-4">
						<h3 className="text-sm font-medium text-swapp-azul-petroleo/70 dark:text-swapp-tiza/70">
							Alertas de Stock
						</h3>
						<Box className="h-5 w-5 text-swapp-turquesa-oscuro dark:text-swapp-menta" />
					</div>
					<div className="text-3xl font-bold text-swapp-negro-azulado dark:text-swapp-blanco">
						3
					</div>
					<p className="mt-1 text-xs text-swapp-azul-petroleo/60 dark:text-swapp-tiza/60">
						Productos requieren reposición urgente
					</p>
				</div>
			</div>

			<div className="mt-8 rounded-xl border border-swapp-tiza dark:border-swapp-azul-petroleo bg-swapp-tiza/20 dark:bg-swapp-azul-petroleo/20 p-8 text-center text-swapp-azul-petroleo/50 dark:text-swapp-tiza/50 shadow-sm min-h-[300px] flex items-center justify-center flex-col gap-3 transition-colors">
				<LayoutDashboard className="h-10 w-10 text-swapp-tiza dark:text-swapp-azul-petroleo/50" />
				<p>Acá va la visualización de gráficos.</p>
			</div>
		</div>
	);
}
