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
	const [returns, setReturns] = useState<Record<number, number>>({});

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
		if (isOpen && order && actionType === "complete") {
			const initialReturns: Record<number, number> = {};
			order.items.forEach((item, idx) => {
				if (item.expected_return_qty > 0) {
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
		: "Confirma la entrega del pedido y verifica los envases recolectados. Esta acción actualizará el stock y la cuenta del cliente.";

	const returnableItems =
		order?.items
			?.map((item, idx) => ({ ...item, idx }))
			.filter((i) => i.expected_return_qty > 0) || [];

	const handleConfirm = () => {
		if (isCancel) {
			onConfirm();
		} else {
			const payload: Record<number, number> = {};
			returnableItems.forEach((item) => {
				if (item.item_id) {
					payload[item.item_id] = returns[item.idx] || 0;
				}
			});
			onConfirm(payload);
		}
	};

	return (
		<div className="fixed inset-0 z-[100] flex items-center justify-center bg-swapp-azul-petroleo/5 dark:bg-swapp-negro/30 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95">
			<div className={`w-full max-w-md rounded-xl bg-swapp-blanco/50 dark:bg-swapp-azul-oscuro/40 backdrop-blur-md shadow-2xl border-t-4 overflow-hidden flex flex-col max-h-[90vh] transition-colors ${
				isCancel ? "border-t-red-500 dark:border-t-red-400" : "border-t-swapp-verde-oscuro dark:border-t-swapp-verde-menta"
			}`}>
				
				{/* Header Estandarizado */}
				<div className="p-6 border-b border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo flex items-start justify-between shrink-0 transition-colors">
					<div className="flex items-center gap-3">
						<div className={`p-2 rounded-lg border shadow-sm ${
							isCancel
								? "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400"
								: "bg-swapp-verde-pastel/20 dark:bg-swapp-verde-menta/20 border-swapp-verde-oscuro/20 dark:border-swapp-verde-menta/20 text-swapp-verde-oscuro dark:text-swapp-verde-menta"
						}`}>
							{isCancel ? <AlertTriangle className="h-6 w-6" /> : <CheckCircle2 className="h-6 w-6" />}
						</div>
						<div>
							<h3 className="text-xl font-bold text-swapp-azul-oscuro dark:text-swapp-blanco tracking-tight">
								{title}
							</h3>
						</div>
					</div>
					<button
						type="button"
						onClick={onClose}
						disabled={isLoading}
						className="p-1 rounded-md text-swapp-azul-petroleo/50 dark:text-swapp-tiza-verdoso/50 hover:bg-red-500/10 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400 transition-colors mt-0.5">
						<X className="h-5 w-5" />
					</button>
				</div>

				{/* Body */}
				<div className="p-6 overflow-y-auto custom-scrollbar">
					<p className="text-sm font-medium text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70 mb-4">
						{description}
					</p>

					{/* SECCIÓN DE LOGÍSTICA INVERSA (Solo visible al completar) */}
					{!isCancel && returnableItems.length > 0 && (
						<div className="w-full mt-4 bg-swapp-blanco/40 dark:bg-swapp-azul-oscuro/20 p-4 rounded-xl border border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo/50 text-left shadow-sm backdrop-blur-sm transition-colors">
							<h4 className="text-[11px] font-bold text-swapp-verde-oscuro dark:text-swapp-verde-menta uppercase tracking-wider mb-3 flex items-center gap-1.5">
								<Recycle className="h-4 w-4" />
								Auditoría de Retornos Físicos
							</h4>
							<div className="flex flex-col gap-3">
								{returnableItems.map((item) => {
									const prodName =
										products?.find((p) => p.product_id === item.product_id)
											?.name || `Producto #${item.product_id}`;

									return (
										<div
											key={item.idx}
											className="flex items-center justify-between bg-swapp-blanco/50 dark:bg-swapp-azul-oscuro/40 px-3 py-2.5 rounded-lg shadow-sm border border-swapp-azul-petroleo/10 dark:border-swapp-azul-petroleo/30 transition-colors">
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
													className="w-16 text-center rounded-md border border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo/50 bg-transparent px-2 py-1 text-sm font-bold text-swapp-azul-oscuro dark:text-swapp-blanco outline-none focus:ring-1 focus:ring-swapp-verde-oscuro dark:focus:ring-swapp-verde-menta transition-all"
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

				{/* Footer Estandarizado */}
				<div className="flex justify-end gap-3 pt-4 border-t border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo mt-2 p-6 shrink-0 transition-colors">
					<button
						type="button"
						onClick={onClose}
						disabled={isLoading}
						className="rounded-lg px-4 py-2 text-sm font-medium text-swapp-azul-petroleo hover:bg-red-500/10 hover:text-red-600 dark:text-swapp-tiza-verdoso dark:hover:bg-red-500/10 dark:hover:text-red-400 transition-colors">
						Volver
					</button>
					<button
						type="button"
						onClick={handleConfirm}
						disabled={isLoading}
						className={`flex items-center gap-2 rounded-lg px-6 py-2 text-sm font-medium text-swapp-blanco dark:text-swapp-azul-oscuro transition-colors disabled:opacity-50 shadow-sm ${
							isCancel
								? "bg-red-500 hover:bg-red-600 dark:bg-red-400 dark:text-swapp-negro dark:hover:bg-red-500"
								: "bg-swapp-verde-pastel dark:bg-swapp-verde-menta hover:bg-swapp-verde-oscuro dark:hover:bg-swapp-verde-pastel"
						}`}>
						{isLoading ? "Procesando..." : isCancel ? "Confirmar Baja" : "Rendir Pedido"}
					</button>
				</div>
			</div>
		</div>
	);
}