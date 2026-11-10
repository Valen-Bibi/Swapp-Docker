"use client";

import React, { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
	X,
	Save,
	Loader2,
	UserPlus,
	Edit,
	Building2,
	User,
	MapPin,
	Plus,
	Trash2,
	Star,
} from "lucide-react";
import { toast } from "sonner";
import { ClientService } from "@/services/client.service";
import {
	clientSchema,
	ClientFormValues,
} from "@/lib/validations/client.schema";

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
		control,
		handleSubmit,
		reset,
		watch,
		setValue,
		formState: { isSubmitting, errors },
	} = useForm<ClientFormValues>({
		resolver: zodResolver(clientSchema),
		defaultValues: {
			client_type: "consumer",
			first_name: "",
			last_name: "",
			dni: "",
			company_name: "",
			cuit: "",
			whatsapp_number: "+54 9 ",
			email: "",
			addresses: [
				{
					address_line: "",
					has_street_number: true,
					province: "Buenos Aires",
					locality: "",
					zip_code: "",
					apartment_lot: "",
					is_default: true,
					notes: "",
				},
			],
		},
	});

	const {
		fields: addressFields,
		append: appendAddress,
		remove: removeAddress,
	} = useFieldArray({
		control,
		name: "addresses",
	});

	const currentClientType = watch("client_type");

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
				reset({
					...client,
					addresses:
						client.addresses && client.addresses.length > 0
							? client.addresses
							: [
									{
										address_line: client.default_delivery_address || "",
										has_street_number: true,
										province: "Buenos Aires",
										locality: client.default_delivery_zone || "",
										zip_code: "",
										apartment_lot: "",
										is_default: true,
										notes: "",
									},
								],
				});
			} else {
				reset({
					client_type: "consumer",
					first_name: "",
					last_name: "",
					dni: "",
					company_name: "",
					cuit: "",
					whatsapp_number: "+54 9 ",
					email: "",
					addresses: [
						{
							address_line: "",
							has_street_number: true,
							province: "Buenos Aires",
							locality: "",
							zip_code: "",
							apartment_lot: "",
							is_default: true,
							notes: "",
						},
					],
				});
			}
		}
	}, [client, isOpen, reset]);

	if (!isOpen) return null;

	const onSubmit = async (data: ClientFormValues) => {
		const toastId = toast.loading(
			client ? "Actualizando cliente..." : "Registrando cliente...",
		);
		try {
			// Normalización previa al envío
			const payload = {
				...data,
				dni: data.dni || null,
				email: data.email || null,
				cuit: data.cuit || null,
				company_name: data.company_name || null,
				first_name: data.first_name || null,
				last_name: data.last_name || null,
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
			const errDetail = error.response?.data?.detail;
			const errorMessage = Array.isArray(errDetail)
				? errDetail.map((e: any) => e.msg).join(", ")
				: errDetail || "Error al procesar el cliente";

			toast.error(errorMessage, { id: toastId });
		}
	};

	// --- LÓGICA DE FORMATEO DE TELÉFONO ---
	const { onChange: onPhoneChange, ...phoneRest } = register("whatsapp_number");

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

	const setAsDefault = (index: number) => {
		const addresses = watch("addresses");
		const updated = addresses.map((addr, i) => ({
			...addr,
			is_default: i === index,
		}));
		setValue("addresses", updated);
	};

	// CLASES ESTANDARIZADAS
	const inputBaseClass =
		"w-full rounded-md border border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo/50 bg-transparent px-3 py-2 text-sm text-swapp-azul-oscuro dark:text-swapp-blanco outline-none transition-all focus:border-swapp-verde-oscuro dark:focus:border-swapp-verde-menta focus:ring-1 focus:ring-swapp-verde-oscuro dark:focus:ring-swapp-verde-menta shadow-sm placeholder:text-swapp-azul-petroleo/40 dark:placeholder:text-swapp-tiza-verdoso/40 disabled:opacity-50";
	const labelBaseClass =
		"block text-xs font-bold uppercase tracking-wider text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70 mb-1.5 transition-colors";
	const errorTextClass = "text-red-500 text-[10px] font-bold mt-1";

	return (
		<div className="fixed inset-0 z-[100] flex items-center justify-center bg-swapp-azul-petroleo/5 dark:bg-swapp-negro/30 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95">
			<div className="w-full max-w-3xl rounded-xl bg-swapp-blanco/50 dark:bg-swapp-azul-oscuro/40 backdrop-blur-md shadow-2xl border-t-4 border-t-swapp-verde-oscuro dark:border-t-swapp-verde-menta overflow-hidden flex flex-col max-h-[95vh] transition-colors">
				{/* HEADER */}
				<div className="p-6 border-b border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 transition-colors relative">
					<h2 className="text-xl font-bold text-swapp-azul-oscuro dark:text-swapp-blanco flex items-center gap-2">
						{client ? (
							<Edit className="h-5 w-5 text-swapp-verde-oscuro dark:text-swapp-verde-menta" />
						) : (
							<UserPlus className="h-5 w-5 text-swapp-verde-oscuro dark:text-swapp-verde-menta" />
						)}
						{client ? "Editar Cliente" : "Nuevo Cliente"}
					</h2>

					<div className="flex items-center gap-2 bg-swapp-azul-petroleo/5 dark:bg-swapp-azul-petroleo/30 p-1 rounded-lg border border-swapp-azul-petroleo/10 dark:border-swapp-azul-petroleo/50 sm:mr-10">
						<button
							type="button"
							onClick={() => setValue("client_type", "consumer")}
							className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-bold transition-all ${currentClientType === "consumer" ? "bg-swapp-blanco dark:bg-swapp-azul-oscuro text-swapp-verde-oscuro dark:text-swapp-verde-menta shadow-sm" : "text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70 hover:bg-swapp-blanco/50 dark:hover:bg-swapp-azul-oscuro/50"}`}>
							<User className="h-3.5 w-3.5" /> Final
						</button>
						<button
							type="button"
							onClick={() => setValue("client_type", "business")}
							className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-bold transition-all ${currentClientType === "business" ? "bg-swapp-blanco dark:bg-swapp-azul-oscuro text-swapp-verde-oscuro dark:text-swapp-verde-menta shadow-sm" : "text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70 hover:bg-swapp-blanco/50 dark:hover:bg-swapp-azul-oscuro/50"}`}>
							<Building2 className="h-3.5 w-3.5" /> Empresa
						</button>
					</div>

					<button
						type="button"
						onClick={onClose}
						disabled={isSubmitting}
						className="absolute top-6 right-6 p-1 rounded-md text-swapp-azul-petroleo/50 dark:text-swapp-tiza-verdoso/50 hover:bg-red-500/10 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400 transition-colors">
						<X className="h-5 w-5" />
					</button>
				</div>

				{/* BODY */}
				<div className="p-6 overflow-y-auto custom-scrollbar">
					<form
						id="client-form"
						onSubmit={handleSubmit(onSubmit)}
						className="space-y-8">
						{/* SECCIÓN 1: DATOS FISCALES / PERSONALES */}
						<div className="space-y-5">
							<h3 className="text-sm font-bold text-swapp-verde-oscuro dark:text-swapp-verde-menta border-b border-swapp-verde-oscuro/10 dark:border-swapp-verde-menta/10 pb-2 flex items-center gap-2">
								{currentClientType === "business" ? (
									<Building2 className="h-4 w-4" />
								) : (
									<User className="h-4 w-4" />
								)}
								Datos de Facturación
							</h3>

							{currentClientType === "consumer" ? (
								<div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
									<div className="sm:col-span-5">
										<label className={labelBaseClass}>
											Nombre <span className="text-red-500">*</span>
										</label>
										<input
											type="text"
											className={inputBaseClass}
											{...register("first_name")}
										/>
										{errors.first_name && (
											<p className={errorTextClass}>
												{errors.first_name.message}
											</p>
										)}
									</div>
									<div className="sm:col-span-5">
										<label className={labelBaseClass}>
											Apellido <span className="text-red-500">*</span>
										</label>
										<input
											type="text"
											className={inputBaseClass}
											{...register("last_name")}
										/>
										{errors.last_name && (
											<p className={errorTextClass}>
												{errors.last_name.message}
											</p>
										)}
									</div>
									<div className="sm:col-span-2">
										<label className={labelBaseClass}>DNI</label>
										<input
											type="text"
											className={inputBaseClass}
											{...register("dni")}
										/>
									</div>
								</div>
							) : (
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
									<div>
										<label className={labelBaseClass}>
											Razón Social <span className="text-red-500">*</span>
										</label>
										<input
											type="text"
											className={inputBaseClass}
											{...register("company_name")}
										/>
										{errors.company_name && (
											<p className={errorTextClass}>
												{errors.company_name.message}
											</p>
										)}
									</div>
									<div>
										<label className={labelBaseClass}>
											CUIT <span className="text-red-500">*</span>
										</label>
										<input
											type="text"
											placeholder="Ej: 30-12345678-9"
											className={inputBaseClass}
											{...register("cuit")}
										/>
										{errors.cuit && (
											<p className={errorTextClass}>{errors.cuit.message}</p>
										)}
									</div>
								</div>
							)}
						</div>

						{/* SECCIÓN 2: CONTACTO (Común a ambos) */}
						<div className="space-y-5">
							<h3 className="text-sm font-bold text-swapp-verde-oscuro dark:text-swapp-verde-menta border-b border-swapp-verde-oscuro/10 dark:border-swapp-verde-menta/10 pb-2">
								Contacto de Logística
							</h3>

							{currentClientType === "business" && (
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
									<div>
										<label className={labelBaseClass}>
											Nombre del Contacto
										</label>
										<input
											type="text"
											placeholder="Encargado / Recepción"
											className={inputBaseClass}
											{...register("first_name")}
										/>
									</div>
									<div>
										<label className={labelBaseClass}>
											Apellido del Contacto
										</label>
										<input
											type="text"
											className={inputBaseClass}
											{...register("last_name")}
										/>
									</div>
								</div>
							)}

							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div>
									<label className={labelBaseClass}>WhatsApp (Opcional)</label>
									<input
										type="text"
										placeholder="Ej: 11 12345678"
										className={inputBaseClass}
										{...phoneRest}
										onChange={handlePhoneFormat}
									/>
									{errors.whatsapp_number && (
										<p className={errorTextClass}>
											{errors.whatsapp_number.message}
										</p>
									)}
								</div>
								<div>
									<label className={labelBaseClass}>Correo (Opcional)</label>
									<input
										type="email"
										placeholder="Ej: logistica@empresa.com"
										className={inputBaseClass}
										{...register("email")}
									/>
									{errors.email && (
										<p className={errorTextClass}>{errors.email.message}</p>
									)}
								</div>
							</div>
						</div>

						{/* SECCIÓN 3: DIRECCIONES MÚLTIPLES */}
						<div className="space-y-5">
							<div className="flex items-center justify-between border-b border-swapp-verde-oscuro/10 dark:border-swapp-verde-menta/10 pb-2">
								<h3 className="text-sm font-bold text-swapp-verde-oscuro dark:text-swapp-verde-menta flex items-center gap-2">
									<MapPin className="h-4 w-4" /> Libreta de Direcciones
								</h3>
								<button
									type="button"
									onClick={() =>
										appendAddress({
											address_line: "",
											has_street_number: true,
											province: "Buenos Aires",
											locality: "",
											zip_code: "",
											apartment_lot: "",
											is_default: addressFields.length === 0,
											notes: "",
										})
									}
									className="text-[10px] font-bold uppercase tracking-wider bg-swapp-verde-oscuro/10 text-swapp-verde-oscuro dark:bg-swapp-verde-menta/10 dark:text-swapp-verde-menta hover:bg-swapp-verde-oscuro hover:text-white px-2 py-1 rounded transition-colors flex items-center gap-1">
									<Plus className="h-3 w-3" /> Agregar
								</button>
							</div>

							{addressFields.map((field, index) => (
								<div
									key={field.id}
									className={`p-4 rounded-xl border relative transition-colors ${watch(`addresses.${index}.is_default`) ? "border-swapp-verde-oscuro/30 bg-swapp-verde-oscuro/5 dark:border-swapp-verde-menta/30 dark:bg-swapp-verde-menta/5" : "border-swapp-azul-petroleo/20 bg-swapp-blanco/20 dark:border-swapp-azul-petroleo/50 dark:bg-swapp-azul-oscuro/20"}`}>
									<div className="absolute -top-3 right-4 flex items-center gap-2">
										{!watch(`addresses.${index}.is_default`) && (
											<button
												type="button"
												onClick={() => setAsDefault(index)}
												className="text-[10px] font-bold uppercase bg-swapp-blanco dark:bg-swapp-azul-oscuro text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70 border border-swapp-azul-petroleo/20 px-2 py-0.5 rounded shadow-sm hover:text-swapp-verde-oscuro transition-colors">
												Hacer Principal
											</button>
										)}
										{watch(`addresses.${index}.is_default`) && (
											<span className="flex items-center gap-1 text-[10px] font-bold uppercase bg-swapp-verde-oscuro text-white dark:bg-swapp-verde-menta dark:text-swapp-azul-oscuro px-2 py-0.5 rounded shadow-sm">
												<Star className="h-3 w-3 fill-current" /> Principal
											</span>
										)}
										<button
											type="button"
											onClick={() => removeAddress(index)}
											disabled={addressFields.length === 1}
											className="p-1 bg-swapp-blanco dark:bg-swapp-azul-oscuro border border-swapp-azul-petroleo/20 rounded shadow-sm text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50">
											<Trash2 className="h-3.5 w-3.5" />
										</button>
									</div>

									<div className="grid grid-cols-1 sm:grid-cols-12 gap-4 mt-2">
										<div className="sm:col-span-8">
											<label className={labelBaseClass}>
												Calle y Número <span className="text-red-500">*</span>
											</label>
											<div className="flex items-center gap-2">
												<input
													type="text"
													placeholder="Ej: Las Magnolias 123"
													className={inputBaseClass}
													{...register(
														`addresses.${index}.address_line` as const,
													)}
												/>
												<label className="flex items-center gap-1.5 text-xs text-swapp-azul-petroleo/70 whitespace-nowrap cursor-pointer">
													<input
														type="checkbox"
														{...register(
															`addresses.${index}.has_street_number` as const,
														)}
														className="rounded border-swapp-azul-petroleo/30 text-swapp-verde-oscuro focus:ring-swapp-verde-oscuro bg-transparent"
													/>
													Tiene Nro.
												</label>
											</div>
											{errors.addresses?.[index]?.address_line && (
												<p className={errorTextClass}>
													{errors.addresses[index].address_line.message}
												</p>
											)}
										</div>
										<div className="sm:col-span-4">
											<label className={labelBaseClass}>Lote / Depto</label>
											<input
												type="text"
												placeholder="Ej: Lote 45, 2B"
												className={inputBaseClass}
												{...register(
													`addresses.${index}.apartment_lot` as const,
												)}
											/>
										</div>

										<div className="sm:col-span-4">
											<label className={labelBaseClass}>Provincia</label>
											<input
												type="text"
												className={inputBaseClass}
												{...register(`addresses.${index}.province` as const)}
											/>
										</div>
										<div className="sm:col-span-5">
											<label className={labelBaseClass}>
												Localidad / Barrio{" "}
												<span className="text-red-500">*</span>
											</label>
											<input
												type="text"
												placeholder="Ej: Pilar"
												className={inputBaseClass}
												{...register(`addresses.${index}.locality` as const)}
											/>
											{errors.addresses?.[index]?.locality && (
												<p className={errorTextClass}>
													{errors.addresses[index].locality.message}
												</p>
											)}
										</div>
										<div className="sm:col-span-3">
											<label className={labelBaseClass}>CP</label>
											<input
												type="text"
												placeholder="1629"
												className={inputBaseClass}
												{...register(`addresses.${index}.zip_code` as const)}
											/>
										</div>
									</div>
								</div>
							))}
							{errors.addresses?.root && (
								<p className={errorTextClass}>
									{errors.addresses.root.message}
								</p>
							)}
						</div>
					</form>
				</div>

				{/* FOOTER */}
				<div className="flex justify-end gap-3 p-6 border-t border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo shrink-0 transition-colors">
					<button
						type="button"
						onClick={onClose}
						disabled={isSubmitting}
						className="rounded-lg px-4 py-2 text-sm font-medium text-swapp-azul-petroleo hover:bg-red-500/10 hover:text-red-600 dark:text-swapp-tiza-verdoso dark:hover:bg-red-500/10 dark:hover:text-red-400 transition-colors">
						Cancelar
					</button>
					<button
						type="submit"
						form="client-form"
						disabled={isSubmitting}
						className="flex items-center gap-2 rounded-lg bg-swapp-verde-pastel dark:bg-swapp-verde-menta px-6 py-2 text-sm font-medium text-swapp-blanco dark:text-swapp-azul-oscuro transition-colors hover:bg-swapp-verde-oscuro dark:hover:bg-swapp-verde-pastel disabled:opacity-50">
						{isSubmitting ? (
							<Loader2 className="h-4 w-4 animate-spin" />
						) : (
							<Save className="h-4 w-4" />
						)}
						{isSubmitting ? "Guardando..." : "Guardar Cliente"}
					</button>
				</div>
			</div>
		</div>
	);
}
