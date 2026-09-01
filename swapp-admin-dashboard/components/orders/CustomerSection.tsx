"use client";

import React from "react";
import { useFormContext } from "react-hook-form";
import {
	User,
	Phone,
	Mail,
	MapPin,
	Map,
	Calendar,
	FileText,
} from "lucide-react";

export default function CustomerSection() {
	// Consumimos el contexto global del formulario
	const {
		register,
		formState: { errors },
	} = useFormContext();

	// Función helper para renderizar los errores de validación de Zod
	const renderError = (field: string) => {
		const error = errors[field]?.message as string;
		return error ? (
			<span className="text-red-500 text-xs mt-1 font-medium">{error}</span>
		) : null;
	};

	const inputBaseClass =
		"w-full rounded-md border border-swapp-tiza-verdoso dark:border-swapp-azul-petroleo bg-swapp-blanco dark:bg-swapp-azul-oscuro px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-swapp-verde-oscuro dark:focus:ring-swapp-verde-menta transition-all placeholder:text-swapp-azul-petroleo/40 dark:placeholder:text-swapp-tiza-verdoso/40";

	const labelBaseClass =
		"text-sm font-semibold text-swapp-azul-oscuro dark:text-swapp-blanco mb-1.5 flex items-center gap-2";

	return (
		<div className="flex flex-col gap-6">
			<h3 className="text-lg font-bold text-swapp-azul-oscuro dark:text-swapp-blanco border-b border-swapp-tiza-verdoso dark:border-swapp-azul-petroleo pb-2">
				Datos del Cliente y Entrega
			</h3>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				{/* Nombre */}
				<div className="flex flex-col">
					<label className={labelBaseClass}>
						<User className="h-4 w-4 text-swapp-verde-oscuro dark:text-swapp-verde-menta" />
						Nombre del Cliente *
					</label>
					<input
						type="text"
						placeholder="Ej: Juan Pérez"
						className={inputBaseClass}
						{...register("customer_name")}
					/>
					{renderError("customer_name")}
				</div>

				{/* Teléfono */}
				<div className="flex flex-col">
					<label className={labelBaseClass}>
						<Phone className="h-4 w-4 text-swapp-verde-oscuro dark:text-swapp-verde-menta" />
						Teléfono (WhatsApp) *
					</label>
					<input
						type="text"
						placeholder="Ej: +54 9 11 1234-5678"
						className={inputBaseClass}
						{...register("customer_phone")}
					/>
					{renderError("customer_phone")}
				</div>

				{/* Email */}
				<div className="flex flex-col">
					<label className={labelBaseClass}>
						<Mail className="h-4 w-4 text-swapp-verde-oscuro dark:text-swapp-verde-menta" />
						Correo Electrónico
					</label>
					<input
						type="email"
						placeholder="Ej: juan@example.com (Opcional)"
						className={inputBaseClass}
						{...register("customer_email")}
					/>
					{renderError("customer_email")}
				</div>

				{/* Fecha Programada */}
				<div className="flex flex-col">
					<label className={labelBaseClass}>
						<Calendar className="h-4 w-4 text-swapp-verde-oscuro dark:text-swapp-verde-menta" />
						Fecha y Hora de Entrega Programada
					</label>
					<input
						type="datetime-local"
						className={inputBaseClass}
						{...register("scheduled_delivery_date")}
					/>
					{renderError("scheduled_delivery_date")}
				</div>

				{/* Dirección (Ocupa 2 columnas en pantallas grandes) */}
				<div className="flex flex-col md:col-span-2">
					<label className={labelBaseClass}>
						<MapPin className="h-4 w-4 text-swapp-verde-oscuro dark:text-swapp-verde-menta" />
						Dirección de Entrega *
					</label>
					<input
						type="text"
						placeholder="Calle Falsa 123, Puerta 4"
						className={inputBaseClass}
						{...register("delivery_address")}
					/>
					{renderError("delivery_address")}
				</div>

				{/* Zona */}
				<div className="flex flex-col">
					<label className={labelBaseClass}>
						<Map className="h-4 w-4 text-swapp-verde-oscuro dark:text-swapp-verde-menta" />
						Zona / Localidad
					</label>
					<input
						type="text"
						placeholder="Ej: Villa Rosa"
						className={inputBaseClass}
						{...register("delivery_zone")}
					/>
					{renderError("delivery_zone")}
				</div>

				{/* Notas de Logística */}
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
	);
}
