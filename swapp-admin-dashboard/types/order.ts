import { Client } from "./client";

export interface OrderItemCreate {
	product_id: number;
	variant_id: number | null;
	internal_product_id?: number | null;
	internal_variant_id?: number | null;
	quantity: number;

	unit_price: number;
	unit_cost?: number;
	internal_unit_price?: number;
	internal_unit_cost?: number;

	subtotal_price: number;
	subtotal?: number; // Alias de transición

	is_custom_price?: boolean;
	requires_return: boolean;
	expected_return_qty: number;

	discount_id: number | null;
	campaign_name: string | null;
	discount_amount: number;
}

export interface OrderCreate {
	client_id: number;
	delivery_address: string;
	delivery_zone?: string | null;
	order_date?: string | null;
	scheduled_delivery_date?: string | null;
	logistics_notes?: string | null;
	total_price: number;
	total_amount?: number; // Alias de transición
	items: OrderItemCreate[];
}

export interface OrderItem {
	item_id: number;
	order_id?: number;
	product_id: number;
	variant_id: number | null;
	internal_product_id?: number | null;
	internal_variant_id?: number | null;

	unit_price: number;
	unit_cost: number;
	internal_unit_price: number;
	internal_unit_cost: number;

	quantity: number;
	subtotal_price: number;
	subtotal_cost: number;
	subtotal?: number; // Fallback defensivo

	tax_rate: number;
	is_custom_price: boolean;

	requires_return: boolean;
	expected_return_qty: number;
	actual_return_qty?: number;

	discount_id?: number | null;
	campaign_name?: string | null;
	discount_amount?: number;
}

export interface Order {
	order_id: number;
	order_uuid: string;
	client_id: number;
	client: Client;
	delivery_address: string;
	delivery_zone: string | null;
	status: string;
	payments?: any[];

	total_price: number;
	total_cost: number;
	total_amount?: number; // Fallback defensivo

	order_date: string;
	scheduled_delivery_date: string | null;
	completed_at?: string | null;
	logistics_notes: string | null;
	created_at: string;
	updated_at?: string;
	items: OrderItem[];
}