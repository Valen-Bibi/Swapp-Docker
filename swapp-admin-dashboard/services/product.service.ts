import { api } from "@/lib/api";
import { Product, Brand, Category, TaxClass } from "@/types/product";

export const ProductService = {
	getAll: async (): Promise<Product[]> => {
		const { data } = await api.get("/api/products/admin");
		return data;
	},

	getBrands: async (): Promise<Brand[]> => {
		const { data } = await api.get("/api/products/admin/brands");
		return data;
	},

	getCategories: async (): Promise<Category[]> => {
		const { data } = await api.get("/api/products/admin/categories");
		return data;
	},
	getTaxes: async (): Promise<TaxClass[]> => {
		const { data } = await api.get("/api/products/admin/taxes");
		return data;
	},

	create: async (payload: any) => {
		const { data } = await api.post("/api/products/admin", payload);
		return data;
	},

	update: async (id: string, payload: any) => {
		const { data } = await api.put(`/api/products/admin/${id}`, payload);
		return data;
	},

	addMovement: async (
		id: string,
		payload: { quantity: number; movement_type: string; reason: string; notes?: string; unit_cost?: number },
	) => {
		const { data } = await api.post(
			`/api/products/admin/${id}/movements`,
			payload,
		);
		return data;
	},

	getPriceHistory: async (id: string): Promise<any[]> => {
		const { data } = await api.get(`/api/products/admin/${id}/price-history`);
		return data;
	},
};
