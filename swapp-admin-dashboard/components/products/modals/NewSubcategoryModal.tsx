"use client";

import React, { useState, useEffect } from "react";
import { X, FolderTree, Save } from "lucide-react";
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

	// --- CERRAR CON ESCAPE ---
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape" && isOpen) {
				onClose();
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [isOpen, onClose]);

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
				parent_id: parentCategory.id,
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
		<div className="fixed inset-0 z-[100] flex items-center justify-center bg-swapp-azul-petroleo/5 dark:bg-swapp-negro/30 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95">
			{/* CONTENEDOR DEL MODAL CON EL BALANCE DE OPACIDAD PERFECTO */}
			<div className="w-full max-w-md rounded-xl bg-swapp-blanco/50 dark:bg-swapp-azul-oscuro/40 backdrop-blur-md shadow-2xl border-t-4 border-t-swapp-verde-oscuro dark:border-t-swapp-verde-menta p-6 transition-colors">
				<div className="mb-6 flex items-center justify-between">
					<div>
						<h2 className="text-xl font-bold text-swapp-azul-oscuro dark:text-swapp-blanco flex items-center gap-2">
							<FolderTree className="h-5 w-5 text-swapp-verde-oscuro dark:text-swapp-verde-menta" />
							Nueva Subcategoría
						</h2>
						<p className="text-sm text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70 mt-1">
							Colgando de:{" "}
							<span className="font-semibold text-swapp-verde-oscuro dark:text-swapp-verde-menta">
								{parentCategory.name}
							</span>
						</p>
					</div>
					<button
						onClick={onClose}
						className="p-1 rounded-md text-swapp-azul-petroleo/50 dark:text-swapp-tiza-verdoso/50 hover:bg-red-500/10 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400 transition-colors">
						<X className="h-5 w-5" />
					</button>
				</div>

				<form
					onSubmit={handleSubmit}
					className="space-y-5 [&_input]:!bg-transparent">
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

					<div className="flex items-center justify-between rounded-lg border border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo p-3 bg-transparent transition-colors">
						<span className="text-sm font-medium text-swapp-azul-oscuro dark:text-swapp-blanco">
							Subcategoría Activa
						</span>
						<SwappToggle
							checked={isActive}
							onChange={setIsActive}
							id="is_active_subcategory"
						/>
					</div>

					<div className="flex justify-end gap-3 pt-4 border-t border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo mt-6 transition-colors">
						<button
							type="button"
							onClick={onClose}
							className="rounded-lg px-4 py-2 text-sm font-medium text-swapp-azul-petroleo hover:bg-red-500/10 hover:text-red-600 dark:text-swapp-tiza-verdoso dark:hover:bg-red-500/10 dark:hover:text-red-400 transition-colors">
							Cancelar
						</button>
						<button
							type="submit"
							disabled={isSaving}
							className="flex items-center gap-2 rounded-lg bg-swapp-verde-pastel dark:bg-swapp-verde-menta px-6 py-2 text-sm font-medium text-swapp-blanco dark:text-swapp-azul-oscuro transition-colors hover:bg-swapp-verde-oscuro dark:hover:bg-swapp-verde-pastel disabled:opacity-50">
							<Save className="h-4 w-4" />
							{isSaving ? "Guardando..." : "Crear"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
