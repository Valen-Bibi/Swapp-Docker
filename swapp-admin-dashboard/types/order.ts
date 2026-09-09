import { Client } from "./client";

export interface OrderItemCreate {
	product_id: number;
	variant_id: number | null;
	quantity: number;
	unit_price: number;
	subtotal: number;
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
	scheduled_delivery_date?: string | null;
	logistics_notes?: string | null;
	total_amount: number;
	items: OrderItemCreate[];
}

export interface OrderItem {
	item_id: number;
	product_id: number;
	variant_id: number | null;
	unit_price: number;
	quantity: number;
	subtotal: number;
	requires_return: boolean;
	expected_return_qty: number;
}

export interface Order {
	order_id: number;
	order_uuid: string;
	client_id: number;
	client: Client;
	delivery_address: string;
	delivery_zone: string | null;
	status: string;
	total_amount: number;
	scheduled_delivery_date: string | null;
	logistics_notes: string | null;
	created_at: string;
	items: OrderItem[];
}