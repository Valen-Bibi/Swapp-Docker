import { api } from "@/lib/api";

export interface PaymentCreatePayload {
	payment_method: string;
	amount: number;
	transaction_reference?: string;
}

export const PaymentService = {
	createPayment: async (orderUuid: string, payload: PaymentCreatePayload) => {
		const { data } = await api.post(`/api/payments/admin/order/${orderUuid}`, payload);
		return data;
	},

	voidPayment: async (paymentUuid: string) => {
		const { data } = await api.delete(`/api/payments/admin/${paymentUuid}`);
		return data;
	},
};