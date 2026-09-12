"use client";

import { useState, useEffect } from "react";
import {
	LayoutDashboard,
	RefreshCw,
	TrendingUp,
	Package,
	Box,
	ChevronDown,
	ChevronUp,
	Loader2,
	Image as ImageIcon
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import PageHeader from "@/components/layout/PageHeader";
import { DashboardService } from "@/services/dashboard.service";
import { DashboardMetrics, ContainerBreakdown } from "@/types/dashboard";

export default function DashboardOverviewPage() {
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);

	// Estados para el submenú de envases
	const [isBreakdownOpen, setIsBreakdownOpen] = useState(false);
	const [breakdownData, setBreakdownData] = useState<ContainerBreakdown[]>([]);
	const [isLoadingBreakdown, setIsLoadingBreakdown] = useState(false);

	const handleRefreshMetrics = async () => {
		setIsRefreshing(true);
		const toastId = toast.loading("Actualizando métricas...");
		try {
			const data = await DashboardService.getSummary();
			setMetrics(data);
			toast.success("Métricas actualizadas", { id: toastId });
			
			// Si el submenú está abierto, lo actualizamos también
			if (isBreakdownOpen) {
				fetchBreakdown();
			}
		} catch (error) {
			toast.error("Error al conectar con el servidor", { id: toastId });
		} finally {
			setIsRefreshing(false);
		}
	};

	const fetchBreakdown = async () => {
		setIsLoadingBreakdown(true);
		try {
			const data = await DashboardService.getActiveContainersBreakdown();
			setBreakdownData(data);
		} catch (error) {
			toast.error("Error al obtener el detalle de envases");
		} finally {
			setIsLoadingBreakdown(false);
		}
	};

	const toggleBreakdown = () => {
		if (!isBreakdownOpen && breakdownData.length === 0) {
			fetchBreakdown();
		}
		setIsBreakdownOpen(!isBreakdownOpen);
	};

	useEffect(() => {
		handleRefreshMetrics();
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

			<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 items-start">
				
				{/* Tarjeta 1: Flujo de Envases (AHORA DESPLEGABLE) */}
				<div className="rounded-xl border border-swapp-tiza-verdoso dark:border-swapp-azul-petroleo bg-swapp-blanco dark:bg-swapp-azul-oscuro shadow-sm transition-all overflow-hidden flex flex-col">
					<div className="p-6">
						<div className="flex items-center justify-between pb-4 border-b border-swapp-tiza-verdoso/50 dark:border-swapp-azul-petroleo/50 mb-4">
							<h3 className="text-sm font-bold text-swapp-azul-petroleo dark:text-swapp-tiza-verdoso uppercase tracking-wider">
								Flujo de Envases
							</h3>
							<Package className="h-5 w-5 text-swapp-verde-oscuro dark:text-swapp-verde-menta" />
						</div>
						
						<div className="flex items-end justify-between">
							<div className="flex flex-col">
								<span className="text-3xl font-bold text-swapp-azul-oscuro dark:text-swapp-blanco">
									{metrics !== null ? metrics.active_containers : "-"}
								</span>
								<p className="mt-1 text-[11px] text-swapp-verde-oscuro dark:text-swapp-verde-menta flex items-center gap-1 font-bold uppercase tracking-wide">
									<TrendingUp className="h-3 w-3" /> En la calle
								</p>
							</div>
							
							<div className="flex flex-col items-end text-right border-l border-swapp-tiza-verdoso dark:border-swapp-azul-petroleo/50 pl-4">
								<span className="text-xl font-bold text-swapp-azul-petroleo/80 dark:text-swapp-tiza-verdoso/80">
									{metrics !== null ? metrics.warehouse_containers : "-"}
								</span>
								<p className="mt-1 text-[10px] text-swapp-azul-petroleo/60 dark:text-swapp-tiza-verdoso/60 font-bold uppercase tracking-wide">
									En el depósito
								</p>
							</div>
						</div>
					</div>

					{/* Botón de Expansión */}
					<button 
						onClick={toggleBreakdown}
						className="w-full bg-swapp-tiza-verdoso/20 dark:bg-black/20 hover:bg-swapp-tiza-verdoso/40 dark:hover:bg-black/40 py-2.5 flex items-center justify-center gap-2 text-xs font-bold text-swapp-azul-petroleo dark:text-swapp-tiza-verdoso transition-colors border-t border-swapp-tiza-verdoso/50 dark:border-swapp-azul-petroleo/50"
					>
						{isBreakdownOpen ? (
							<><ChevronUp className="h-4 w-4" /> Ocultar Detalle</>
						) : (
							<><ChevronDown className="h-4 w-4" /> Ver Productos en Circulación</>
						)}
					</button>

					{/* Submenú Animado */}
					<div className={`grid transition-all duration-300 ease-in-out ${isBreakdownOpen ? "grid-rows-[1fr] opacity-100 border-t border-swapp-tiza-verdoso/50 dark:border-swapp-azul-petroleo/50" : "grid-rows-[0fr] opacity-0"}`}>
						<div className="overflow-hidden">
							<div className="p-4 bg-swapp-blanco/50 dark:bg-swapp-azul-oscuro/50 backdrop-blur-sm max-h-[250px] overflow-y-auto custom-scrollbar">
								{isLoadingBreakdown ? (
									<div className="flex flex-col items-center justify-center py-6 text-swapp-azul-petroleo/60 dark:text-swapp-tiza-verdoso/60">
										<Loader2 className="h-5 w-5 animate-spin mb-2 text-swapp-verde-oscuro dark:text-swapp-verde-menta" />
										<span className="text-xs">Cargando inventario...</span>
									</div>
								) : breakdownData.length === 0 ? (
									<p className="text-center text-xs text-swapp-azul-petroleo/60 dark:text-swapp-tiza-verdoso/60 py-4 italic">
										No hay envases registrados en la calle actualmente.
									</p>
								) : (
									<div className="flex flex-col gap-2">
										{breakdownData.map((item) => (
											<div key={item.product_id} className="flex items-center justify-between p-2.5 rounded-lg border border-swapp-tiza-verdoso dark:border-swapp-azul-petroleo bg-swapp-blanco dark:bg-swapp-azul-oscuro shadow-sm hover:border-swapp-verde-pastel dark:hover:border-swapp-verde-menta/50 transition-colors">
												<div className="flex items-center gap-3">
													{item.image_url ? (
														<img src={item.image_url} alt={item.product_name} className="h-8 w-8 rounded object-cover border border-swapp-tiza-verdoso/50 dark:border-swapp-azul-petroleo/50" />
													) : (
														<div className="h-8 w-8 rounded bg-swapp-tiza-verdoso/50 dark:bg-swapp-azul-petroleo/50 flex items-center justify-center">
															<ImageIcon className="h-4 w-4 text-swapp-azul-petroleo/40 dark:text-swapp-tiza-verdoso/40" />
														</div>
													)}
													<div className="flex flex-col">
														<span className="text-xs font-bold text-swapp-azul-oscuro dark:text-swapp-blanco line-clamp-1">{item.product_name}</span>
														<span className="text-[10px] font-medium text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70">{item.brand_name}</span>
													</div>
												</div>
												<div className="flex flex-col items-end pl-2">
													<span className="text-sm font-bold text-swapp-verde-oscuro dark:text-swapp-verde-menta">
														{item.circulating_qty}
													</span>
													<span className="text-[9px] uppercase font-bold text-swapp-azul-petroleo/50 dark:text-swapp-tiza-verdoso/50">
														Unid.
													</span>
												</div>
											</div>
										))}
									</div>
								)}
							</div>
						</div>
					</div>
				</div>

				{/* Tarjeta 2 */}
				<Link
					href="/dashboard/products/inventory/stock?low_stock=true"
					className="rounded-xl border border-swapp-tiza-verdoso dark:border-swapp-azul-petroleo bg-swapp-blanco dark:bg-swapp-azul-oscuro p-6 shadow-sm transition-all hover:shadow-md hover:border-swapp-verde-oscuro/50 dark:hover:border-swapp-verde-menta/50 group block cursor-pointer">
					<div className="flex items-center justify-between pb-4">
						<h3 className="text-sm font-medium text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70 group-hover:text-swapp-azul-petroleo dark:group-hover:text-swapp-tiza-verdoso transition-colors">
							Alertas de Stock
						</h3>
						<Box
							className={`h-5 w-5 transition-transform group-hover:scale-110 ${metrics?.low_stock_alerts && metrics.low_stock_alerts > 0 ? "text-red-500" : "text-swapp-verde-oscuro dark:text-swapp-verde-menta"}`}
						/>
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