import { z } from "zod";

export const clientAddressSchema = z.object({
	address_line: z.string().min(3, "La calle es obligatoria"),
	has_street_number: z.boolean(), // Quitamos el .default() para evitar desajustes de tipos
	province: z.string().nullable().optional(),
	locality: z.string().min(2, "La localidad/barrio es obligatoria"),
	zip_code: z.string().nullable().optional(),
	apartment_lot: z.string().nullable().optional(),
	is_default: z.boolean(), // Quitamos el .default()
	notes: z.string().nullable().optional(),
});

export const clientSchema = z.object({
	client_type: z.enum(["consumer", "business"]),
	first_name: z.string().nullable().optional(),
	last_name: z.string().nullable().optional(),
	dni: z.string().nullable().optional(),
	company_name: z.string().nullable().optional(),
	cuit: z.string().nullable().optional(),
	whatsapp_number: z.string().min(10, "Debe ser un número válido").nullable().optional(),
	email: z.string().email("Correo inválido").or(z.literal("")).nullable().optional(),
	addresses: z.array(clientAddressSchema).min(1, "Debe agregar al menos una dirección"),
}).superRefine((data, ctx) => {
	
	if (data.client_type === "consumer") {
		if (!data.first_name || data.first_name.trim().length < 2) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "El nombre es obligatorio",
				path: ["first_name"],
			});
		}
		if (!data.last_name || data.last_name.trim().length < 2) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "El apellido es obligatorio",
				path: ["last_name"],
			});
		}
	}

	if (data.client_type === "business") {
		if (!data.company_name || data.company_name.trim().length < 2) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "La razón social es obligatoria",
				path: ["company_name"],
			});
		}
		if (!data.cuit || data.cuit.trim().length < 11) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "El CUIT debe tener al menos 11 números",
				path: ["cuit"],
			});
		}
	}
});

export type ClientFormValues = z.infer<typeof clientSchema>;