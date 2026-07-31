"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Save, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import Cookies from "js-cookie";
import { api } from "@/lib/api";
import PageHeader from "@/components/layout/PageHeader";

export default function NewStaffPage() {
	const router = useRouter();
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [formData, setFormData] = useState({
		first_name: "",
		last_name: "",
		email: "",
		password: "",
		role: "viewer",
	});

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);

		const toastId = toast.loading("Generando credenciales...");
		const token = Cookies.get("admin_token");

		try {
			await api.post("/api/staff/", formData, {
				headers: { Authorization: `Bearer ${token}` },
			});

			toast.success("Usuario creado exitosamente", { id: toastId });

			setTimeout(() => router.push("/dashboard"), 1500);
		} catch (error: any) {
			toast.error(
				error.response?.data?.detail || "Error al conectar con el servidor",
				{ id: toastId },
			);
			setIsSubmitting(false);
		}
	};

	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
	) => {
		setFormData({
			...formData,
			[e.target.name]: e.target.value,
		});
	};

	return (
		<div className="p-6 relative">
			<div className="mb-8 flex items-center justify-between">
				<PageHeader
					title="Alta de Personal"
					description="Generar credenciales de acceso seguro para el panel"
					icon={UserPlus}
				/>
			</div>

			<div className="rounded-xl border border-swapp-tiza dark:border-swapp-azul-petroleo bg-swapp-blanco dark:bg-swapp-negro-azulado p-6 shadow-sm max-w-2xl transition-colors">
				<form onSubmit={handleSubmit} className="space-y-6">
					{/* NOMBRES */}
					<div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
						<div className="space-y-2">
							<label className="text-sm font-medium text-swapp-azul-petroleo/80 dark:text-swapp-tiza/80 transition-colors">
								Nombre
							</label>
							<input
								required
								name="first_name"
								value={formData.first_name}
								onChange={handleChange}
								className="w-full rounded-lg border border-swapp-tiza dark:border-swapp-azul-petroleo bg-transparent px-4 py-2.5 text-swapp-negro-azulado dark:text-swapp-blanco placeholder:text-swapp-azul-petroleo/40 dark:placeholder:text-swapp-tiza/40 outline-none transition-all focus:border-swapp-turquesa-oscuro dark:focus:border-swapp-menta focus:ring-1 focus:ring-swapp-turquesa-oscuro dark:focus:ring-swapp-menta"
								placeholder="Ej. Juan"
							/>
						</div>
						<div className="space-y-2">
							<label className="text-sm font-medium text-swapp-azul-petroleo/80 dark:text-swapp-tiza/80 transition-colors">
								Apellido
							</label>
							<input
								required
								name="last_name"
								value={formData.last_name}
								onChange={handleChange}
								className="w-full rounded-lg border border-swapp-tiza dark:border-swapp-azul-petroleo bg-transparent px-4 py-2.5 text-swapp-negro-azulado dark:text-swapp-blanco placeholder:text-swapp-azul-petroleo/40 dark:placeholder:text-swapp-tiza/40 outline-none transition-all focus:border-swapp-turquesa-oscuro dark:focus:border-swapp-menta focus:ring-1 focus:ring-swapp-turquesa-oscuro dark:focus:ring-swapp-menta"
								placeholder="Ej. Pérez"
							/>
						</div>
					</div>

					{/* CORREO */}
					<div className="space-y-2">
						<label className="text-sm font-medium text-swapp-azul-petroleo/80 dark:text-swapp-tiza/80 transition-colors">
							Correo Electrónico
						</label>
						<input
							required
							type="email"
							name="email"
							value={formData.email}
							onChange={handleChange}
							className="w-full rounded-lg border border-swapp-tiza dark:border-swapp-azul-petroleo bg-transparent px-4 py-2.5 text-swapp-negro-azulado dark:text-swapp-blanco placeholder:text-swapp-azul-petroleo/40 dark:placeholder:text-swapp-tiza/40 outline-none transition-all focus:border-swapp-turquesa-oscuro dark:focus:border-swapp-menta focus:ring-1 focus:ring-swapp-turquesa-oscuro dark:focus:ring-swapp-menta"
							placeholder="correo@swapp.com"
						/>
					</div>

					{/* CONTRASEÑA TEMPORAL */}
					<div className="space-y-2">
						<label className="text-sm font-medium text-swapp-azul-petroleo/80 dark:text-swapp-tiza/80 transition-colors">
							Contraseña de Acceso
						</label>
						<input
							required
							type="password"
							name="password"
							value={formData.password}
							onChange={handleChange}
							className="w-full rounded-lg border border-swapp-tiza dark:border-swapp-azul-petroleo bg-transparent px-4 py-2.5 text-swapp-negro-azulado dark:text-swapp-blanco placeholder:text-swapp-azul-petroleo/40 dark:placeholder:text-swapp-tiza/40 outline-none transition-all focus:border-swapp-turquesa-oscuro dark:focus:border-swapp-menta focus:ring-1 focus:ring-swapp-turquesa-oscuro dark:focus:ring-swapp-menta"
							placeholder="Asigna una contraseña segura"
						/>
					</div>

					{/* ROL */}
					<div className="space-y-2">
						<label className="text-sm font-medium text-swapp-azul-petroleo/80 dark:text-swapp-tiza/80 flex items-center gap-2 transition-colors">
							<ShieldCheck className="h-4 w-4 text-swapp-menta" />
							Nivel de Permisos
						</label>
						<select
							name="role"
							value={formData.role}
							onChange={handleChange}
							className="w-full rounded-lg border border-swapp-tiza dark:border-swapp-azul-petroleo bg-swapp-blanco dark:bg-swapp-negro-azulado px-4 py-2.5 text-swapp-negro-azulado dark:text-swapp-blanco outline-none transition-all focus:border-swapp-turquesa-oscuro dark:focus:border-swapp-menta focus:ring-1 focus:ring-swapp-turquesa-oscuro dark:focus:ring-swapp-menta cursor-pointer">
							<option value="viewer" className="dark:bg-swapp-negro-azulado">
								Viewer (Solo lectura)
							</option>
							<option value="editor" className="dark:bg-swapp-negro-azulado">
								Editor (Puede modificar productos)
							</option>
							<option value="manager" className="dark:bg-swapp-negro-azulado">
								Manager (Gestión de stock e inventario)
							</option>
							<option value="admin" className="dark:bg-swapp-negro-azulado">
								Administrador (Gestión total)
							</option>
						</select>
					</div>

					{/* BOTÓN DE GUARDAR */}
					<div className="pt-4 flex justify-end">
						<button
							type="submit"
							disabled={isSubmitting}
							className="inline-flex items-center gap-2 rounded-lg bg-swapp-turquesa-oscuro dark:bg-swapp-turquesa-oscuro px-6 py-2.5 font-medium text-swapp-blanco dark:text-swapp-negro-azulado shadow-sm transition-all hover:bg-swapp-azul-oceano dark:hover:bg-swapp-blanco disabled:opacity-50">
							<Save className="h-4 w-4" />
							{isSubmitting ? "Guardando..." : "Registrar Cuenta"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
