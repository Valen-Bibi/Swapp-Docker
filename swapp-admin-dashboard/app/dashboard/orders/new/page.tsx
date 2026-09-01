"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ShoppingCart } from "lucide-react";

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
			<div className="mb-6">
				<PageHeader
					title="Nuevo Pedido Manual"
					description="Carga de pedidos recibidos por WhatsApp o canales informales"
					icon={ShoppingCart}
				/>
			</div>

			<div className="rounded-xl border border-swapp-tiza-verdoso dark:border-swapp-azul-petroleo bg-swapp-blanco dark:bg-swapp-azul-oscuro shadow-sm p-6">
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
