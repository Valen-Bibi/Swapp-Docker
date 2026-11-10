export interface ClientAddress {
  address_id?: number;
  address_uuid?: string;
  address_line: string;
  has_street_number: boolean;
  province?: string | null;
  locality: string;
  zip_code?: string | null;
  apartment_lot?: string | null;
  is_default: boolean;
  notes?: string | null;
}

export interface Client {
  client_id: number;
  client_uuid: string;
  client_type: "consumer" | "business";
  
  first_name?: string | null;
  last_name?: string | null;
  dni?: string | null;
  
  company_name?: string | null;
  cuit?: string | null;
  
  whatsapp_number?: string | null;
  email?: string | null;
  
  default_delivery_address?: string | null;
  default_delivery_zone?: string | null;

  is_active: boolean;
  metrics: Record<string, any>;
  
  addresses?: ClientAddress[];
}