"use client";

import { useState, useEffect } from "react";
import {
	X,
	History,
	ArrowRight,
	TrendingUp,
	TrendingDown,
	CalendarClock,
	Recycle,
} from "lucide-react";
import { ProductService } from "@/services/product.service";
import { toast } from "sonner";
import { Product, ProductVariant } from "@/types/product";

interface PriceHistoryRecord {
	history_id: number;
	old_value: number;
	new_value: number;
	changed_at: string;
	record_type:
		| "base_price"
		| "cost_price"
		| "special_offer_price"
		| "refill_price";
}

interface PriceHistoryModalProps {
	isOpen: boolean;
	onClose: () => void;
	product: Product | null;
	variant: ProductVariant | null;
}

export default function PriceHistoryModal({
	isOpen,
	onClose,
	product,
	variant,
}: PriceHistoryModalProps) {
	const [history, setHistory] = useState<PriceHistoryRecord[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	// --- CERRAR CON ESCAPE ---
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape" && isOpen) {
				onClose();
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [isOpen, onClose]);

	useEffect(() => {
		const fetchHistory = async () => {
			if (!product || !variant) return;
			setIsLoading(true);
			try {
				const data = await ProductService.getPriceHistory(
					product.product_uuid,
					variant.variant_uuid!,
				);
				setHistory(data);
			} catch (error) {
				toast.error("No se pudo cargar el historial de precios.");
			} finally {
				setIsLoading(false);
			}
		};

		if (isOpen) fetchHistory();
	}, [isOpen, product, variant]);

	if (!isOpen || !product || !variant) return null;

	const getPercentageChange = (oldValue: number, newValue: number): number => {
		if (oldValue === 0) return 100;
		return Number((((newValue - oldValue) / oldValue) * 100).toFixed(1));
	};

	const formatDate = (isoString: string) => {
		return new Date(isoString).toLocaleString("es-AR", {
			day: "2-digit",
			month: "2-digit",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	const getRecordTypeBadge = (type: string) => {
		switch (type) {
			case "cost_price":
				return (
					<span className="text-[10px] font-bold px-2.5 py-1 rounded bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400 border border-orange-200 dark:border-orange-500/30">
						COSTO
					</span>
				);
			case "special_offer_price":
				return (
					<span className="text-[10px] font-bold px-2.5 py-1 rounded bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400 border border-purple-200 dark:border-purple-500/30">
						OFERTA
					</span>
				);
			case "refill_price":
				return (
					<span className="text-[10px] font-bold px-2.5 py-1 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 flex items-center gap-1.5">
						<Recycle className="h-3 w-3" /> RECARGA
					</span>
				);
			case "base_price":
			default:
				return (
					<span className="text-[10px] font-bold px-2.5 py-1 rounded bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30">
						PRECIO BASE
					</span>
				);
		}
	};

	return (
		<div className="fixed inset-0 z-[100] flex items-center justify-center bg-swapp-azul-petroleo/5 dark:bg-swapp-negro/30 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95">
			<div className="w-full max-w-3xl flex flex-col rounded-xl bg-swapp-blanco/50 dark:bg-swapp-azul-oscuro/40 backdrop-blur-md shadow-2xl border-t-4 border-t-swapp-verde-oscuro dark:border-t-swapp-verde-menta max-h-[90vh] overflow-hidden transition-colors">
				{/* HEADER */}
				<div className="p-6 border-b border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo flex items-start justify-between shrink-0 transition-colors">
					<div className="flex gap-4">
						<div className="p-2.5 bg-swapp-verde-oscuro/10 dark:bg-swapp-verde-menta/10 rounded-xl border border-swapp-verde-oscuro/20 dark:border-swapp-verde-menta/20 shadow-sm shrink-0 h-fit">
							<History className="h-6 w-6 text-swapp-verde-oscuro dark:text-swapp-verde-menta" />
						</div>
						<div>
							<h2 className="text-xl font-bold text-swapp-azul-oscuro dark:text-swapp-blanco tracking-tight">
								Historial Financiero
							</h2>
							<p className="text-sm text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70 mt-1 font-medium transition-colors">
								{product.name}
							</p>
							<p className="text-xs font-mono font-bold tracking-wider text-swapp-verde-oscuro dark:text-swapp-verde-menta mt-2 bg-swapp-verde-oscuro/10 dark:bg-swapp-verde-menta/10 inline-block px-2.5 py-1 rounded-md border border-swapp-verde-oscuro/20 dark:border-swapp-verde-menta/20">
								SKU: {variant.sku}
							</p>
						</div>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="p-1.5 rounded-md text-swapp-azul-petroleo/50 dark:text-swapp-tiza-verdoso/50 hover:bg-red-500/10 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400 transition-colors">
						<X className="h-5 w-5" />
					</button>
				</div>

				{/* BODY */}
				<div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-swapp-blanco/20 dark:bg-transparent">
					{isLoading ? (
						<div className="flex justify-center items-center py-12">
							<div className="h-8 w-8 animate-spin rounded-full border-4 border-swapp-verde-oscuro dark:border-swapp-verde-menta border-t-transparent"></div>
						</div>
					) : history.length === 0 ? (
						<div className="text-center py-12">
							<CalendarClock className="h-12 w-12 mx-auto text-swapp-azul-petroleo/30 dark:text-swapp-tiza-verdoso/30 mb-4" />
							<p className="text-base font-medium text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70">
								Este SKU no tiene registros de cambios financieros.
							</p>
						</div>
					) : (
						<div className="relative py-4 space-y-8">
							{/* LÍNEA DE TIEMPO ABSOLUTA */}
							<div className="absolute top-0 bottom-0 left-[2rem] md:left-1/2 w-0.5 bg-swapp-azul-petroleo/20 dark:bg-swapp-azul-petroleo/50 -translate-x-1/2 rounded-full"></div>

							{history.map((record, idx) => {
								const change = getPercentageChange(
									record.old_value,
									record.new_value,
								);
								const isIncrease = change > 0;
								const isLeft = idx % 2 === 0;

								return (
									<div
										key={record.history_id}
										className="relative flex items-center w-full">
										{/* ICONO CENTRAL TIMELINE */}
										<div className="absolute left-[2rem] md:left-1/2 -translate-x-1/2 flex items-center justify-center w-12 h-12 rounded-full border-[3px] border-swapp-blanco dark:border-swapp-azul-oscuro bg-swapp-verde-oscuro dark:bg-swapp-verde-menta text-swapp-blanco dark:text-swapp-azul-oscuro shadow-md z-10 transition-colors">
											{isIncrease ? (
												<TrendingUp className="h-5 w-5" />
											) : (
												<TrendingDown className="h-5 w-5" />
											)}
										</div>

										{/* WRAPPER FLEX PARA PERMITIR CRECIMIENTO HACIA AFUERA */}
										<div
											className={`flex w-full ${isLeft ? "md:w-1/2 md:justify-end md:pr-10" : "md:w-1/2 md:ml-auto md:justify-start pl-[4.5rem] md:pl-10"}`}>
											{/* TARJETA DE HISTORIAL ELÁSTICA (w-max) */}
											<div className="w-full md:w-max md:min-w-[320px] p-4 sm:p-5 rounded-2xl border border-swapp-azul-petroleo/10 dark:border-swapp-azul-petroleo bg-swapp-blanco/60 dark:bg-swapp-azul-oscuro/60 backdrop-blur-md shadow-sm transition-all hover:shadow-md hover:border-swapp-verde-oscuro/30 dark:hover:border-swapp-verde-menta/30">
												<div className="flex items-center justify-between mb-4 gap-4 flex-wrap border-b border-swapp-azul-petroleo/10 dark:border-swapp-azul-petroleo/50 pb-3">
													<div className="flex items-center gap-3">
														<span className="text-[11px] font-semibold text-swapp-azul-petroleo/60 dark:text-swapp-tiza-verdoso/60">
															{formatDate(record.changed_at)}
														</span>
														{getRecordTypeBadge(record.record_type)}
													</div>
													<span
														className={`text-sm font-bold px-2.5 py-0.5 rounded-full shrink-0 ${isIncrease ? "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400" : "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"}`}>
														{isIncrease ? "+" : ""}
														{change}%
													</span>
												</div>

												{/* COMPARADOR DE PRECIOS CON TEXT-LEFT Y SIN TRUNCATE */}
												<div className="flex items-center justify-between bg-swapp-azul-petroleo/5 dark:bg-swapp-azul-petroleo/30 p-3 sm:p-4 rounded-xl border border-swapp-azul-petroleo/5 dark:border-swapp-azul-petroleo/50 gap-4 sm:gap-6">
													<div className="flex flex-col shrink-0 text-left">
														<span className="text-[10px] font-bold text-swapp-azul-petroleo/50 dark:text-swapp-tiza-verdoso/50 uppercase tracking-wider mb-1">
															Antes
														</span>
														<span className="text-sm sm:text-base font-medium line-through text-swapp-azul-petroleo/60 dark:text-swapp-tiza-verdoso/60">
															${Number(record.old_value).toFixed(2)}
														</span>
													</div>

													<div className="flex items-center justify-center bg-swapp-blanco/50 dark:bg-swapp-azul-oscuro/50 rounded-full p-1.5 shadow-sm border border-swapp-azul-petroleo/10 dark:border-swapp-azul-petroleo/30 shrink-0">
														<ArrowRight className="h-4 w-4 text-swapp-verde-oscuro dark:text-swapp-verde-menta" />
													</div>

													<div className="flex flex-col shrink-0 text-left">
														<span className="text-[10px] font-bold text-swapp-verde-oscuro dark:text-swapp-verde-menta uppercase tracking-wider mb-1">
															Ahora
														</span>
														<span className="text-lg sm:text-xl font-bold text-swapp-azul-oscuro dark:text-swapp-blanco tracking-tight">
															${Number(record.new_value).toFixed(2)}
														</span>
													</div>
												</div>
											</div>
										</div>
									</div>
								);
							})}
						</div>
					)}
				</div>

				{/* FOOTER ESTANDARIZADO */}
				<div className="p-6 border-t border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo flex justify-end shrink-0 transition-colors">
					<button
						type="button"
						onClick={onClose}
						className="flex items-center gap-2 rounded-lg bg-swapp-verde-pastel dark:bg-swapp-verde-menta px-6 py-2 text-sm font-medium text-swapp-blanco dark:text-swapp-azul-oscuro transition-colors hover:bg-swapp-verde-oscuro dark:hover:bg-swapp-verde-pastel disabled:opacity-50">
						Cerrar Historial
					</button>
				</div>
			</div>
		</div>
	);
}
