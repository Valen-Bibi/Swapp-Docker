import { PublicProduct } from "@/types/product";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:7860";

export const CatalogService = {
  getProducts: async (): Promise<PublicProduct[]> => {
    const response = await fetch(`${API_URL}/api/catalog/products`, { cache: "no-store" });
    if (!response.ok) throw new Error("Error al obtener los productos del catálogo");
    return response.json();
  },
  
  getProductBySlug: async (slug: string): Promise<PublicProduct> => {
    const response = await fetch(`${API_URL}/api/catalog/products/${slug}`, { cache: "no-store" });
    if (!response.ok) throw new Error("Producto no encontrado");
    return response.json();
  }
};