"use client";

import React, { useState } from "react";
import { X, FolderTree } from "lucide-react";
import { toast } from "sonner";
import { SwappInput } from "@/components/ui/SwappInput";
import { SwappToggle } from "@/components/ui/SwappToggle";
import { ProductService } from "@/services/product.service";

interface Props {
	isOpen: boolean;
	onClose: () => void;
	onSuccess: () => void;
	parentCategory: { id: number; name: string } | null;
}

export default function NewSubcategoryModal({
	isOpen,
	onClose,
	onSuccess,
	parentCategory,
}: Props) {
	const [name, setName] = useState("");
	const [slug, setSlug] = useState("");
	const [isActive, setIsActive] = useState(true);
	const [isSaving, setIsSaving] = useState(false);

	if (!isOpen || !parentCategory) return null;

	const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newName = e.target.value;
		setName(newName);
		// Autogenerar slug limpio
		setSlug(
			newName
				.toLowerCase()
				.normalize("NFD")
				.replace(/[\u0300-\u036f]/g, "")
				.replace(/[^a-z0-9]+/g, "-")
				.replace(/(^-|-$)+/g, ""),
		);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim() || !slug.trim()) {
			return toast.error("Nombre y Slug son obligatorios.");
		}

		setIsSaving(true);
		const toastId = toast.loading("Creando subcategoría...");

		try {
			await ProductService.createCategory({
				name: name.trim(),
				slug: slug.trim(),
				parent_id: parentCategory.id, // <-- ACÁ ESTÁ LA MAGIA DEL ENLACE
				is_active: isActive,
				display_order: 0,
			});

			toast.success("Subcategoría creada exitosamente", { id: toastId });

			// Limpieza
			setName("");
			setSlug("");
			setIsActive(true);

			onSuccess();
			onClose();
		} catch (error: any) {
			toast.error(
				error.response?.data?.detail || "Error al crear la subcategoría",
				{
					id: toastId,
				},
			);
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<div className="fixed inset-0 z-[100] flex items-center justify-center bg-swapp-negro/50 dark:bg-swapp-negro/70 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95">
			<div className="w-full max-w-md rounded-xl bg-swapp-blanco dark:bg-swapp-negro-azulado p-6 shadow-2xl border-t-4 border-swapp-turquesa-oscuro dark:border-swapp-menta">
				<div className="mb-6 flex items-center justify-between">
					<div>
						<h2 className="text-xl font-bold text-swapp-negro-azulado dark:text-swapp-blanco flex items-center gap-2">
							<FolderTree className="h-5 w-5 text-swapp-turquesa-oscuro dark:text-swapp-menta" />
							Nueva Subcategoría
						</h2>
						<p className="text-sm text-swapp-azul-petroleo/70 dark:text-swapp-tiza/70 mt-1">
							Colgando de:{" "}
							<span className="font-semibold text-swapp-turquesa-oscuro dark:text-swapp-menta">
								{parentCategory.name}
							</span>
						</p>
					</div>
					<button
						onClick={onClose}
						className="text-swapp-azul-petroleo/50 hover:text-swapp-negro-azulado dark:text-swapp-tiza/50 dark:hover:text-swapp-blanco transition-colors">
						<X className="h-5 w-5" />
					</button>
				</div>

				<form onSubmit={handleSubmit} className="space-y-5">
					<SwappInput
						label="Nombre de la Subcategoría"
						required
						value={name}
						onChange={handleNameChange}
						placeholder="Ej: Botellas Térmicas"
						autoFocus
					/>

					<SwappInput
						label="URL Amigable (Slug)"
						required
						value={slug}
						onChange={(e) => setSlug(e.target.value)}
						placeholder="ej-botellas-termicas"
					/>

					<div className="flex items-center justify-between rounded-lg border border-swapp-tiza dark:border-swapp-azul-petroleo p-3 bg-swapp-tiza/10 dark:bg-swapp-azul-petroleo/10">
						<span className="text-sm font-medium text-swapp-negro-azulado dark:text-swapp-blanco">
							Subcategoría Activa
						</span>
						<SwappToggle
							checked={isActive}
							onChange={setIsActive}
							id="is_active_subcategory"
						/>
					</div>

					<div className="flex justify-end gap-3 pt-4">
						<button
							type="button"
							onClick={onClose}
							className="px-4 py-2 text-sm font-medium text-swapp-azul-petroleo hover:bg-swapp-tiza rounded-lg transition-colors">
							Cancelar
						</button>
						<button
							type="submit"
							disabled={isSaving}
							className="bg-swapp-turquesa-oscuro text-swapp-blanco hover:bg-swapp-azul-oceano px-6 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
							{isSaving ? "Guardando..." : "Crear"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
