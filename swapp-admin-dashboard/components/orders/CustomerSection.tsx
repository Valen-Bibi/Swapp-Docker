"use client";

import React, { useEffect, useState } from "react";
import { useFormContext, Controller } from "react-hook-form";
import { User, MapPin, Calendar, FileText, PlusCircle } from "lucide-react";
import { ClientService } from "@/services/client.service";
import { Client } from "@/types/client";

const getCurrentLocalDatetime = () => {
	const now = new Date();
	const offsetMs = now.getTimezoneOffset() * 60000;
	return new Date(now.getTime() - offsetMs).toISOString().slice(0, 16);
};

export default function CustomerSection() {
	const {
		register,
		control,
		setValue,
		watch,
		formState: { errors },
	} = useFormContext();

	const [clients, setClients] = useState<Client[]>([]);
	const selectedClientId = watch("client_id");

	// Cargamos los clientes activos
	useEffect(() => {
		const loadClients = async () => {
			try {
				const data = await ClientService.getAll("", true);
				setClients(data);
			} catch (error) {
				console.error("Error al cargar los clientes", error);
			}
		};
		loadClients();
	}, []);

	const selectedClient = clients.find((c) => c.client_id === selectedClientId);

	// Helper para errores Zod
	const renderError = (field: string) => {
		const error = errors[field]?.message as string;
		return error ? (
			<span className="text-red-500 text-xs mt-1.5 font-bold">{error}</span>
		) : null;
	};

	const inputBaseClass =
		"w-full rounded-xl border border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo bg-swapp-blanco/50 dark:bg-swapp-azul-oscuro/40 backdrop-blur-md px-4 py-2.5 text-sm text-swapp-azul-oscuro dark:text-swapp-tiza-verdoso outline-none focus:ring-1 focus:ring-swapp-verde-oscuro dark:focus:ring-swapp-verde-menta transition-all disabled:opacity-50 shadow-sm placeholder:text-swapp-azul-petroleo/40 dark:placeholder:text-swapp-tiza-verdoso/30";

	const labelBaseClass =
		"text-xs font-bold text-swapp-azul-oscuro dark:text-swapp-blanco mb-2 flex items-center gap-2 uppercase tracking-wider";

	return (
		<div className="flex flex-col gap-8">
			{/* Bloque 1: Selección del Cliente */}
			<div>
				<h3 className="text-lg font-bold text-swapp-azul-oscuro dark:text-swapp-blanco border-b border-swapp-azul-petroleo/10 dark:border-swapp-azul-petroleo/50 pb-3 mb-5 flex items-center gap-2">
					<User className="h-5 w-5 text-swapp-verde-oscuro dark:text-swapp-verde-menta" />
					Datos del Cliente
				</h3>

				<div className="w-full md:w-1/2 flex flex-col">
					<label className={labelBaseClass}>Cliente Registrado *</label>
					<Controller
						control={control}
						name="client_id"
						render={({ field }) => (
							<select
								className={inputBaseClass}
								value={field.value || 0}
								onChange={(e) => {
									const selectedId = parseInt(e.target.value);
									field.onChange(selectedId);

									// Autocompletado del array de direcciones (Seleccionamos la default)
									const client = clients.find(
										(c) => c.client_id === selectedId,
									);
									if (
										client &&
										client.addresses &&
										client.addresses.length > 0
									) {
										const defaultAddr =
											client.addresses.find((a) => a.is_default) ||
											client.addresses[0];
										const fullZone = [
											defaultAddr.locality,
											defaultAddr.province,
										]
											.filter(Boolean)
											.join(", ");

										setValue("delivery_address", defaultAddr.address_line, {
											shouldValidate: true,
										});
										setValue("delivery_zone", fullZone, {
											shouldValidate: true,
										});

										if (defaultAddr.notes) {
											setValue("logistics_notes", defaultAddr.notes);
										}
									}
								}}>
								<option value={0} disabled>
									-- Seleccione un cliente del CRM --
								</option>
								{clients.map((c) => (
									<option key={c.client_uuid} value={c.client_id}>
										{c.client_type === "business"
											? c.company_name
											: `${c.first_name} ${c.last_name}`}
										{c.whatsapp_number ? ` (${c.whatsapp_number})` : ""}
									</option>
								))}
							</select>
						)}
					/>
					{renderError("client_id")}
				</div>
			</div>

			{/* Bloque 2: Logística de Entrega (Múltiples Direcciones) */}
			<div>
				<h3 className="text-lg font-bold text-swapp-azul-oscuro dark:text-swapp-blanco border-b border-swapp-azul-petroleo/10 dark:border-swapp-azul-petroleo/50 pb-3 mb-5 flex items-center gap-2">
					<MapPin className="h-5 w-5 text-swapp-verde-oscuro dark:text-swapp-verde-menta" />
					Logística y Fechas
				</h3>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					{/* Nuevo Selector Dinámico de Direcciones */}
					<div className="flex flex-col md:col-span-2 bg-swapp-verde-oscuro/5 dark:bg-swapp-verde-menta/5 border border-swapp-verde-oscuro/20 dark:border-swapp-verde-menta/20 p-4 rounded-xl">
						<label className={labelBaseClass}>Dirección de la Libreta</label>
						<select
							className={`${inputBaseClass} !bg-white dark:!bg-swapp-azul-oscuro mb-4`}
							disabled={!selectedClient || !selectedClient.addresses?.length}
							onChange={(e) => {
								if (!selectedClient || !selectedClient.addresses) return;
								const addr = selectedClient.addresses.find(
									(a) => a.address_id === parseInt(e.target.value),
								);
								if (addr) {
									const fullZone = [addr.locality, addr.province]
										.filter(Boolean)
										.join(", ");
									setValue("delivery_address", addr.address_line, {
										shouldValidate: true,
									});
									setValue("delivery_zone", fullZone, { shouldValidate: true });
									setValue("logistics_notes", addr.notes || "");
								}
							}}>
							<option value="">Selecciona o edita manualmente debajo...</option>
							{selectedClient?.addresses?.map((addr) => (
								<option key={addr.address_id} value={addr.address_id}>
									{addr.address_line} ({addr.locality}){" "}
									{addr.is_default ? "⭐ Principal" : ""}
								</option>
							))}
						</select>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="flex flex-col">
								<label className="text-[10px] font-bold uppercase text-swapp-azul-petroleo/60 dark:text-swapp-tiza-verdoso/60 mb-1">
									Calle y Número <span className="text-red-500">*</span>
								</label>
								<input
									type="text"
									className={`${inputBaseClass} !bg-white dark:!bg-swapp-azul-oscuro`}
									{...register("delivery_address")}
								/>
								{renderError("delivery_address")}
							</div>

							<div className="flex flex-col">
								<label className="text-[10px] font-bold uppercase text-swapp-azul-petroleo/60 dark:text-swapp-tiza-verdoso/60 mb-1">
									Localidad, Provincia
								</label>
								<input
									type="text"
									className={`${inputBaseClass} !bg-white dark:!bg-swapp-azul-oscuro`}
									{...register("delivery_zone")}
								/>
								{renderError("delivery_zone")}
							</div>
						</div>
					</div>

					<div className="flex flex-col">
						<label className={labelBaseClass}>
							<Calendar className="h-4 w-4 text-swapp-verde-oscuro dark:text-swapp-verde-menta" />
							Fecha del Pedido *
						</label>
						<input
							type="datetime-local"
							className={inputBaseClass}
							{...register("order_date")}
						/>
						{renderError("order_date")}
					</div>

					<div className="flex flex-col">
						<label className={labelBaseClass}>
							<Calendar className="h-4 w-4 text-swapp-verde-oscuro dark:text-swapp-verde-menta" />
							Entrega Programada (Opcional)
						</label>
						<input
							type="datetime-local"
							className={inputBaseClass}
							{...register("scheduled_delivery_date")}
						/>
						{renderError("scheduled_delivery_date")}
					</div>

					<div className="flex flex-col md:col-span-2">
						<label className={labelBaseClass}>
							<FileText className="h-4 w-4 text-swapp-verde-oscuro dark:text-swapp-verde-menta" />
							Notas para el Repartidor
						</label>
						<textarea
							rows={2}
							className={`${inputBaseClass} resize-none`}
							{...register("logistics_notes")}
						/>
						{renderError("logistics_notes")}
					</div>
				</div>
			</div>
		</div>
	);
}
