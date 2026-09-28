"use client";

import React, { useState, useEffect } from "react";
import { AlertTriangle, CheckCircle2, X, Recycle, Info } from "lucide-react";
import { SwappTooltip } from "@/components/ui/SwappTooltip";

interface OrderItem {
	item_id: number;
	product_id: number;
	quantity: number;
	requires_return: boolean;
	expected_return_qty: number;
}

interface ConfirmOrderModalProps {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: (actualReturns?: Record<number, number>) => void;
	actionType: "complete" | "cancel" | null;
	isLoading: boolean;
	order?: any;
	products?: any[]; // Recibimos products para intentar mostrar el nombre si existe
}

export default function ConfirmOrderModal({
	isOpen,
	onClose,
	onConfirm,
	actionType,
	isLoading,
	order,
	products,
}: ConfirmOrderModalProps) {
	const [actualReturns, setActualReturns] = useState<Record<number, number>>(
		{},
	);

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

	// Inicializamos los retornos reales igualando la expectativa original
	useEffect(() => {
		if (isOpen && order && actionType === "complete") {
			const initialReturns: Record<number, number> = {};
			order.items?.forEach((item: OrderItem) => {
				if (item.requires_return) {
					initialReturns[item.item_id] = item.expected_return_qty;
				}
			});
			setActualReturns(initialReturns);
		} else {
			setActualReturns({});
		}
	}, [isOpen, order, actionType]);

	if (!isOpen || !actionType) return null;

	const isCancel = actionType === "cancel";
	const returnableItems =
		order?.items?.filter((i: OrderItem) => i.requires_return) || [];
	const hasReturns = returnableItems.length > 0;

	const handleQuantityChange = (itemId: number, value: string) => {
		let num = parseInt(value);
		if (isNaN(num) || num < 0) num = 0;
		setActualReturns((prev) => ({ ...prev, [itemId]: num }));
	};

	const handleConfirm = () => {
		if (isCancel) {
			onConfirm();
		} else {
			onConfirm(actualReturns);
		}
	};

	return (
		<div className="fixed inset-0 z-[100] flex items-center justify-center bg-swapp-azul-petroleo/5 dark:bg-swapp-negro/30 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95">
			<div
				className={`w-full max-w-md rounded-xl bg-swapp-blanco/50 dark:bg-swapp-azul-oscuro/40 backdrop-blur-md shadow-2xl border-t-4 flex flex-col max-h-[90vh] transition-colors overflow-hidden ${
					isCancel
						? "border-t-red-500"
						: "border-t-swapp-verde-oscuro dark:border-t-swapp-verde-menta"
				}`}>
				{/* HEADER ESTANDARIZADO */}
				<div className="p-6 border-b border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo flex items-center justify-between shrink-0 transition-colors">
					<div className="flex items-center gap-3">
						<div
							className={`p-2 rounded-lg border shadow-sm ${
								isCancel
									? "bg-red-500/10 border-red-500/20"
									: "bg-swapp-verde-oscuro/10 dark:bg-swapp-verde-menta/10 border-swapp-verde-oscuro/20 dark:border-swapp-verde-menta/20"
							}`}>
							{isCancel ? (
								<AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
							) : (
								<CheckCircle2 className="h-6 w-6 text-swapp-verde-oscuro dark:text-swapp-verde-menta" />
							)}
						</div>
						<div>
							<h3 className="text-xl font-bold text-swapp-azul-oscuro dark:text-swapp-blanco tracking-tight">
								{isCancel ? "Cancelar Pedido" : "Confirmar Entrega"}
							</h3>
							<p className="text-xs font-medium text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70 mt-0.5">
								ID: {order?.order_uuid?.split("-")[0].toUpperCase()}
							</p>
						</div>
					</div>
					<button
						onClick={onClose}
						disabled={isLoading}
						className="p-1 rounded-md text-swapp-azul-petroleo/50 dark:text-swapp-tiza-verdoso/50 hover:bg-red-500/10 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400 transition-colors">
						<X className="h-5 w-5" />
					</button>
				</div>

				{/* BODY */}
				<div className="p-6 overflow-y-auto custom-scrollbar flex flex-col gap-5">
					<p className="text-sm font-medium text-swapp-azul-petroleo/80 dark:text-swapp-tiza-verdoso/80">
						{isCancel
							? "¿Estás seguro de que deseas cancelar este pedido? Se liberará el stock reservado de los productos y volverá al inventario general."
							: hasReturns
								? "Confirma las cantidades exactas de envases que el repartidor recolectó del cliente."
								: "¿Confirmas que el repartidor entregó este pedido correctamente?"}
					</p>

					{/* SECCIÓN INTERACTIVA DE LOGÍSTICA INVERSA */}
					{!isCancel && hasReturns && (
						<div className="flex flex-col gap-4">
							<div className="flex items-start gap-2.5 bg-swapp-azul-oceano/10 border border-swapp-azul-oceano/20 p-3.5 rounded-xl">
								<Info className="h-4 w-4 text-swapp-azul-oceano shrink-0 mt-0.5" />
								<p className="text-xs text-swapp-azul-petroleo dark:text-swapp-tiza-verdoso font-medium leading-relaxed">
									Si el cliente devolvió{" "}
									<strong className="font-bold text-swapp-azul-oceano">
										menos envases
									</strong>{" "}
									de los esperados, la diferencia quedará registrada como{" "}
									<strong className="font-bold text-swapp-azul-oceano">
										deuda
									</strong>{" "}
									en su cuenta.
								</p>
							</div>

							<div className="flex flex-col gap-2">
								{returnableItems.map((item: OrderItem) => {
									// Intentamos buscar el nombre del producto si `products` fue inyectado
									const productInfo = products?.find(
										(p) => p.product_id === item.product_id,
									);
									const productName =
										productInfo?.name || `Producto ID: ${item.product_id}`;

									return (
										<div
											key={item.item_id}
											className="flex items-center justify-between p-3 rounded-xl border border-swapp-azul-petroleo/20 bg-swapp-blanco/40 dark:bg-swapp-azul-oscuro/20 backdrop-blur-sm shadow-sm transition-colors hover:border-swapp-verde-oscuro/30 dark:hover:border-swapp-verde-menta/30">
											<div className="flex flex-col text-left">
												<span className="text-sm font-bold text-swapp-azul-oscuro dark:text-swapp-blanco truncate max-w-[180px]">
													{productName}
												</span>
												<span className="text-xs font-medium text-swapp-azul-petroleo/60 dark:text-swapp-tiza-verdoso/60 mt-0.5">
													Esperados:{" "}
													<strong className="text-swapp-azul-petroleo/80 dark:text-swapp-tiza-verdoso">
														{item.expected_return_qty} un.
													</strong>
												</span>
											</div>

											<div className="flex items-center gap-2">
												<SwappTooltip text="Envases recuperados reales">
													<Recycle className="h-4 w-4 text-swapp-verde-oscuro/50 dark:text-swapp-verde-menta/50" />
												</SwappTooltip>
												<input
													type="number"
													min="0"
													max={item.expected_return_qty} // Opcional, dependiendo de si permitís que traigan de más
													className="w-16 h-8 rounded-md bg-swapp-blanco/50 dark:bg-swapp-azul-oscuro/40 backdrop-blur-sm border border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo px-2 text-center text-sm font-bold text-swapp-azul-oscuro dark:text-swapp-blanco outline-none focus:ring-1 focus:border-swapp-verde-oscuro dark:focus:border-swapp-verde-menta focus:ring-swapp-verde-oscuro dark:focus:ring-swapp-verde-menta transition-all shadow-sm"
													value={actualReturns[item.item_id] ?? ""}
													onChange={(e) =>
														handleQuantityChange(item.item_id, e.target.value)
													}
												/>
											</div>
										</div>
									);
								})}
							</div>
						</div>
					)}
				</div>

				{/* FOOTER ESTANDARIZADO */}
				<div className="p-4 sm:p-6 border-t border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo flex justify-end gap-3 transition-colors bg-swapp-tiza-verdoso/30 dark:bg-swapp-azul-petroleo/10">
					<button
						onClick={onClose}
						disabled={isLoading}
						className="rounded-lg px-4 py-2 text-sm font-medium text-swapp-azul-petroleo dark:text-swapp-tiza-verdoso hover:bg-red-500/10 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400 transition-colors">
						Volver
					</button>
					<button
						onClick={handleConfirm}
						disabled={isLoading}
						className={`flex items-center gap-2 rounded-lg px-6 py-2 text-sm font-medium transition-colors shadow-sm disabled:opacity-50 ${
							isCancel
								? "bg-red-600 dark:bg-red-500 text-white hover:bg-red-700 dark:hover:bg-red-600"
								: "bg-swapp-verde-pastel dark:bg-swapp-verde-menta text-swapp-blanco dark:text-swapp-azul-oscuro hover:bg-swapp-verde-oscuro dark:hover:bg-swapp-verde-pastel"
						}`}>
						{isLoading
							? "Procesando..."
							: isCancel
								? "Confirmar Cancelación"
								: "Cerrar Pedido"}
					</button>
				</div>
			</div>
		</div>
	);
}
