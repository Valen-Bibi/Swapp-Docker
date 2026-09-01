"use client";

import React, { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { Save, Loader2 } from "lucide-react";
import CustomerSection from "./CustomerSection";
import OrderItemsList from "./OrderItemsList";
import { formatCurrency } from "@/lib/utils";

export default function OrderForm() {
	const {
		watch,
		setValue,
		formState: { isSubmitting },
	} = useFormContext();

	// 1. Observamos todos los ítems dinámicamente desde el padre
	const items = watch("items") || [];

	// 2. Calculamos el total al vuelo en cada renderizado de la interfaz
	const totalAmount = items.reduce(
		(acc: number, item: any) => acc + (Number(item.subtotal) || 0),
		0,
	);

	// 3. Inyectamos silenciosamente el total en el estado del formulario
	// para que el submit y la validación de Zod funcionen perfecto.
	useEffect(() => {
		setValue("total_amount", totalAmount, {
			shouldValidate: true, // Avisa a Zod que re-evalúe
			shouldDirty: true,
		});
	}, [totalAmount, setValue]);

	return (
		<div className="flex flex-col gap-8">
			{/* Sección 1: Cabecera del Cliente */}
			<CustomerSection />

			<hr className="border-swapp-tiza-verdoso dark:border-swapp-azul-petroleo" />

			{/* Sección 2: Productos y Logística Inversa */}
			<OrderItemsList />

			{/* Footer: Totales y Botón Submit */}
			<div className="sticky bottom-0 mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-swapp-tiza-verdoso dark:border-swapp-azul-petroleo bg-swapp-tiza-verdoso/30 dark:bg-swapp-azul-petroleo/30 p-4 backdrop-blur-sm">
				<div className="flex flex-col">
					<span className="text-sm font-medium text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70">
						Total a Cobrar
					</span>
					<span className="text-2xl font-bold text-swapp-verde-oscuro dark:text-swapp-verde-menta">
						{formatCurrency(totalAmount)}
					</span>
				</div>

				<button
					type="submit"
					disabled={isSubmitting || totalAmount === 0}
					className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg bg-swapp-verde-oscuro dark:bg-swapp-verde-menta px-6 py-3 text-sm font-bold text-swapp-blanco dark:text-swapp-azul-oscuro hover:bg-swapp-azul-oceano dark:hover:bg-swapp-verde-pastel transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg">
					{isSubmitting ? (
						<>
							<Loader2 className="h-4 w-4 animate-spin" />
							Procesando...
						</>
					) : (
						<>
							<Save className="h-4 w-4" />
							Registrar Pedido
						</>
					)}
				</button>
			</div>
		</div>
	);
}
