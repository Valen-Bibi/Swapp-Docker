export interface Brand {
  brand_id: number;
  name: string;
  slug?: string;
  logo_url?: string | null;
  display_order?: number;
  is_active?: boolean;
  featured?: boolean;
}

export interface Category {
  category_id: number;
  category_uuid?: string;
  name: string;
  slug: string;
  image_url?: string | null;
  parent_id?: number | null;
  display_order: number;
  is_active: boolean;
}

export interface TaxClass {
  tax_class_id: number;
  name: string;
  rate: number;
  is_active: boolean;
}

// --- NUEVA INTERFAZ: LA VARIANTE FÍSICA ---
export interface ProductVariant {
  variant_id?: number;
  variant_uuid?: string;
  sku: string;
  price: number;
  cost_price: number;
  sale_price?: number | null;
  stock_quantity: number;
  low_stock_threshold?: number;
  variant_attributes?: Record<string, any> | null;
  is_active?: boolean;
}

// --- INTERFAZ ACTUALIZADA: LA PLANTILLA (PADRE) ---
export interface Product {
  product_uuid: string;
  name: string;
  slug: string;
  
  category_id?: number | null;
  brand_id?: number | null;
  tax_class_id?: number | null;
  brand?: Brand | null;
  
  short_description?: string | null;
  description?: string | null;

  meta_title?: string | null;
  meta_description?: string | null;
  meta_keywords?: string | null;
  
  low_stock_threshold?: number;
  max_order_quantity?: number | null;
  weight?: number | null;
  weight_unit?: string | null;
  dimensions?: { length: number; width: number; height: number } | null;
  
  download_url?: string | null;
  file_size?: number | null;
  file_extension?: string | null;
  
  is_published: boolean;
  is_returnable: boolean;
  is_featured?: boolean;

  variants?: ProductVariant[];
  media?: {
    media_uuid: string;
    media_type: string;
    media_subtype: string;
    file_url: string;
    thumbnail_url?: string | null;
    alt_text?: string | null;
    display_order: number;
    is_active: boolean;
  }[];
}