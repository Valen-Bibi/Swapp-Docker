"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { X, Save, Loader2 } from "lucide-react";
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
			toast.error(
				error.response?.data?.detail || "Error al actualizar el pedido",
				{ id: toastId },
			);
		}
	};

	const inputBaseClass =
		"w-full rounded-md border border-swapp-tiza-verdoso dark:border-swapp-azul-petroleo bg-swapp-blanco dark:bg-swapp-azul-oscuro px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-swapp-verde-oscuro dark:focus:ring-swapp-verde-menta transition-all placeholder:text-swapp-azul-petroleo/40 dark:placeholder:text-swapp-tiza-verdoso/40";
	const labelBaseClass =
		"text-xs font-bold uppercase tracking-wider text-swapp-azul-oscuro dark:text-swapp-blanco mb-1.5 block";

	return (
		<div className="fixed inset-0 z-[999] flex items-center justify-center bg-swapp-negro/50 dark:bg-swapp-negro/70 backdrop-blur-sm p-4 animate-in fade-in">
			<div className="w-full max-w-lg rounded-xl bg-swapp-blanco dark:bg-swapp-azul-oscuro shadow-2xl border-t-4 border-swapp-verde-oscuro dark:border-swapp-verde-menta relative flex flex-col max-h-[90vh]">
				{/* Header */}
				<div className="flex items-center justify-between p-6 border-b border-swapp-tiza-verdoso dark:border-swapp-azul-petroleo shrink-0">
					<div>
						<h3 className="text-lg font-bold text-swapp-azul-oscuro dark:text-swapp-blanco">
							Editar Logística del Pedido
						</h3>
						{/* ACTUALIZADO: Leyendo datos desde el objeto Client */}
						<p className="text-xs font-medium text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70 mt-1">
							{order.client?.first_name} {order.client?.last_name} •{" "}
							{order.client?.whatsapp_number}
						</p>
					</div>
					<button
						onClick={onClose}
						disabled={isSubmitting}
						className="text-swapp-azul-petroleo/50 hover:text-swapp-azul-oscuro dark:text-swapp-tiza-verdoso/50 dark:hover:text-swapp-blanco transition-colors">
						<X className="h-5 w-5" />
					</button>
				</div>

				{/* Body */}
				<div className="p-6 overflow-y-auto">
					<form
						id="edit-order-form"
						onSubmit={handleSubmit(onSubmit)}
						className="flex flex-col gap-4">
						<div>
							<label className={labelBaseClass}>Dirección de Entrega *</label>
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

						<div>
							<label className={labelBaseClass}>Notas para el Repartidor</label>
							<textarea
								rows={3}
								{...register("logistics_notes")}
								className={`${inputBaseClass} resize-none`}
							/>
						</div>
					</form>
				</div>

				{/* Footer */}
				<div className="p-6 border-t border-swapp-tiza-verdoso dark:border-swapp-azul-petroleo bg-swapp-tiza-verdoso/20 dark:bg-black/10 flex justify-end gap-3 shrink-0 rounded-b-xl">
					<button
						type="button"
						onClick={onClose}
						disabled={isSubmitting}
						className="rounded-lg border border-swapp-tiza-verdoso dark:border-swapp-azul-petroleo px-4 py-2 text-sm font-semibold text-swapp-azul-petroleo dark:text-swapp-tiza-verdoso hover:bg-swapp-tiza-verdoso dark:hover:bg-swapp-azul-petroleo transition-colors">
						Cancelar
					</button>
					<button
						type="submit"
						form="edit-order-form"
						disabled={isSubmitting}
						className="inline-flex items-center justify-center gap-2 rounded-lg bg-swapp-verde-oscuro dark:bg-swapp-verde-menta px-6 py-2 text-sm font-bold text-swapp-blanco dark:text-swapp-azul-oscuro hover:bg-swapp-azul-oceano dark:hover:bg-swapp-verde-pastel transition-colors disabled:opacity-50">
						{isSubmitting ? (
							<>
								<Loader2 className="h-4 w-4 animate-spin" />
								Guardando...
							</>
						) : (
							<>
								<Save className="h-4 w-4" />
								Guardar Cambios
							</>
						)}
					</button>
				</div>
			</div>
		</div>
	);
}
