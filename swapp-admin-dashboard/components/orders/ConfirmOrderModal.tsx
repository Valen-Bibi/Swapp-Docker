"use client";

import React, { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, X, Recycle } from "lucide-react";
import { Order } from "@/types/order";
import { Product } from "@/types/product";

interface ConfirmOrderModalProps {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: (actualReturns?: Record<number, number>) => void;
	actionType: "complete" | "cancel" | null;
	isLoading: boolean;
	order?: Order | null;
	products?: Product[];
}

export default function ConfirmOrderModal({
	isOpen,
	onClose,
	onConfirm,
	actionType,
	isLoading,
	order,
	products = [],
}: ConfirmOrderModalProps) {
	// Estado para almacenar lo que realmente devuelve el cliente.
	// La key será el índice del ítem en el array de order.items
	const [returns, setReturns] = useState<Record<number, number>>({});

	useEffect(() => {
		if (isOpen && order && actionType === "complete") {
			const initialReturns: Record<number, number> = {};
			order.items.forEach((item, idx) => {
				if (item.expected_return_qty > 0) {
					// Pre-cargamos lo esperado para agilizar el trabajo del operador
					initialReturns[idx] = item.expected_return_qty;
				}
			});
			setReturns(initialReturns);
		} else {
			setReturns({});
		}
	}, [isOpen, order, actionType]);

	if (!isOpen || !actionType) return null;

	const isCancel = actionType === "cancel";
	const title = isCancel ? "Cancelar Pedido" : "Completar y Rendir Pedido";
	const description = isCancel
		? "¿Estás seguro de que deseas cancelar este pedido? Se liberará el stock reservado de los productos y volverá al inventario general."
		: "Confirma la entrega del pedido y verifica los envases recolectados. Esta acción actualizará el stock del galpón y la cuenta del cliente.";

	const returnableItems =
		order?.items
			?.map((item, idx) => ({ ...item, idx }))
			.filter((i) => i.expected_return_qty > 0) || [];

	const handleConfirm = () => {
		if (isCancel) {
			onConfirm(); // Si cancela, no enviamos retornos
		} else {
			// Transformamos el Record<idx, qty> a algo que el backend entienda:
			// [{ item_id, actual_qty }]
			const payload: Record<number, number> = {};
			returnableItems.forEach((item) => {
				// Usamos el ID del producto o variante como referencia (acá usamos item_id si existe)
				if (item.item_id) {
					payload[item.item_id] = returns[item.idx] || 0;
				}
			});
			onConfirm(payload);
		}
	};

	return (
		<div className="fixed inset-0 z-[999] flex items-center justify-center bg-swapp-negro/50 dark:bg-swapp-negro/70 backdrop-blur-sm p-4 animate-in fade-in">
			<div className="w-full max-w-md rounded-xl bg-swapp-blanco dark:bg-swapp-azul-oscuro p-6 shadow-2xl border-t-4 border-swapp-verde-oscuro dark:border-swapp-verde-menta relative flex flex-col max-h-[90vh]">
				<button
					onClick={onClose}
					disabled={isLoading}
					className="absolute top-4 right-4 text-swapp-azul-petroleo/50 hover:text-swapp-azul-oscuro dark:text-swapp-tiza-verdoso/50 dark:hover:text-swapp-blanco transition-colors">
					<X className="h-5 w-5" />
				</button>

				<div className="flex flex-col items-center text-center gap-4 mt-2 overflow-y-auto">
					<div
						className={`p-4 rounded-full ${
							isCancel
								? "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400"
								: "bg-swapp-verde-pastel/20 text-swapp-verde-oscuro dark:bg-swapp-verde-menta/20 dark:text-swapp-verde-menta"
						}`}>
						{isCancel ? (
							<AlertTriangle className="h-8 w-8" />
						) : (
							<CheckCircle2 className="h-8 w-8" />
						)}
					</div>

					<div>
						<h3 className="text-xl font-bold text-swapp-azul-oscuro dark:text-swapp-blanco mb-2">
							{title}
						</h3>
						<p className="text-sm text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70">
							{description}
						</p>
					</div>

					{/* SECCIÓN DE LOGÍSTICA INVERSA (Solo visible al completar) */}
					{!isCancel && returnableItems.length > 0 && (
						<div className="w-full mt-2 bg-swapp-azul-petroleo/5 dark:bg-swapp-azul-petroleo/20 p-4 rounded-xl border border-swapp-azul-petroleo/10 dark:border-swapp-azul-petroleo/30 text-left">
							<h4 className="text-[11px] font-bold text-swapp-verde-oscuro dark:text-swapp-verde-menta uppercase tracking-wider mb-3 flex items-center gap-1.5">
								<Recycle className="h-4 w-4" />
								Auditoría de Retornos Físicos
							</h4>
							<div className="flex flex-col gap-2">
								{returnableItems.map((item) => {
									const prodName =
										products?.find((p) => p.product_id === item.product_id)
											?.name || `Producto #${item.product_id}`;

									return (
										<div
											key={item.idx}
											className="flex items-center justify-between bg-swapp-blanco dark:bg-swapp-azul-oscuro px-3 py-2.5 rounded-lg shadow-sm border border-swapp-tiza-verdoso dark:border-swapp-azul-petroleo">
											<div className="flex flex-col">
												<span className="text-sm font-bold text-swapp-azul-oscuro dark:text-swapp-blanco">
													{prodName}
												</span>
												<span className="text-[10px] font-medium text-swapp-azul-petroleo/60 dark:text-swapp-tiza-verdoso/60">
													Esperaba: {item.expected_return_qty} un.
												</span>
											</div>
											<div className="flex items-center gap-2">
												<label className="text-[10px] font-bold text-swapp-azul-petroleo/60 dark:text-swapp-tiza-verdoso/60 uppercase">
													Trajo:
												</label>
												<input
													type="number"
													min="0"
													className="w-16 text-center rounded-md border border-swapp-tiza-verdoso dark:border-swapp-azul-petroleo bg-swapp-tiza-verdoso/30 dark:bg-swapp-negro/20 px-2 py-1 text-sm font-bold text-swapp-azul-oscuro dark:text-swapp-blanco outline-none focus:ring-1 focus:ring-swapp-verde-oscuro dark:focus:ring-swapp-verde-menta transition-all"
													value={returns[item.idx] ?? item.expected_return_qty}
													onChange={(e) =>
														setReturns({
															...returns,
															[item.idx]: parseInt(e.target.value) || 0,
														})
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

				<div className="flex w-full gap-3 mt-6">
					<button
						onClick={onClose}
						disabled={isLoading}
						className="flex-1 rounded-lg border border-swapp-tiza-verdoso dark:border-swapp-azul-petroleo px-4 py-2 text-sm font-semibold text-swapp-azul-petroleo dark:text-swapp-tiza-verdoso hover:bg-swapp-tiza-verdoso dark:hover:bg-swapp-azul-petroleo transition-colors shadow-sm">
						Volver
					</button>
					<button
						onClick={handleConfirm}
						disabled={isLoading}
						className={`flex-1 rounded-lg px-4 py-2 text-sm font-bold text-swapp-blanco transition-colors shadow-sm ${
							isCancel
								? "bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
								: "bg-swapp-verde-oscuro hover:bg-swapp-azul-oceano dark:bg-swapp-verde-menta dark:text-swapp-azul-oscuro dark:hover:bg-swapp-verde-pastel"
						}`}>
						{isLoading
							? "Procesando..."
							: isCancel
								? "Confirmar Baja"
								: "Rendir Pedido"}
					</button>
				</div>
			</div>
		</div>
	);
}
