export interface Client {
	client_id: number;
	client_uuid: string;
	first_name: string;
	last_name: string;
	dni: string | null;
	whatsapp_number: string;
	email: string | null;
	default_delivery_address: string;
	default_delivery_zone: string;
	is_active: boolean;
	metrics?: Record<string, any>;
	created_at?: string;
	updated_at?: string;
}