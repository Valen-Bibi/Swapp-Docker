"use client";

import { X } from "lucide-react";
import { SwappInput } from "@/components/ui/SwappInput";
import { SwappCheckbox } from "@/components/ui/SwappCheckbox";
import { SwappToggle } from "@/components/ui/SwappToggle";
import { Brand } from "@/types/product";

interface NewBrandModalProps {
	isOpen: boolean;
	onClose: () => void;
	editingBrand: Partial<Brand>;
	setEditingBrand: (brand: Partial<Brand>) => void;
	onSubmit: (e: React.FormEvent) => void;
	isSaving: boolean;
}

export default function NewBrandModal({
	isOpen,
	onClose,
	editingBrand,
	setEditingBrand,
	onSubmit,
	isSaving,
}: NewBrandModalProps) {
	if (!isOpen) return null;

	const generateSlug = (text: string) =>
		text
			.toLowerCase()
			.trim()
			.replace(/[^\w\s-]/g, "")
			.replace(/[\s_-]+/g, "-");

	const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const name = e.target.value;
		setEditingBrand({ ...editingBrand, name, slug: generateSlug(name) });
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-swapp-negro/50 dark:bg-swapp-negro/70 backdrop-blur-sm p-4">
			<div className="w-full max-w-lg rounded-xl bg-swapp-blanco dark:bg-swapp-negro-azulado p-6 shadow-2xl border-t-4 border-swapp-turquesa-oscuro dark:border-swapp-menta">
				<div className="mb-6 flex items-center justify-between">
					<h2 className="text-xl font-bold text-swapp-negro-azulado dark:text-swapp-blanco">
						{editingBrand.brand_id ? "Editar Marca" : "Nueva Marca"}
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
							label="Nombre de Marca"
							required
							value={editingBrand.name || ""}
							onChange={handleNameChange}
						/>
						<SwappInput
							label="URL Amigable (Slug)"
							required
							value={editingBrand.slug || ""}
							onChange={(e) =>
								setEditingBrand({ ...editingBrand, slug: e.target.value })
							}
						/>
					</div>

					<SwappInput
						label="URL del Logo (Opcional)"
						value={editingBrand.logo_url || ""}
						onChange={(e) =>
							setEditingBrand({ ...editingBrand, logo_url: e.target.value })
						}
					/>

					<SwappInput
						label="Orden de visualización"
						type="number"
						required
						value={editingBrand.display_order}
						onChange={(e) =>
							setEditingBrand({
								...editingBrand,
								display_order: parseInt(e.target.value) || 0,
							})
						}
					/>

					<div className="border-t border-swapp-tiza dark:border-swapp-azul-petroleo pt-4 space-y-4">
						<SwappToggle
							label="Marca Activa (Visible en tienda)"
							checked={editingBrand.is_active || false}
							onChange={(c) =>
								setEditingBrand({ ...editingBrand, is_active: c })
							}
						/>
						<SwappCheckbox
							label="Es una marca destacada (Carrusel principal)"
							id="feat_brand"
							checked={editingBrand.featured || false}
							onChange={(e) =>
								setEditingBrand({
									...editingBrand,
									featured: e.target.checked,
								})
							}
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
							{isSaving ? "Guardando..." : "Guardar Marca"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
