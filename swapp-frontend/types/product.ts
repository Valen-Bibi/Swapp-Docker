export interface Brand {
  brand_id: number;
  name: string;
  slug: string;
  logo_url?: string | null;
}

export interface ProductVariant {
  variant_id: number;
  variant_uuid: string;
  sku: string;
  price: number;
  stock_quantity: number;
  variant_attributes?: Record<string, string> | null;
  image_url?: string | null;
  is_active: boolean;
}

export interface ExchangeOption {
  internal_product_uuid: string;
  internal_variant_uuid: string;
  sku: string;
  price: number;
  is_available: boolean;
}

export interface ProductMedia {
  media_uuid: string;
  media_type: string;
  media_subtype: string;
  file_url: string;
  thumbnail_url?: string | null;
  alt_text?: string | null;
  display_order: number;
  is_active: boolean;
}

export interface PublicProduct {
  product_id: number;
  product_uuid: string;
  name: string;
  model?: string | null;
  slug: string;
  has_variants: boolean;
  is_returnable: boolean;
  is_featured: boolean;
  short_description?: string | null;
  description?: string | null;
  category_id?: number | null;
  brand?: Brand | null;
  variants: ProductVariant[];
  media: ProductMedia[];
  exchange_option?: ExchangeOption | null;
  tax_rate: number;
}