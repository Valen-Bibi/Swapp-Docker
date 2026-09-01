"use client";

import React from "react";
import { AlertTriangle, CheckCircle2, X } from "lucide-react";

interface ConfirmOrderModalProps {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: () => void;
	actionType: "complete" | "cancel" | null;
	isLoading: boolean;
}

export default function ConfirmOrderModal({
	isOpen,
	onClose,
	onConfirm,
	actionType,
	isLoading,
}: ConfirmOrderModalProps) {
	if (!isOpen || !actionType) return null;

	const isCancel = actionType === "cancel";
	const title = isCancel ? "Cancelar Pedido" : "Completar Pedido";
	const description = isCancel
		? "¿Estás seguro de que deseas cancelar este pedido? Se liberará el stock reservado de los productos y volverá al inventario general."
		: "¿Confirmas que el repartidor entregó este pedido y recolectó los retornos correspondientes?";

	return (
		<div className="fixed inset-0 z-[999] flex items-center justify-center bg-swapp-negro/50 dark:bg-swapp-negro/70 backdrop-blur-sm p-4 animate-in fade-in">
			<div className="w-full max-w-md rounded-xl bg-swapp-blanco dark:bg-swapp-azul-oscuro p-6 shadow-2xl border-t-4 border-swapp-verde-oscuro dark:border-swapp-verde-menta relative">
				<button
					onClick={onClose}
					disabled={isLoading}
					className="absolute top-4 right-4 text-swapp-azul-petroleo/50 hover:text-swapp-azul-oscuro dark:text-swapp-tiza-verdoso/50 dark:hover:text-swapp-blanco transition-colors">
					<X className="h-5 w-5" />
				</button>

				<div className="flex flex-col items-center text-center gap-4 mt-2">
					<div
						className={`p-4 rounded-full ${isCancel ? "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400" : "bg-swapp-verde-pastel/20 text-swapp-verde-oscuro dark:bg-swapp-verde-menta/20 dark:text-swapp-verde-menta"}`}>
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

					<div className="flex w-full gap-3 mt-4">
						<button
							onClick={onClose}
							disabled={isLoading}
							className="flex-1 rounded-lg border border-swapp-tiza-verdoso dark:border-swapp-azul-petroleo px-4 py-2 text-sm font-semibold text-swapp-azul-petroleo dark:text-swapp-tiza-verdoso hover:bg-swapp-tiza-verdoso dark:hover:bg-swapp-azul-petroleo transition-colors">
							Volver
						</button>
						<button
							onClick={onConfirm}
							disabled={isLoading}
							className={`flex-1 rounded-lg px-4 py-2 text-sm font-bold text-swapp-blanco transition-colors ${
								isCancel
									? "bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
									: "bg-swapp-verde-oscuro hover:bg-swapp-azul-oceano dark:bg-swapp-verde-menta dark:text-swapp-azul-oscuro dark:hover:bg-swapp-verde-pastel"
							}`}>
							{isLoading ? "Procesando..." : "Confirmar"}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
