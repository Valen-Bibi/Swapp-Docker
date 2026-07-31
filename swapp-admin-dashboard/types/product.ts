export interface Brand {
	brand_id: number;
	name: string;
}

export interface Product {
	product_uuid: string;
	name: string;
	slug: string;
	sku: string | null;
	main_image_url: string | null;
	is_published: boolean;
	is_returnable: boolean;
	base_price: number;
	cost_price: number | null;
	stock_quantity: number;
	brand_id?: number | null;
	brand?: Brand | null;
	sale_price?: number | null;
  tax_class_id?: number | null;
}

export interface Category {
	category_id: number;
	category_uuid: string;
	name: string;
	image_url?: string;
	parent_id?: number;
}

export interface TaxClass {
	tax_class_id: number;
	name: string;
	rate: number;
	is_active: boolean;
}