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

  getCategories: async (includeInactive: boolean = false): Promise<Category[]> => {
    const { data } = await api.get(`/api/products/admin/categories?include_inactive=${includeInactive}`);
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

  createCategory: async (payload: { name: string; slug: string; parent_id?: number | null; display_order?: number; is_active?: boolean; image_url?: string | null }) => {
    const { data } = await api.post("/api/products/admin/categories", payload);
    return data;
  },

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

  getAttributes: async () => {
    const { data } = await api.get("/api/products/admin/attributes");
    return data;
  },

  createAttribute: async (payload: { name: string; is_variant: boolean; values: string[] }) => {
    const { data } = await api.post("/api/products/admin/attributes", payload);
    return data;
  },

  addAttributeValue: async (attributeId: number, payload: { value: string; display_order: number }) => {
    const { data } = await api.post(`/api/products/admin/attributes/${attributeId}/values`, payload);
    return data;
  },

  deleteAttributeValue: async (valueId: number) => {
    const { data } = await api.delete(`/api/products/admin/attributes/values/${valueId}`);
    return data;
  },
  
  deleteAttribute: async (attributeId: number) => {
    const { data } = await api.delete(`/api/products/admin/attributes/${attributeId}`);
    return data;
  },

 getPriceHistory: async (productUuid: string, variantUuid: string): Promise<any[]> => {
		const { data } = await api.get(`/api/products/admin/${productUuid}/variants/${variantUuid}/price-history`);
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

  getCategoryAttributes: async (categoryId: number) => {
    const { data } = await api.get(`/api/products/admin/categories/${categoryId}/attributes`);
    return data;
  },

  linkAttributeToCategory: async (categoryId: number, payload: { attribute_id: number; is_required: boolean }) => {
    const { data } = await api.post(`/api/products/admin/categories/${categoryId}/attributes`, payload);
    return data;
  },

  unlinkAttributeFromCategory: async (categoryId: number, attributeId: number) => {
    const { data } = await api.delete(`/api/products/admin/categories/${categoryId}/attributes/${attributeId}`);
    return data;
  },
};