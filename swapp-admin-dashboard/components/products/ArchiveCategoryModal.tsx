"use client";

import { useState, useEffect } from "react";
import { X, Archive, FolderOutput, AlertTriangle, Save } from "lucide-react";
import { toast } from "sonner";
import { ProductService } from "@/services/product.service";
import { SwappSearchableSelect } from "@/components/ui/SwappSearchableSelect";
import { Category } from "@/types/product";

interface ArchiveCategoryModalProps {
	isOpen: boolean;
	onClose: () => void;
	category: { id: number; name: string } | null;
	activeProductsCount: number;
	categories: Category[];
	onSuccess: () => void;
}

export default function ArchiveCategoryModal({
	isOpen,
	onClose,
	category,
	activeProductsCount,
	categories,
	onSuccess,
}: ArchiveCategoryModalProps) {
	const [action, setAction] = useState<"archive_products" | "reassign">("archive_products");
	const [newCategoryId, setNewCategoryId] = useState<string>("");
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

	// Reset state when modal opens
	useEffect(() => {
		if (isOpen) {
			setAction("archive_products");
			setNewCategoryId("");
			setIsSaving(false);
		}
	}, [isOpen]);

	if (!isOpen || !category) return null;

	const handleArchive = async (e: React.FormEvent) => {
		e.preventDefault();

		if (action === "reassign" && !newCategoryId) {
			toast.error("Debés seleccionar una subcategoría de destino.");
			return;
		}

		setIsSaving(true);
		const toastId = toast.loading("Procesando el archivado en cascada...");

		try {
			await ProductService.archiveCategoryWithResolution(category.id, {
				action: action,
				new_category_id: action === "reassign" ? Number(newCategoryId) : null,
			});

			toast.success("Categoría archivada y productos resueltos con éxito", { id: toastId });
			onSuccess();
			onClose();
		} catch (error: any) {
			toast.error(error.response?.data?.detail || "Error al archivar la categoría.", {
				id: toastId,
			});
		} finally {
			setIsSaving(false);
		}
	};

	const validDestinations = categories
		.filter(
			(c) =>
				c.is_active &&
				c.parent_id !== null && 
				c.category_id !== category.id &&
				c.parent_id !== category.id
		)
		.map((c) => {
			const parentName = categories.find((p) => p.category_id === c.parent_id)?.name || "Subcategoría";
			return {
				label: `${parentName} > ${c.name}`,
				value: String(c.category_id),
			};
		});

	return (
		<div className="fixed inset-0 z-[100] flex items-center justify-center bg-swapp-azul-petroleo/20 dark:bg-swapp-negro/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95">
			<div className="w-full max-w-xl max-h-[90vh] flex flex-col rounded-xl bg-swapp-blanco/50 dark:bg-swapp-azul-oscuro/40 backdrop-blur-md shadow-2xl border-t-4 border-t-swapp-verde-oscuro dark:border-t-swapp-verde-menta overflow-hidden transition-colors">
				
				{/* HEADER ESTANDARIZADO */}
				<div className="p-6 border-b border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo flex items-start justify-between shrink-0 transition-colors">
					<div>
						<h2 className="text-xl font-bold text-swapp-azul-oscuro dark:text-swapp-blanco flex items-center gap-2">
							<AlertTriangle className="h-5 w-5 text-red-500" />
							Resolución de Dependencias
						</h2>
						<p className="text-sm text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70 mt-1.5 font-medium transition-colors">
							Archivando:{" "}
							<span className="font-bold text-swapp-verde-oscuro dark:text-swapp-verde-menta">
								{category.name}
							</span>
						</p>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="p-1 rounded-md text-swapp-azul-petroleo/50 dark:text-swapp-tiza-verdoso/50 hover:bg-red-500/10 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400 transition-colors mt-0.5">
						<X className="h-5 w-5" />
					</button>
				</div>

				<div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
					
					{/* CAJA DE ADVERTENCIA */}
					<div className="mb-6 flex items-start gap-3 rounded-xl bg-red-500/10 dark:bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-400 border border-red-500/20 dark:border-red-500/20 transition-colors animate-in fade-in">
						<AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
						<p className="leading-relaxed">
							Esta categoría contiene <strong>{activeProductsCount} productos activos</strong>. Para proceder con el archivado, debes decidir qué hacer con ellos para no generar stock huérfano.
						</p>
					</div>

					{/* HEREDAMOS TRANSPARENCIA A LOS INPUTS */}
					<form onSubmit={handleArchive} className="space-y-6 animate-in fade-in [&_input]:!bg-transparent">
						
						{/* SISTEMA DE TARJETAS (RADIO CARDS) ESTANDARIZADO */}
						<div className="space-y-3">
							<label className="block text-sm font-bold uppercase tracking-wider text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70">
								Acción a realizar
							</label>
							<div className="grid grid-cols-1 gap-4">
								
								{/* Tarjeta A: Archivar en Cascada */}
								<button
									type="button"
									onClick={() => setAction("archive_products")}
									className={`relative flex flex-col items-start p-4 rounded-xl border transition-all duration-200 ${
										action === "archive_products"
											? "border-swapp-verde-oscuro/40 bg-swapp-verde-oscuro/10 dark:border-swapp-verde-menta/40 dark:bg-swapp-verde-menta/10 shadow-sm"
											: "border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo bg-transparent hover:bg-swapp-blanco/60 dark:hover:bg-swapp-azul-petroleo/20"
									}`}>
									<div className="flex items-center gap-2 mb-2">
										<Archive className={`h-5 w-5 ${action === "archive_products" ? "text-swapp-verde-oscuro dark:text-swapp-verde-menta" : "text-swapp-azul-petroleo/50 dark:text-swapp-tiza-verdoso/50"}`} />
										<span className={`font-semibold text-sm ${action === "archive_products" ? "text-swapp-verde-oscuro dark:text-swapp-verde-menta" : "text-swapp-azul-oscuro dark:text-swapp-blanco"}`}>
											Archivar productos en cascada
										</span>
									</div>
									<p className={`text-[11px] leading-relaxed text-left ${action === "archive_products" ? "text-swapp-verde-oscuro/80 dark:text-swapp-verde-menta/80" : "text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70"}`}>
										Ocultará temporalmente del catálogo todos los productos (y sus variantes) asignados a esta categoría.
									</p>
								</button>

								{/* Tarjeta B: Reasignación */}
								<button
									type="button"
									onClick={() => setAction("reassign")}
									className={`relative flex flex-col items-start p-4 rounded-xl border transition-all duration-200 ${
										action === "reassign"
											? "border-swapp-verde-oscuro/40 bg-swapp-verde-oscuro/10 dark:border-swapp-verde-menta/40 dark:bg-swapp-verde-menta/10 shadow-sm"
											: "border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo bg-transparent hover:bg-swapp-blanco/60 dark:hover:bg-swapp-azul-petroleo/20"
									}`}>
									<div className="flex items-center gap-2 mb-2">
										<FolderOutput className={`h-5 w-5 ${action === "reassign" ? "text-swapp-verde-oscuro dark:text-swapp-verde-menta" : "text-swapp-azul-petroleo/50 dark:text-swapp-tiza-verdoso/50"}`} />
										<span className={`font-semibold text-sm ${action === "reassign" ? "text-swapp-verde-oscuro dark:text-swapp-verde-menta" : "text-swapp-azul-oscuro dark:text-swapp-blanco"}`}>
											Reasignar y Migrar
										</span>
									</div>
									<p className={`text-[11px] leading-relaxed text-left ${action === "reassign" ? "text-swapp-verde-oscuro/80 dark:text-swapp-verde-menta/80" : "text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70"}`}>
										Moverá los {activeProductsCount} productos hacia una nueva categoría activa antes de archivar la actual.
									</p>
								</button>
							</div>
						</div>

						{/* LÓGICA CONDICIONAL */}
						{action === "reassign" && (
							<div className="pt-2 animate-in fade-in slide-in-from-top-4 pb-2">
								<label className="block text-sm font-medium text-swapp-azul-petroleo dark:text-swapp-tiza-verdoso mb-2">
									Seleccioná la subcategoría de destino <span className="text-red-500">*</span>
								</label>
								<SwappSearchableSelect
									options={validDestinations}
									value={newCategoryId}
									onChange={setNewCategoryId}
									placeholder="Buscar subcategoría..."
								/>
							</div>
						)}

						{/* FOOTER CON BOTONES ESTANDARIZADOS Y NUEVO COLOR DE BOTÓN */}
						<div className="mt-6 flex justify-end gap-3 pt-4 border-t border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo transition-colors">
							<button
								type="button"
								onClick={onClose}
								className="rounded-lg px-4 py-2 text-sm font-medium text-swapp-azul-petroleo dark:text-swapp-tiza-verdoso hover:bg-red-500/10 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400 transition-colors">
								Cancelar
							</button>
							<button
								type="submit"
								disabled={isSaving || (action === "reassign" && !newCategoryId)}
								className="flex items-center gap-2 rounded-lg bg-swapp-verde-pastel dark:bg-swapp-verde-menta px-6 py-2 text-sm font-medium text-swapp-blanco dark:text-swapp-azul-oscuro transition-colors hover:bg-swapp-verde-oscuro dark:hover:bg-swapp-verde-pastel disabled:opacity-50">
								<Save className="h-4 w-4" />
								{isSaving ? "Procesando..." : "Confirmar Resolución"}
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
}