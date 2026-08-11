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