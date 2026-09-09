import { z } from "zod";

export const orderItemSchema = z.object({
  product_id: z.number(),
  variant_id: z.number().nullable(),
  quantity: z.number().min(1, "La cantidad debe ser mayor a 0"),
  unit_price: z.number().min(0),
  subtotal: z.number().min(0),
  requires_return: z.boolean(),
  expected_return_qty: z.number(),
  discount_id: z.number().nullable(),
  campaign_name: z.string().nullable(),
  discount_amount: z.number(),
});

export const createOrderSchema = z.object({
  client_id: z.number().min(1, "Debes seleccionar un cliente válido"),
  delivery_address: z.string().min(5, "Dirección obligatoria"),
  delivery_zone: z.string().or(z.literal("")).nullable().optional(),
  scheduled_delivery_date: z.string().or(z.literal("")).nullable().optional(),
  logistics_notes: z.string().or(z.literal("")).nullable().optional(),
  total_amount: z.number().min(0),
  items: z.array(orderItemSchema).min(1, "Debes agregar al menos un producto"),
});

export type CreateOrderValues = z.infer<typeof createOrderSchema>;