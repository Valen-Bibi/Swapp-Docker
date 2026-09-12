"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { X, Save, Loader2, UserPlus, Edit } from "lucide-react";
import { toast } from "sonner";
import { ClientService } from "@/services/client.service";

interface ClientModalProps {
	isOpen: boolean;
	onClose: () => void;
	client: any | null;
	onSuccess: () => void;
}

export default function ClientModal({
	isOpen,
	onClose,
	client,
	onSuccess,
}: ClientModalProps) {
	const {
		register,
		handleSubmit,
		reset,
		formState: { isSubmitting },
	} = useForm({
		defaultValues: {
			first_name: "",
			last_name: "",
			dni: "",
			whatsapp_number: "+54 9 ", // Fijamos el valor inicial
			email: "",
			default_delivery_address: "",
			default_delivery_zone: "",
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
		if (isOpen) {
			if (client) {
				reset({ ...client });
			} else {
				reset({
					first_name: "",
					last_name: "",
					dni: "",
					whatsapp_number: "+54 9 ", // Reiniciamos con el prefijo
					email: "",
					default_delivery_address: "",
					default_delivery_zone: "",
				});
			}
		}
	}, [client, isOpen, reset]);

	if (!isOpen) return null;

	const onSubmit = async (data: any) => {
		const toastId = toast.loading(
			client ? "Actualizando cliente..." : "Registrando cliente...",
		);
		try {
			const payload = {
				...data,
				dni: data.dni || null,
				email: data.email || null,
			};

			if (client) {
				await ClientService.update(client.client_uuid, payload);
				toast.success("Cliente actualizado correctamente", { id: toastId });
			} else {
				await ClientService.create(payload);
				toast.success("Cliente registrado correctamente", { id: toastId });
			}
			onSuccess();
			onClose();
		} catch (error: any) {
			// Manejo seguro de errores de validación de FastAPI (Pydantic)
			const errDetail = error.response?.data?.detail;
			const errorMessage = Array.isArray(errDetail)
				? errDetail.map((e: any) => e.msg).join(", ")
				: (errDetail || "Error al procesar el cliente");

			toast.error(errorMessage, { id: toastId });
		}
	};

	// --- LÓGICA DE FORMATEO DE TELÉFONO ---
	const { onChange: onPhoneChange, ...phoneRest } = register(
		"whatsapp_number",
		{ required: true },
	);

	const handlePhoneFormat = (e: React.ChangeEvent<HTMLInputElement>) => {
		let val = e.target.value;
		let numbers = val.replace(/\D/g, "");

		if (numbers.startsWith("549")) {
			numbers = numbers.substring(3);
		} else {
			numbers = "";
		}

		numbers = numbers.substring(0, 10);
		e.target.value = numbers.length > 0 ? `+54 9 ${numbers}` : "+54 9 ";
		onPhoneChange(e);
	};

	// CLASES EXACTAS DE SWAPP INPUT
	const inputBaseClass =
		"w-full rounded-md border border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo/50 px-3 py-2 text-sm text-swapp-azul-oscuro dark:text-swapp-blanco outline-none transition-all focus:border-swapp-verde-oscuro dark:focus:border-swapp-verde-menta focus:ring-1 focus:ring-swapp-verde-oscuro dark:focus:ring-swapp-verde-menta shadow-sm placeholder:text-swapp-azul-petroleo/40 dark:placeholder:text-swapp-tiza-verdoso/40";
	const labelBaseClass =
		"block text-xs font-bold uppercase tracking-wider text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70 mb-1.5 transition-colors";

	return (
		<div className="fixed inset-0 z-[100] flex items-center justify-center bg-swapp-azul-petroleo/5 dark:bg-swapp-negro/30 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95">
			<div className="w-full max-w-2xl rounded-xl bg-swapp-blanco/50 dark:bg-swapp-azul-oscuro/40 backdrop-blur-md shadow-2xl border-t-4 border-t-swapp-verde-oscuro dark:border-t-swapp-verde-menta overflow-hidden flex flex-col max-h-[90vh] transition-colors">
				{/* HEADER CLONADO */}
				<div className="p-6 border-b border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo flex items-center justify-between shrink-0 transition-colors">
					<h2 className="text-xl font-bold text-swapp-azul-oscuro dark:text-swapp-blanco flex items-center gap-2">
						{client ? (
							<Edit className="h-5 w-5 text-swapp-verde-oscuro dark:text-swapp-verde-menta" />
						) : (
							<UserPlus className="h-5 w-5 text-swapp-verde-oscuro dark:text-swapp-verde-menta" />
						)}
						{client ? "Editar Cliente" : "Nuevo Cliente"}
					</h2>
					<button
						type="button"
						onClick={onClose}
						disabled={isSubmitting}
						className="p-1 rounded-md text-swapp-azul-petroleo/50 dark:text-swapp-tiza-verdoso/50 hover:bg-red-500/10 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400 transition-colors">
						<X className="h-5 w-5" />
					</button>
				</div>

				{/* BODY CON CLASE TRANSPARENTE EN FORM */}
				<div className="p-6 overflow-y-auto custom-scrollbar">
					<form
						id="client-form"
						onSubmit={handleSubmit(onSubmit)}
						className="space-y-5 [&_input]:!bg-transparent">
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<div>
								<label className={labelBaseClass}>
									Nombre <span className="text-red-500">*</span>
								</label>
								<input
									type="text"
									className={inputBaseClass}
									{...register("first_name", { required: true })}
								/>
							</div>
							<div>
								<label className={labelBaseClass}>
									Apellido <span className="text-red-500">*</span>
								</label>
								<input
									type="text"
									className={inputBaseClass}
									{...register("last_name", { required: true })}
								/>
							</div>
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<div>
								<label className={labelBaseClass}>
									Número Celular <span className="text-red-500">*</span>
								</label>
								<input
									type="text"
									placeholder="Ej: 11 12345678"
									className={inputBaseClass}
									{...phoneRest}
									onChange={handlePhoneFormat}
								/>
							</div>
							<div>
								<label className={labelBaseClass}>DNI (Opcional)</label>
								<input
									type="text"
									className={inputBaseClass}
									{...register("dni")}
								/>
							</div>
						</div>

						<div>
							<label className={labelBaseClass}>
								Correo Electrónico (Opcional)
							</label>
							<input
								type="email"
								placeholder="Ej: juan@gmail.com"
								className={inputBaseClass}
								{...register("email")}
							/>
						</div>

						<div className="border-t border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo pt-5 mt-2 transition-colors space-y-5">
							<div>
								<label className={labelBaseClass}>
									Dirección de Entrega Predeterminada{" "}
									<span className="text-red-500">*</span>
								</label>
								<input
									type="text"
									placeholder="Ej: Barrio Cerrado..."
									className={inputBaseClass}
									{...register("default_delivery_address", { required: true })}
								/>
							</div>
							<div>
								<label className={labelBaseClass}>
									Zona / Localidad <span className="text-red-500">*</span>
								</label>
								<input
									type="text"
									placeholder="Ej: Villa Rosa, Pilar"
									className={inputBaseClass}
									{...register("default_delivery_zone", { required: true })}
								/>
							</div>
						</div>

						{/* FOOTER CLONADO */}
						<div className="flex justify-end gap-3 pt-4 border-t border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo mt-6 transition-colors">
							<button
								type="button"
								onClick={onClose}
								disabled={isSubmitting}
								className="rounded-lg px-4 py-2 text-sm font-medium text-swapp-azul-petroleo hover:bg-red-500/10 hover:text-red-600 dark:text-swapp-tiza-verdoso dark:hover:bg-red-500/10 dark:hover:text-red-400 transition-colors">
								Cancelar
							</button>
							<button
								type="submit"
								disabled={isSubmitting}
								className="flex items-center gap-2 rounded-lg bg-swapp-verde-pastel dark:bg-swapp-verde-menta px-6 py-2 text-sm font-medium text-swapp-blanco dark:text-swapp-azul-oscuro transition-colors hover:bg-swapp-verde-oscuro dark:hover:bg-swapp-verde-pastel disabled:opacity-50">
								{isSubmitting ? (
									<Loader2 className="h-4 w-4 animate-spin" />
								) : (
									<Save className="h-4 w-4" />
								)}
								{isSubmitting ? "Guardando..." : client ? "Guardar" : "Guardar"}
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
}
