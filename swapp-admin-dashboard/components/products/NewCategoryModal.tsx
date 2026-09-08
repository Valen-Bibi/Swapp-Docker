"use client";

import { useEffect } from "react";
import { X, Save, FolderTree } from "lucide-react";
import { SwappInput } from "@/components/ui/SwappInput";
import { SwappToggle } from "@/components/ui/SwappToggle";
import { Category } from "@/types/product";

interface NewCategoryModalProps {
	isOpen: boolean;
	onClose: () => void;
	editingCat: Partial<Category>;
	setEditingCat: (cat: Partial<Category>) => void;
	categories: Category[]; 
	onSubmit: (e: React.FormEvent) => void;
	isSaving: boolean;
}

export default function NewCategoryModal({
	isOpen,
	onClose,
	editingCat,
	setEditingCat,
	onSubmit,
	isSaving,
}: NewCategoryModalProps) {
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape" && isOpen) {
				onClose();
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [isOpen, onClose]);

	if (!isOpen) return null;

	const generateSlug = (text: string) =>
		text
			.toLowerCase()
			.trim()
			.replace(/[^\w\s-]/g, "")
			.replace(/[\s_-]+/g, "-");

	const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const name = e.target.value;
		setEditingCat({ ...editingCat, name, slug: generateSlug(name), parent_id: null });
	};

	return (
		<div className="fixed inset-0 z-[100] flex items-center justify-center bg-swapp-azul-petroleo/20 dark:bg-swapp-negro/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95">
			<div className="w-full max-w-lg rounded-xl bg-swapp-blanco/50 dark:bg-swapp-azul-oscuro/40 backdrop-blur-md shadow-2xl border-t-4 border-t-swapp-verde-oscuro dark:border-t-swapp-verde-menta overflow-hidden transition-colors">
				<div className="p-6 border-b border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo flex items-center justify-between shrink-0 transition-colors">
					<h2 className="text-xl font-bold text-swapp-azul-oscuro dark:text-swapp-blanco flex items-center gap-2">
						<FolderTree className="h-5 w-5 text-swapp-verde-oscuro dark:text-swapp-verde-menta" />
						{editingCat.category_id ? "Editar Categoría Principal" : "Nueva Categoría Principal"}
					</h2>
					<button
						type="button"
						onClick={onClose}
						className="p-1 rounded-md text-swapp-azul-petroleo/50 dark:text-swapp-tiza-verdoso/50 hover:bg-red-500/10 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400 transition-colors">
						<X className="h-5 w-5" />
					</button>
				</div>

				<div className="p-6">
					<form
						onSubmit={onSubmit}
						className="space-y-5 [&_input]:!bg-transparent">
						<div className="grid grid-cols-2 gap-4">
							<SwappInput
								label="Nombre"
								required
								value={editingCat.name || ""}
								onChange={handleNameChange}
							/>
							<SwappInput
								label="URL Amigable (Slug)"
								required
								value={editingCat.slug || ""}
								onChange={(e) =>
									setEditingCat({ ...editingCat, slug: e.target.value })
								}
							/>
						</div>

						<div className="flex items-center justify-between rounded-lg border border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo p-3 bg-transparent transition-colors mt-2">
							<span className="text-sm font-medium text-swapp-azul-oscuro dark:text-swapp-blanco">
								Categoría Activa
							</span>
							<SwappToggle
								checked={editingCat.is_active || false}
								onChange={(c) => setEditingCat({ ...editingCat, is_active: c })}
								id="is_active_category"
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
								{isSaving ? "Guardando..." : "Guardar"}
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
}