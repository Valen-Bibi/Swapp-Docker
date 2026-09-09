import { api } from "@/lib/api";
import { Client } from "@/types/client";

export const ClientService = {
	getAll: async (search?: string, isActive?: boolean) => {
		let url = "/api/clients/admin?";
		if (search) url += `search=${encodeURIComponent(search)}&`;
		if (isActive !== undefined) url += `is_active=${isActive}`;
		
		const { data } = await api.get(url);
		return data;
	},
	getById: async (uuid: string) => {
		const { data } = await api.get(`/api/clients/admin/${uuid}`);
		return data;
	},
	create: async (payload: any) => {
		const { data } = await api.post("/api/clients/admin", payload);
		return data;
	},
	update: async (uuid: string, payload: any) => {
		const { data } = await api.patch(`/api/clients/admin/${uuid}`, payload);
		return data;
	},
	toggleStatus: async (uuid: string) => {
		const { data } = await api.patch(`/api/clients/admin/${uuid}/toggle`);
		return data;
	},
};