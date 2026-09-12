"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ShoppingCart, ArrowLeft } from "lucide-react";

import {
	createOrderSchema,
	CreateOrderValues,
} from "@/lib/validations/order.schema";
import { OrderService } from "@/services/order.service";
import PageHeader from "@/components/layout/PageHeader";
import OrderForm from "@/components/orders/OrderForm";

export default function NewOrderPage() {
	const router = useRouter();

	const methods = useForm<CreateOrderValues>({
		resolver: zodResolver(createOrderSchema),
		defaultValues: {
			client_id: 0,
			delivery_address: "",
			delivery_zone: "",
			scheduled_delivery_date: "",
			logistics_notes: "",
			total_amount: 0,
			items: [],
		},
	});

	const onSubmit = async (data: CreateOrderValues) => {
		const toastId = toast.loading("Registrando pedido transaccional...");
		
		try {
			// SANITIZACIÓN: Si la fecha o las notas están vacías, enviamos 'null'
			// para que FastAPI y la base de datos no rechacen la petición (Error 422).
			const payload = {
				...data,
				scheduled_delivery_date: data.scheduled_delivery_date || null,
				logistics_notes: data.logistics_notes || null,
			};

			await OrderService.createAdminOrder(payload);
			
			toast.success("Pedido creado y stock reservado exitosamente", {
				id: toastId,
			});
			router.push("/dashboard/orders");
		} catch (error: any) {
			// PARCHE ANTI-PYDANTIC
			const errDetail = error.response?.data?.detail;
			const errorMessage = Array.isArray(errDetail)
				? errDetail.map((e: any) => e.msg).join(", ")
				: (errDetail || "Error al registrar el pedido");

			// ACÁ FALTABA EL ID: Esto asegura que el mensaje de error reemplace al de "Cargando..."
			toast.error(errorMessage, { id: toastId });
		}
	};

	return (
		<div className="p-6 relative">
			<div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<PageHeader
					title="Nuevo Pedido Manual"
					description="Carga de pedidos recibidos por WhatsApp o canales informales"
					icon={ShoppingCart}
				/>

				<div className="flex items-center gap-4">
					<button
						onClick={() => router.back()}
						className="inline-flex items-center gap-2 rounded-xl bg-swapp-blanco/50 dark:bg-swapp-azul-oscuro/40 backdrop-blur-md border border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo px-4 py-2 text-sm font-medium text-swapp-azul-oscuro dark:text-swapp-tiza-verdoso hover:bg-swapp-blanco/80 dark:hover:bg-swapp-azul-petroleo transition-colors whitespace-nowrap shadow-sm">
						<ArrowLeft className="h-4 w-4 text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70" />{" "}
						Volver a Pedidos
					</button>
				</div>
			</div>

			<div className="rounded-xl border border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo bg-swapp-blanco/50 dark:bg-swapp-azul-oscuro/40 backdrop-blur-md shadow-xl transition-all duration-300 p-6 sm:p-8">
				<FormProvider {...methods}>
					<form
						onSubmit={methods.handleSubmit(onSubmit)}
						className="flex flex-col gap-8">
						<OrderForm />
					</form>
				</FormProvider>
			</div>
		</div>
	);
}