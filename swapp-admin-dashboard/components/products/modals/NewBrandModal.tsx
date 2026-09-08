"use client";

import { useEffect } from "react";
import { X, Save, Tag } from "lucide-react";
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
		<div className="fixed inset-0 z-[100] flex items-center justify-center bg-swapp-azul-petroleo/5 dark:bg-swapp-negro/30 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95">
			{/* CONTENEDOR DEL MODAL SIN BORDES EXTERNOS */}
			<div className="w-full max-w-lg rounded-xl bg-swapp-blanco/50 dark:bg-swapp-azul-oscuro/40 backdrop-blur-md shadow-2xl border-t-4 border-t-swapp-verde-oscuro dark:border-t-swapp-verde-menta overflow-hidden transition-colors">
				{/* HEADER CON DIVISOR AZUL PETRÓLEO */}
				<div className="p-6 border-b border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo flex items-center justify-between shrink-0 transition-colors">
					<h2 className="text-xl font-bold text-swapp-azul-oscuro dark:text-swapp-blanco flex items-center gap-2">
						<Tag className="h-5 w-5 text-swapp-verde-oscuro dark:text-swapp-verde-menta" />
						{editingBrand.brand_id ? "Editar Marca" : "Nueva Marca"}
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

						<div className="flex flex-col gap-4 border-t border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo pt-5 transition-colors">
							{/* TOGGLE ESTANDARIZADO */}
							<div className="flex items-center justify-between rounded-lg border border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo p-3 bg-transparent transition-colors">
								<span className="text-sm font-medium text-swapp-azul-oscuro dark:text-swapp-blanco">
									Marca Activa (Visible en tienda)
								</span>
								<SwappToggle
									checked={editingBrand.is_active || false}
									onChange={(c) =>
										setEditingBrand({ ...editingBrand, is_active: c })
									}
									id="is_active_brand"
								/>
							</div>

							{/* NUEVO CHECKBOX */}
							<div className="px-1">
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
						</div>

						{/* FOOTER CON BOTONES ESTANDARIZADOS */}
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
								{isSaving ? "Guardando..." : "Guardar Marca"}
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
}
