"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { X, Save, Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";
import { OrderService } from "@/services/order.service";

interface EditOrderModalProps {
	isOpen: boolean;
	onClose: () => void;
	order: any | null;
	onSuccess: () => void;
}

export default function EditOrderModal({
	isOpen,
	onClose,
	order,
	onSuccess,
}: EditOrderModalProps) {
	const {
		register,
		handleSubmit,
		reset,
		formState: { isSubmitting },
	} = useForm({
		defaultValues: {
			delivery_address: "",
			delivery_zone: "",
			scheduled_delivery_date: "",
			logistics_notes: "",
		},
	});

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
		if (order && isOpen) {
			reset({
				delivery_address: order.delivery_address || "",
				delivery_zone: order.delivery_zone || "",
				scheduled_delivery_date: order.scheduled_delivery_date
					? new Date(order.scheduled_delivery_date).toISOString().slice(0, 16)
					: "",
				logistics_notes: order.logistics_notes || "",
			});
		}
	}, [order, isOpen, reset]);

	if (!isOpen || !order) return null;

	const onSubmit = async (data: any) => {
		const toastId = toast.loading("Actualizando pedido...");
		try {
			const payload = {
				...data,
				delivery_zone: data.delivery_zone || null,
				scheduled_delivery_date: data.scheduled_delivery_date
					? new Date(data.scheduled_delivery_date).toISOString()
					: null,
				logistics_notes: data.logistics_notes || null,
			};

			await OrderService.updateOrder(order.order_uuid, payload);
			toast.success("Pedido actualizado correctamente", { id: toastId });
			onSuccess();
			onClose();
		} catch (error: any) {
			// PARCHE ANTI-PYDANTIC
			const errDetail = error.response?.data?.detail;
			const errorMessage = Array.isArray(errDetail)
				? errDetail.map((e: any) => e.msg).join(", ")
				: (errDetail || "Error al actualizar el pedido");

			toast.error(errorMessage, { id: toastId });
		}
	};

	// CLASES ESTANDARIZADAS GLASSMORPHISM
	const inputBaseClass =
		"w-full rounded-md border border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo/50 bg-transparent px-3 py-2 text-sm text-swapp-azul-oscuro dark:text-swapp-blanco outline-none transition-all focus:border-swapp-verde-oscuro dark:focus:border-swapp-verde-menta focus:ring-1 focus:ring-swapp-verde-oscuro dark:focus:ring-swapp-verde-menta shadow-sm placeholder:text-swapp-azul-petroleo/40 dark:placeholder:text-swapp-tiza-verdoso/40";
	const labelBaseClass =
		"block text-xs font-bold uppercase tracking-wider text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70 mb-1.5 transition-colors";

	return (
		<div className="fixed inset-0 z-[100] flex items-center justify-center bg-swapp-azul-petroleo/5 dark:bg-swapp-negro/30 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95">
			<div className="w-full max-w-lg rounded-xl bg-swapp-blanco/50 dark:bg-swapp-azul-oscuro/40 backdrop-blur-md shadow-2xl border-t-4 border-t-swapp-verde-oscuro dark:border-t-swapp-verde-menta overflow-hidden flex flex-col max-h-[90vh] transition-colors">
				{/* Header */}
				<div className="p-6 border-b border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo flex items-start justify-between shrink-0 transition-colors">
					<div>
						<h2 className="text-xl font-bold text-swapp-azul-oscuro dark:text-swapp-blanco flex items-center gap-2">
							<MapPin className="h-5 w-5 text-swapp-verde-oscuro dark:text-swapp-verde-menta" />
							Editar Logística
						</h2>
						<p className="text-xs font-medium text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70 mt-1 pl-7 transition-colors">
							{order.client?.first_name} {order.client?.last_name} •{" "}
							{order.client?.whatsapp_number}
						</p>
					</div>
					<button
						onClick={onClose}
						disabled={isSubmitting}
						className="p-1 rounded-md text-swapp-azul-petroleo/50 dark:text-swapp-tiza-verdoso/50 hover:bg-red-500/10 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400 transition-colors">
						<X className="h-5 w-5" />
					</button>
				</div>

				{/* Body */}
				<div className="p-6 overflow-y-auto custom-scrollbar">
					<form
						id="edit-order-form"
						onSubmit={handleSubmit(onSubmit)}
						className="flex flex-col gap-5 [&_input]:!bg-transparent [&_textarea]:!bg-transparent">
						
						<div>
							<label className={labelBaseClass}>Dirección de Entrega <span className="text-red-500">*</span></label>
							<input
								type="text"
								{...register("delivery_address", { required: true })}
								className={inputBaseClass}
							/>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div>
								<label className={labelBaseClass}>Zona / Localidad</label>
								<input
									type="text"
									{...register("delivery_zone")}
									className={inputBaseClass}
								/>
							</div>

							<div>
								<label className={labelBaseClass}>Fecha y Hora</label>
								<input
									type="datetime-local"
									{...register("scheduled_delivery_date")}
									className={inputBaseClass}
								/>
							</div>
						</div>

						<div className="border-t border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo pt-5 transition-colors">
							<label className={labelBaseClass}>Notas para el Repartidor</label>
							<textarea
								rows={3}
								{...register("logistics_notes")}
								className={`${inputBaseClass} resize-none`}
							/>
						</div>
					</form>
				</div>

				{/* Footer integrado */}
				<div className="flex justify-end gap-3 pt-4 border-t border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo mt-2 p-6 shrink-0 transition-colors">
					<button
						type="button"
						onClick={onClose}
						disabled={isSubmitting}
						className="rounded-lg px-4 py-2 text-sm font-medium text-swapp-azul-petroleo hover:bg-red-500/10 hover:text-red-600 dark:text-swapp-tiza-verdoso dark:hover:bg-red-500/10 dark:hover:text-red-400 transition-colors">
						Cancelar
					</button>
					<button
						type="submit"
						form="edit-order-form"
						disabled={isSubmitting}
						className="flex items-center gap-2 rounded-lg bg-swapp-verde-pastel dark:bg-swapp-verde-menta px-6 py-2 text-sm font-medium text-swapp-blanco dark:text-swapp-azul-oscuro transition-colors hover:bg-swapp-verde-oscuro dark:hover:bg-swapp-verde-pastel disabled:opacity-50">
						{isSubmitting ? (
							<Loader2 className="h-4 w-4 animate-spin" />
						) : (
							<Save className="h-4 w-4" />
						)}
						{isSubmitting ? "Guardando..." : "Guardar Cambios"}
					</button>
				</div>
			</div>
		</div>
	);
}