"use client";

import React, { useEffect, useState } from "react";
import { useFormContext, Controller } from "react-hook-form";
import { User, MapPin, Calendar, FileText } from "lucide-react";
import { ClientService } from "@/services/client.service";
import { Client } from "@/types/client";

export default function CustomerSection() {
	const {
		register,
		control,
		setValue,
		formState: { errors },
	} = useFormContext();

	const [clients, setClients] = useState<Client[]>([]);

	// Cargamos los clientes activos para el dropdown
	useEffect(() => {
		const loadClients = async () => {
			try {
				const data = await ClientService.getAll("", true); // Solo clientes activos
				setClients(data);
			} catch (error) {
				console.error("Error al cargar los clientes", error);
			}
		};
		loadClients();
	}, []);

	// Helper para renderizar errores de Zod
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
			{/* Bloque 1: Selección del Cliente (CRM) */}
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

									// Autocompletado Mágico de Dirección
									const selectedClient = clients.find(
										(c) => c.client_id === selectedId,
									);
									if (selectedClient) {
										setValue(
											"delivery_address",
											selectedClient.default_delivery_address,
											{ shouldValidate: true },
										);
										setValue(
											"delivery_zone",
											selectedClient.default_delivery_zone,
											{ shouldValidate: true },
										);
									}
								}}>
								<option value={0} disabled>
									-- Seleccione un cliente del CRM --
								</option>
								{clients.map((c) => (
									<option key={c.client_uuid} value={c.client_id}>
										{c.first_name} {c.last_name} ({c.whatsapp_number})
									</option>
								))}
							</select>
						)}
					/>
					{renderError("client_id")}
				</div>
			</div>

			{/* Bloque 2: Logística de Entrega */}
			<div>
				<h3 className="text-lg font-bold text-swapp-azul-oscuro dark:text-swapp-blanco border-b border-swapp-azul-petroleo/10 dark:border-swapp-azul-petroleo/50 pb-3 mb-5 flex items-center gap-2">
					<MapPin className="h-5 w-5 text-swapp-verde-oscuro dark:text-swapp-verde-menta" />
					Logística de Entrega
				</h3>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div className="flex flex-col md:col-span-2">
						<label className={labelBaseClass}>Dirección de Entrega *</label>
						<input
							type="text"
							placeholder="Calle Falsa 123, Puerta 4"
							className={inputBaseClass}
							{...register("delivery_address")}
						/>
						{renderError("delivery_address")}
					</div>

					<div className="flex flex-col">
						<label className={labelBaseClass}>Zona / Localidad</label>
						<input
							type="text"
							placeholder="Ej: Villa Rosa"
							className={inputBaseClass}
							{...register("delivery_zone")}
						/>
						{renderError("delivery_zone")}
					</div>

					<div className="flex flex-col">
						<label className={labelBaseClass}>
							<Calendar className="h-4 w-4 text-swapp-verde-oscuro dark:text-swapp-verde-menta" />
							Fecha Programada (Opcional)
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
							placeholder="Ej: Tocar timbre fuerte, dejar en portería..."
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
