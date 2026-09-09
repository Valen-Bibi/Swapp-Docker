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

	const items = watch("items") || [];

	const totalAmount = items.reduce(
		(acc: number, item: any) => acc + (Number(item.subtotal) || 0),
		0,
	);

	// Inyectamos silenciosamente el total en el estado del formulario
	useEffect(() => {
		setValue("total_amount", totalAmount, {
			shouldValidate: true,
			shouldDirty: true,
		});
	}, [totalAmount, setValue]);

	return (
		<div className="flex flex-col gap-8">
			{/* Sección 1: Cabecera del Cliente */}
			<CustomerSection />

			<hr className="border-swapp-azul-petroleo/10 dark:border-swapp-azul-petroleo/50" />

			{/* Sección 2: Productos y Logística Inversa */}
			<OrderItemsList />

			{/* Footer: Totales y Botón Submit */}
			<div className="sticky bottom-0 mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo bg-swapp-blanco/80 dark:bg-swapp-azul-oscuro/80 p-4 backdrop-blur-md shadow-lg">
				<div className="flex flex-col">
					<span className="text-sm font-bold uppercase tracking-wider text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70">
						Total a Cobrar
					</span>
					<span className="text-2xl font-bold text-swapp-verde-oscuro dark:text-swapp-verde-menta">
						{formatCurrency(totalAmount)}
					</span>
				</div>

				<button
					type="submit"
					disabled={isSubmitting || totalAmount === 0}
					className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-swapp-verde-oscuro dark:bg-swapp-verde-menta px-6 py-3 text-sm font-bold text-swapp-blanco dark:text-swapp-azul-oscuro hover:bg-swapp-verde-pastel dark:hover:bg-swapp-tiza-verdoso transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg">
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
