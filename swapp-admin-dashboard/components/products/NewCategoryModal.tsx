"use client";

import { X } from "lucide-react";
import { SwappInput } from "@/components/ui/SwappInput";
import { SwappToggle } from "@/components/ui/SwappToggle";
import { Category } from "@/types/product";

interface NewCategoryModalProps {
	isOpen: boolean;
	onClose: () => void;
	editingCat: Partial<Category>;
	setEditingCat: (cat: Partial<Category>) => void;
	categories: Category[]; // Necesitamos la lista completa para el selector de Categoría Padre
	onSubmit: (e: React.FormEvent) => void;
	isSaving: boolean;
}

export default function NewCategoryModal({
	isOpen,
	onClose,
	editingCat,
	setEditingCat,
	categories,
	onSubmit,
	isSaving,
}: NewCategoryModalProps) {
	if (!isOpen) return null;

	const generateSlug = (text: string) =>
		text
			.toLowerCase()
			.trim()
			.replace(/[^\w\s-]/g, "")
			.replace(/[\s_-]+/g, "-");

	const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const name = e.target.value;
		setEditingCat({ ...editingCat, name, slug: generateSlug(name) });
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-swapp-negro/50 dark:bg-swapp-negro/70 backdrop-blur-sm p-4">
			<div className="w-full max-w-lg rounded-xl bg-swapp-blanco dark:bg-swapp-negro-azulado p-6 shadow-2xl border-t-4 border-swapp-turquesa-oscuro dark:border-swapp-menta">
				<div className="mb-6 flex items-center justify-between">
					<h2 className="text-xl font-bold text-swapp-negro-azulado dark:text-swapp-blanco">
						{editingCat.category_id ? "Editar Categoría" : "Nueva Categoría"}
					</h2>
					<button
						onClick={onClose}
						className="text-swapp-azul-petroleo/50 dark:text-swapp-tiza/50 hover:text-swapp-negro-azulado dark:hover:text-swapp-blanco">
						<X className="h-5 w-5" />
					</button>
				</div>

				<form onSubmit={onSubmit} className="space-y-4">
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

					<div className="space-y-1">
						<label className="block text-sm font-medium text-swapp-azul-petroleo dark:text-swapp-tiza">
							Categoría Padre (Opcional)
						</label>
						<select
							className="w-full rounded-md border border-swapp-tiza dark:border-swapp-azul-petroleo bg-transparent px-3 py-2.5 text-sm text-swapp-negro-azulado dark:text-swapp-blanco outline-none focus:border-swapp-turquesa-oscuro dark:focus:border-swapp-menta"
							value={editingCat.parent_id || ""}
							onChange={(e) =>
								setEditingCat({
									...editingCat,
									parent_id: e.target.value ? parseInt(e.target.value) : null,
								})
							}>
							<option value="" className="dark:bg-swapp-negro-azulado">
								Es categoría principal
							</option>
							{categories
								.filter((c) => c.category_id !== editingCat.category_id)
								.map((c) => (
									<option
										key={c.category_id}
										value={c.category_id}
										className="dark:bg-swapp-negro-azulado">
										{c.name}
									</option>
								))}
						</select>
					</div>

					<SwappInput
						label="Orden de prioridad"
						type="number"
						required
						value={editingCat.display_order}
						onChange={(e) =>
							setEditingCat({
								...editingCat,
								display_order: parseInt(e.target.value) || 0,
							})
						}
					/>

					<div className="border-t border-swapp-tiza dark:border-swapp-azul-petroleo pt-4 space-y-4">
						<SwappToggle
							label="Categoría Activa"
							checked={editingCat.is_active || false}
							onChange={(c) => setEditingCat({ ...editingCat, is_active: c })}
						/>
					</div>

					<div className="mt-6 flex justify-end gap-3 pt-4 border-t border-swapp-tiza dark:border-swapp-azul-petroleo">
						<button
							type="button"
							onClick={onClose}
							className="rounded-lg px-4 py-2 text-sm font-medium text-swapp-azul-petroleo dark:text-swapp-tiza hover:bg-swapp-tiza dark:hover:bg-swapp-azul-petroleo">
							Cancelar
						</button>
						<button
							type="submit"
							disabled={isSaving}
							className="rounded-lg bg-swapp-turquesa-oscuro dark:bg-swapp-menta px-4 py-2 text-sm font-medium text-swapp-blanco dark:text-swapp-negro-azulado transition-colors hover:bg-swapp-azul-oceano disabled:opacity-50">
							{isSaving ? "Guardando..." : "Guardar Categoría"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
