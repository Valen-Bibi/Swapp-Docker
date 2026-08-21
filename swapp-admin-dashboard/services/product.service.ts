import { api } from "@/lib/api";
import { Product, Brand, Category, TaxClass } from "@/types/product";

export const ProductService = {
  getAll: async (): Promise<Product[]> => {
    const timestamp = new Date().getTime();
    const { data } = await api.get(`/api/products/admin?t=${timestamp}`);
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

  createVariant: async (productUuid: string, payload: any) => {
    const { data } = await api.post(`/api/products/admin/${productUuid}/variants`, payload);
    return data;
  },

  updateVariant: async (productUuid: string, variantUuid: string, updateData: any) => {
    const { data } = await api.put(`/api/products/admin/${productUuid}/variants/${variantUuid}`, updateData);
    return data;
  },

  // --- LOGÍSTICA E HISTORIAL ---
  addMovement: async (
    productUuid: string,
    variantUuid: string, // NUEVO PARÁMETRO
    payload: { quantity: number; movement_type: string; reason: string; notes?: string; unit_cost?: number },
  ) => {
    const { data } = await api.post(
      `/api/products/admin/${productUuid}/variants/${variantUuid}/movements`,
      payload,
    );
    return data;
  },

 getPriceHistory: async (productUuid: string, variantUuid: string): Promise<any[]> => {
		const { data } = await api.get(`/api/products/admin/${productUuid}/variants/${variantUuid}/price-history`);
		return data;
	},

  // --- MULTIMEDIA ---
  uploadMainImage: async (product_uuid: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post(
      `/api/products/admin/${product_uuid}/main-image`,
      formData
    );
    return response.data;
  },

  uploadGalleryImages: async (product_uuid: string, files: File[]) => {
    const formData = new FormData();
    
    files.forEach((file) => {
      formData.append("files", file); 
    });

    const response = await api.post(
      `/api/products/admin/${product_uuid}/gallery-images`,
      formData
    );
    return response.data;
  },

  deleteMedia: async (product_uuid: string, media_uuid: string) => {
    const { data } = await api.delete(`/api/products/admin/${product_uuid}/media/${media_uuid}`);
    return data;
  },
};