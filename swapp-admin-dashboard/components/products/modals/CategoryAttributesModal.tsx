"use client";

import React, { useEffect, useState } from "react";
import { X, Lock, CheckCircle2, Circle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { SwappToggle } from "@/components/ui/SwappToggle";
import { ProductService } from "@/services/product.service";

interface Props {
	isOpen: boolean;
	onClose: () => void;
	category: { id: number; name: string } | null;
}

export default function CategoryAttributesModal({
	isOpen,
	onClose,
	category,
}: Props) {
	const [allAttributes, setAllAttributes] = useState<any[]>([]);
	const [linkedAttributes, setLinkedAttributes] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);

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

	useEffect(() => {
		if (isOpen && category) {
			loadData();
		}
	}, [isOpen, category]);

	const loadData = async () => {
		setLoading(true);
		try {
			// Traemos el diccionario global y los que tiene activos esta subcategoría
			const [globalAttrs, linkedAttrs] = await Promise.all([
				ProductService.getAttributes(),
				ProductService.getCategoryAttributes(category!.id),
			]);
			setAllAttributes(globalAttrs);
			setLinkedAttributes(linkedAttrs);
		} catch (error) {
			toast.error("Error al cargar los atributos.");
		} finally {
			setLoading(false);
		}
	};

	const toggleLink = async (
		attributeId: number,
		isCurrentlyLinked: boolean,
		isRequired: boolean,
	) => {
		if (!category) return;

		try {
			if (isCurrentlyLinked) {
				await ProductService.unlinkAttributeFromCategory(
					category.id,
					attributeId,
				);
			} else {
				await ProductService.linkAttributeToCategory(category.id, {
					attribute_id: attributeId,
					is_required: isRequired,
				});
			}
			// Refrescamos silenciosamente para reflejar los cambios
			const linkedAttrs = await ProductService.getCategoryAttributes(
				category.id,
			);
			setLinkedAttributes(linkedAttrs);
		} catch (error: any) {
			toast.error(
				error.response?.data?.detail || "Error al actualizar vínculo",
			);
		}
	};

	const toggleRequired = async (
		attributeId: number,
		newRequiredStatus: boolean,
	) => {
		if (!category) return;
		try {
			// Si ya estaba linkeado, el backend actualiza el is_required (es un UPSERT)
			await ProductService.linkAttributeToCategory(category.id, {
				attribute_id: attributeId,
				is_required: newRequiredStatus,
			});
			const linkedAttrs = await ProductService.getCategoryAttributes(
				category.id,
			);
			setLinkedAttributes(linkedAttrs);
		} catch (error: any) {
			toast.error(
				error.response?.data?.detail || "Error al actualizar obligatoriedad",
			);
		}
	};

	if (!isOpen || !category) return null;

	return (
		<div className="fixed inset-0 z-[100] flex items-center justify-center bg-swapp-azul-petroleo/5 dark:bg-swapp-negro/30 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95">
			{/* CONTENEDOR DEL MODAL ESTANDARIZADO */}
			<div className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-xl bg-swapp-blanco/50 dark:bg-swapp-azul-oscuro/40 backdrop-blur-md shadow-2xl border-t-4 border-t-swapp-verde-oscuro dark:border-t-swapp-verde-menta overflow-hidden transition-colors">
				{/* HEADER */}
				<div className="p-6 border-b border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo flex items-center justify-between shrink-0 transition-colors">
					<div>
						<h2 className="text-xl font-bold text-swapp-azul-oscuro dark:text-swapp-blanco flex items-center gap-2">
							<Lock className="h-5 w-5 text-swapp-verde-oscuro dark:text-swapp-verde-menta" />
							Atributos de la Subcategoría
						</h2>
						<p className="text-sm text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70 mt-1">
							Atributos exigidos para la subcategoría:{" "}
							<span className="font-semibold text-swapp-verde-oscuro dark:text-swapp-verde-menta">
								{category.name}
							</span>
						</p>
					</div>
					<button
						onClick={onClose}
						className="p-1 rounded-md text-swapp-azul-petroleo/50 dark:text-swapp-tiza-verdoso/50 hover:bg-red-500/10 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400 transition-colors">
						<X className="h-5 w-5" />
					</button>
				</div>

				{/* BODY */}
				<div className="p-6 overflow-y-auto flex-1">
					{loading ? (
						<div className="flex flex-col items-center justify-center py-12 gap-3">
							<Loader2 className="h-8 w-8 animate-spin text-swapp-verde-oscuro dark:text-swapp-verde-menta" />
							<p className="text-sm text-swapp-azul-petroleo/60 dark:text-swapp-tiza-verdoso/60">
								Sincronizando candado...
							</p>
						</div>
					) : allAttributes.length === 0 ? (
						<div className="text-center py-8 text-swapp-azul-petroleo/50 dark:text-swapp-tiza-verdoso/50 text-sm">
							No hay atributos en el catálogo maestro. Creá atributos primero.
						</div>
					) : (
						<div className="space-y-3">
							{allAttributes.map((attr) => {
								const linkedData = linkedAttributes.find(
									(l) => l.attribute_id === attr.attribute_id,
								);
								const isLinked = !!linkedData;
								const isRequired = linkedData?.is_required || false;

								return (
									<div
										key={attr.attribute_id}
										className={`flex items-center justify-between p-4 rounded-lg border transition-all duration-200 ${
											isLinked
												? "border-swapp-verde-oscuro/30 bg-swapp-verde-oscuro/10 dark:border-swapp-verde-menta/30 dark:bg-swapp-verde-menta/10"
												: "border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo bg-transparent hover:bg-swapp-blanco/60 dark:hover:bg-swapp-azul-petroleo/20"
										}`}>
										<div className="flex flex-col">
											<span className="font-medium text-sm text-swapp-azul-oscuro dark:text-swapp-blanco">
												{attr.name}
											</span>
											<span className="text-xs text-swapp-azul-petroleo/60 dark:text-swapp-tiza-verdoso/60 mt-0.5">
												{attr.is_variant
													? "Variante Física (Afecta Stock)"
													: "Estructural (Ficha Técnica)"}
											</span>
										</div>

										<div className="flex items-center gap-6">
											{/* Toggle Requerido (Solo se muestra si está vinculado) */}
											{isLinked && (
												<div className="flex items-center gap-2">
													<span className="text-xs text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70">
														¿Obligatorio?
													</span>
													<SwappToggle
														checked={isRequired}
														onChange={(val) =>
															toggleRequired(attr.attribute_id, val)
														}
														id={`req_${attr.attribute_id}`}
													/>
												</div>
											)}

											{/* Botón Vincular/Desvincular con Hover en Rojo estandarizado */}
											<button
												onClick={() =>
													toggleLink(attr.attribute_id, isLinked, false)
												}
												className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
													isLinked
														? "bg-swapp-verde-oscuro text-swapp-blanco hover:bg-red-500/10 hover:text-red-600 dark:bg-swapp-verde-menta dark:text-swapp-azul-oscuro dark:hover:bg-red-500/10 dark:hover:text-red-400 border border-transparent hover:border-red-500/30"
														: "bg-swapp-blanco/50 dark:bg-swapp-azul-petroleo/30 text-swapp-azul-petroleo dark:text-swapp-tiza-verdoso hover:bg-swapp-verde-oscuro hover:text-swapp-blanco dark:hover:bg-swapp-verde-menta dark:hover:text-swapp-azul-oscuro border border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo"
												}`}>
												{isLinked ? (
													<>
														Vincular <CheckCircle2 className="h-3.5 w-3.5" />
													</>
												) : (
													<>
														Vincular <Circle className="h-3.5 w-3.5" />
													</>
												)}
											</button>
										</div>
									</div>
								);
							})}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
