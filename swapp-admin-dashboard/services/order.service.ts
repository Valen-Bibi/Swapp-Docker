import { api } from "@/lib/api";
import { OrderCreate } from "@/types/order";

export const OrderService = {
	createAdminOrder: async (payload: OrderCreate) => {
		const { data } = await api.post("/api/orders/admin", payload);
		return data;
	},

	getOrders: async (statusFilter?: string, zoneFilter?: string) => {
		const params = new URLSearchParams();
		if (statusFilter) params.append("status_filter", statusFilter);
		if (zoneFilter) params.append("zone_filter", zoneFilter);

		const { data } = await api.get(`/api/orders/admin?${params.toString()}`);
		return data;
	},

	// NUEVO: Ahora soporta enviar el diccionario de envases recolectados
	updateOrderStatus: async (
		orderUuid: string,
		newStatus: string,
		actualReturns?: Record<number, number>
	) => {
		const payload = {
			new_status: newStatus,
			actual_returns: actualReturns || {},
		};
		const { data } = await api.patch(
			`/api/orders/admin/${orderUuid}/status`,
			payload
		);
		return data;
	},

	updateOrder: async (orderUuid: string, payload: any) => {
		const { data } = await api.patch(`/api/orders/admin/${orderUuid}`, payload);
		return data;
	},
};