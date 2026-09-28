"use client";

import React, { useState, useEffect } from "react";
import { AlertTriangle, CheckCircle2, X, Recycle, Info } from "lucide-react";

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
	order?: any; // Recibimos el pedido completo
}

export default function ConfirmOrderModal({
	isOpen,
	onClose,
	onConfirm,
	actionType,
	isLoading,
	order,
}: ConfirmOrderModalProps) {
	// Estado para almacenar lo que realmente devolvió el cliente { item_id: cantidad_real }
	const [actualReturns, setActualReturns] = useState<Record<number, number>>({});

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
	const returnableItems = order?.items?.filter((i: OrderItem) => i.requires_return) || [];
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
		<div className="fixed inset-0 z-[999] flex items-center justify-center bg-swapp-negro/50 dark:bg-swapp-negro/70 backdrop-blur-sm p-4 animate-in fade-in">
			<div className="w-full max-w-md rounded-xl bg-swapp-blanco dark:bg-swapp-negro-azulado p-6 shadow-2xl border-t-4 border-swapp-turquesa-oscuro dark:border-swapp-menta relative flex flex-col max-h-[90vh]">
				<button
					onClick={onClose}
					disabled={isLoading}
					className="absolute top-4 right-4 text-swapp-azul-petroleo/50 hover:text-swapp-negro-azulado dark:text-swapp-tiza/50 dark:hover:text-swapp-blanco transition-colors">
					<X className="h-5 w-5" />
				</button>

				<div className="flex flex-col items-center text-center gap-4 mt-2 shrink-0">
					<div
						className={`p-4 rounded-full ${isCancel ? "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400" : "bg-swapp-verde-agua/20 text-swapp-turquesa-oscuro dark:bg-swapp-menta/20 dark:text-swapp-menta"}`}>
						{isCancel ? <AlertTriangle className="h-8 w-8" /> : <CheckCircle2 className="h-8 w-8" />}
					</div>

					<div>
						<h3 className="text-xl font-bold text-swapp-negro-azulado dark:text-swapp-blanco mb-2">
							{isCancel ? "Cancelar Pedido" : "Completar Pedido"}
						</h3>
						<p className="text-sm text-swapp-azul-petroleo/70 dark:text-swapp-tiza/70">
							{isCancel
								? "¿Estás seguro de que deseas cancelar este pedido? Se liberará el stock reservado de los productos y volverá al inventario general."
								: hasReturns
								? "Confirma las cantidades exactas de envases que el repartidor recolectó del cliente."
								: "¿Confirmas que el repartidor entregó este pedido correctamente?"}
						</p>
					</div>
				</div>

				{/* SECCIÓN INTERACTIVA DE LOGÍSTICA INVERSA */}
				{!isCancel && hasReturns && (
					<div className="mt-6 flex flex-col gap-3 overflow-y-auto pr-2 custom-scrollbar">
						<div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-500/10 p-3 rounded-lg border border-blue-100 dark:border-blue-500/20">
							<Info className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
							<p className="text-xs text-blue-800 dark:text-blue-300 text-left">
								Si el cliente devolvió menos envases de los esperados, la diferencia quedará registrada como <strong>deuda</strong> en su cuenta.
							</p>
						</div>

						{returnableItems.map((item: OrderItem) => (
							<div
								key={item.item_id}
								className="flex items-center justify-between p-3 rounded-lg border border-swapp-tiza dark:border-swapp-azul-petroleo bg-swapp-tiza/10 dark:bg-swapp-negro-azulado/50">
								<div className="flex flex-col text-left">
									<span className="text-sm font-semibold text-swapp-negro-azulado dark:text-swapp-blanco">
										ID Producto: {item.product_id}
									</span>
									<span className="text-xs text-swapp-azul-petroleo/60 dark:text-swapp-tiza/60 mt-0.5">
										Se esperaban {item.expected_return_qty} envases
									</span>
								</div>

								<div className="flex items-center gap-2">
									<Recycle className="h-4 w-4 text-swapp-verde-oscuro dark:text-swapp-verde-menta" />
									<input
										type="number"
										min="0"
										className="w-16 h-8 rounded-md bg-swapp-blanco dark:bg-swapp-azul-oscuro border border-swapp-verde-oscuro/30 dark:border-swapp-verde-menta/30 px-2 text-center text-sm font-bold text-swapp-verde-oscuro dark:text-swapp-verde-menta outline-none focus:ring-1 focus:ring-swapp-verde-oscuro dark:focus:ring-swapp-verde-menta transition-all"
										value={actualReturns[item.item_id] ?? ""}
										onChange={(e) => handleQuantityChange(item.item_id, e.target.value)}
									/>
								</div>
							</div>
						))}
					</div>
				)}

				<div className="flex w-full gap-3 mt-6 shrink-0">
					<button
						onClick={onClose}
						disabled={isLoading}
						className="flex-1 rounded-lg border border-swapp-tiza dark:border-swapp-azul-petroleo px-4 py-2 text-sm font-semibold text-swapp-azul-petroleo dark:text-swapp-tiza hover:bg-swapp-tiza dark:hover:bg-swapp-azul-petroleo transition-colors">
						Volver
					</button>
					<button
						onClick={handleConfirm}
						disabled={isLoading}
						className={`flex-1 rounded-lg px-4 py-2 text-sm font-bold text-swapp-blanco transition-colors ${
							isCancel
								? "bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
								: "bg-swapp-turquesa-oscuro hover:bg-swapp-azul-oceano dark:bg-swapp-menta dark:text-swapp-negro-azulado dark:hover:bg-swapp-verde-agua"
						}`}>
						{isLoading ? "Procesando..." : "Confirmar"}
					</button>
				</div>
			</div>
		</div>
	);
}