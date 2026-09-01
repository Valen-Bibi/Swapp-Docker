import { z } from "zod";

export const orderItemSchema = z.object({
  product_id: z.number(),
  variant_id: z.number().nullable(),
  quantity: z.number().min(1, "La cantidad debe ser mayor a 0"),
  unit_price: z.number().min(0),
  subtotal: z.number().min(0),
  requires_return: z.boolean(), // Eliminamos el .default()
  expected_return_qty: z.number(), // Eliminamos el .default()
  discount_id: z.number().nullable(), // Eliminamos el .default()
  campaign_name: z.string().nullable(), // Eliminamos el .default()
  discount_amount: z.number(), // Eliminamos el .default()
});

export const createOrderSchema = z.object({
  customer_name: z.string().min(2, "Nombre obligatorio"),
  customer_phone: z.string().min(6, "Teléfono obligatorio"),
  customer_email: z.string().email("Email inválido").or(z.literal("")).nullable().optional(),
  delivery_address: z.string().min(5, "Dirección obligatoria"),
  delivery_zone: z.string().or(z.literal("")).nullable().optional(),
  scheduled_delivery_date: z.string().or(z.literal("")).nullable().optional(),
  logistics_notes: z.string().or(z.literal("")).nullable().optional(),
  total_amount: z.number().min(0),
  items: z.array(orderItemSchema).min(1, "Debes agregar al menos un producto"),
});

export type CreateOrderValues = z.infer<typeof createOrderSchema>;