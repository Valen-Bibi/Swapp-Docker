import { useState, useEffect } from "react";
import {
	X,
	History,
	ArrowRight,
	TrendingUp,
	TrendingDown,
	CalendarClock,
} from "lucide-react";
import { ProductService } from "@/services/product.service";
import { toast } from "sonner";
import { Product, ProductVariant } from "@/types/product";

interface PriceHistoryRecord {
	history_id: number;
	old_value: number;
	new_value: number;
	changed_at: string;
	record_type: "base_price" | "cost_price" | "special_offer_price";
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

	useEffect(() => {
		const fetchHistory = async () => {
			if (!product || !variant) return;
			setIsLoading(true);
			try {
				// Recordatorio: actualiza la firma en product.service.ts
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
					<span className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400 border border-orange-200 dark:border-orange-500/30">
						COSTO
					</span>
				);
			case "special_offer_price":
				return (
					<span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400 border border-purple-200 dark:border-purple-500/30">
						OFERTA
					</span>
				);
			case "base_price":
			default:
				return (
					<span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30">
						PRECIO BASE
					</span>
				);
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-swapp-negro/50 dark:bg-swapp-negro/70 backdrop-blur-sm p-4">
			<div className="w-full max-w-md max-h-[85vh] flex flex-col rounded-xl bg-swapp-blanco dark:bg-swapp-negro-azulado shadow-2xl border-t-4 border-swapp-azul-oceano dark:border-swapp-verde-agua transition-colors">
				<div className="p-6 pb-4 border-b border-swapp-tiza dark:border-swapp-azul-petroleo shrink-0">
					<div className="flex items-center justify-between mb-2">
						<h2 className="text-xl font-bold flex items-center gap-2">
							<History className="h-5 w-5" />
							Historial Financiero
						</h2>
						<button
							onClick={onClose}
							className="text-swapp-azul-petroleo/50 hover:text-swapp-negro-azulado transition-colors">
							<X className="h-5 w-5" />
						</button>
					</div>
					<div className="flex flex-col gap-1">
						<p className="text-sm font-medium text-swapp-azul-petroleo/70 dark:text-swapp-tiza/70">
							{product.name}
						</p>
						<span className="text-xs font-mono bg-swapp-tiza/50 dark:bg-swapp-azul-petroleo/50 text-swapp-turquesa-oscuro dark:text-swapp-menta px-2 py-1 rounded w-fit">
							SKU: {variant.sku}
						</span>
					</div>
				</div>

				<div className="p-6 overflow-y-auto custom-scrollbar flex-1">
					{isLoading ? (
						<div className="flex justify-center items-center py-8">
							<div className="h-6 w-6 animate-spin rounded-full border-2 border-swapp-tiza border-t-swapp-turquesa-oscuro"></div>
						</div>
					) : history.length === 0 ? (
						<div className="text-center py-8">
							<CalendarClock className="h-10 w-10 mx-auto text-swapp-azul-petroleo/30 dark:text-swapp-tiza/30 mb-3" />
							<p className="text-sm text-swapp-azul-petroleo/70 dark:text-swapp-tiza/70">
								Este SKU no tiene registros de cambios financieros.
							</p>
						</div>
					) : (
						<div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-swapp-tiza dark:before:via-swapp-azul-petroleo before:to-transparent">
							{history.map((record) => {
								const change = getPercentageChange(
									record.old_value,
									record.new_value,
								);
								const isIncrease = change > 0;

								return (
									<div
										key={record.history_id}
										className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
										<div className="flex items-center justify-center w-10 h-10 rounded-full border border-swapp-blanco dark:border-swapp-negro-azulado bg-swapp-tiza dark:bg-swapp-azul-petroleo group-[.is-active]:bg-swapp-turquesa-oscuro dark:group-[.is-active]:bg-swapp-menta text-swapp-blanco shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow z-10 relative">
											{isIncrease ? (
												<TrendingUp className="h-4 w-4" />
											) : (
												<TrendingDown className="h-4 w-4" />
											)}
										</div>
										<div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-lg border border-swapp-tiza dark:border-swapp-azul-petroleo bg-swapp-blanco dark:bg-swapp-negro-azulado shadow-sm">
											<div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
												<div className="flex items-center gap-2">
													<span className="text-xs font-semibold text-swapp-azul-petroleo/50 dark:text-swapp-tiza/50">
														{formatDate(record.changed_at)}
													</span>
													{getRecordTypeBadge(record.record_type)}
												</div>
												<span
													className={`text-xs font-bold px-2 py-0.5 rounded-full ${isIncrease ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600"}`}>
													{isIncrease ? "+" : ""}
													{change}%
												</span>
											</div>
											<div className="flex items-center justify-between mt-2 bg-swapp-tiza/20 dark:bg-swapp-azul-petroleo/20 p-2 rounded-md">
												<span className="text-sm font-medium line-through">
													${Number(record.old_value).toFixed(2)}
												</span>
												<ArrowRight className="h-4 w-4 text-swapp-tiza dark:text-swapp-azul-petroleo" />
												<span className="text-base font-bold">
													${Number(record.new_value).toFixed(2)}
												</span>
											</div>
										</div>
									</div>
								);
							})}
						</div>
					)}
				</div>
				<div className="p-4 border-t border-swapp-tiza shrink-0 bg-swapp-tiza/30 flex justify-center">
					<button
						onClick={onClose}
						className="px-6 py-2 text-sm font-medium rounded-lg text-swapp-blanco bg-swapp-negro-azulado">
						Cerrar
					</button>
				</div>
			</div>
		</div>
	);
}
