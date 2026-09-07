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
			customer_name: "",
			customer_phone: "",
			customer_email: "",
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
			await OrderService.createAdminOrder(data);
			toast.success("Pedido creado y stock reservado exitosamente", {
				id: toastId,
			});
			router.push("/dashboard/orders");
		} catch (error: any) {
			toast.error(error.response?.data?.detail || "Error al crear el pedido", {
				id: toastId,
			});
		}
	};

	return (
		<div className="p-6 relative">
			{/* CONTROLES Y HEADER ESTANDARIZADOS */}
			<div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<PageHeader
					title="Nuevo Pedido Manual"
					description="Carga de pedidos recibidos por WhatsApp o canales informales"
					icon={ShoppingCart}
				/>
				
				<div className="flex items-center gap-4">
					<button
						onClick={() => router.back()}
						className="inline-flex items-center gap-2 rounded-lg bg-swapp-tiza-verdoso/40 dark:bg-swapp-azul-petroleo/40 px-4 py-2 text-sm font-medium text-swapp-azul-petroleo dark:text-swapp-tiza-verdoso hover:bg-swapp-tiza-verdoso dark:hover:bg-swapp-azul-petroleo transition-colors whitespace-nowrap">
						<ArrowLeft className="h-4 w-4" /> Volver a Pedidos
					</button>
				</div>
			</div>

			{/* CONTENEDOR DEL FORMULARIO (GLASSMORPHISM) */}
			<div className="rounded-xl border border-swapp-tiza-verdoso/60 dark:border-swapp-azul-petroleo/60 bg-swapp-blanco/40 dark:bg-swapp-azul-oscuro/40 backdrop-blur-sm shadow-sm transition-all duration-300 p-6 sm:p-8">
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