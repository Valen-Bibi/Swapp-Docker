"use client";

import React, { useEffect, useState } from "react";
import { X, Lock, CheckCircle2, Circle } from "lucide-react";
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
		<div className="fixed inset-0 z-[100] flex items-center justify-center bg-swapp-negro/50 dark:bg-swapp-negro/70 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95">
			<div className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-xl bg-swapp-blanco dark:bg-swapp-negro-azulado shadow-2xl border-t-4 border-swapp-turquesa-oscuro dark:border-swapp-menta overflow-hidden">
				{/* HEADER */}
				<div className="p-6 border-b border-swapp-tiza dark:border-swapp-azul-petroleo flex items-center justify-between shrink-0">
					<div>
						<h2 className="text-xl font-bold text-swapp-negro-azulado dark:text-swapp-blanco flex items-center gap-2">
							<Lock className="h-5 w-5 text-swapp-turquesa-oscuro dark:text-swapp-menta" />
							Candado de Atributos
						</h2>
						<p className="text-sm text-swapp-azul-petroleo/70 dark:text-swapp-tiza/70 mt-1">
							Atributos exigidos para la subcategoría:{" "}
							<span className="font-semibold text-swapp-turquesa-oscuro dark:text-swapp-menta">
								{category.name}
							</span>
						</p>
					</div>
					<button
						onClick={onClose}
						className="text-swapp-azul-petroleo/50 hover:text-swapp-negro-azulado dark:text-swapp-tiza/50 dark:hover:text-swapp-blanco transition-colors">
						<X className="h-5 w-5" />
					</button>
				</div>

				{/* BODY */}
				<div className="p-6 overflow-y-auto flex-1">
					{loading ? (
						<div className="flex justify-center py-8">
							<div className="animate-spin h-6 w-6 border-2 border-swapp-turquesa-oscuro border-t-transparent rounded-full"></div>
						</div>
					) : allAttributes.length === 0 ? (
						<div className="text-center py-8 text-swapp-azul-petroleo/50 dark:text-swapp-tiza/50 text-sm">
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
										className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${isLinked ? "border-swapp-turquesa-oscuro bg-swapp-turquesa-oscuro/5 dark:border-swapp-menta dark:bg-swapp-menta/5" : "border-swapp-tiza dark:border-swapp-azul-petroleo bg-swapp-blanco dark:bg-swapp-negro-azulado hover:bg-swapp-tiza/20 dark:hover:bg-swapp-azul-petroleo/30"}`}>
										<div className="flex flex-col">
											<span className="font-medium text-sm text-swapp-negro-azulado dark:text-swapp-blanco">
												{attr.name}
											</span>
											<span className="text-xs text-swapp-azul-petroleo/60 dark:text-swapp-tiza/60">
												{attr.is_variant
													? "Variante Física (Afecta Stock)"
													: "Estructural (Ficha Técnica)"}
											</span>
										</div>

										<div className="flex items-center gap-6">
											{/* Toggle Requerido (Solo se muestra si está vinculado) */}
											{isLinked && (
												<div className="flex items-center gap-2">
													<span className="text-xs text-swapp-azul-petroleo/70 dark:text-swapp-tiza/70">
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

											{/* Botón Vincular/Desvincular */}
											<button
												onClick={() =>
													toggleLink(attr.attribute_id, isLinked, false)
												}
												className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${isLinked ? "bg-swapp-turquesa-oscuro text-swapp-blanco hover:bg-red-500" : "bg-swapp-tiza dark:bg-swapp-azul-petroleo text-swapp-azul-petroleo dark:text-swapp-tiza hover:bg-swapp-turquesa-oscuro hover:text-swapp-blanco dark:hover:bg-swapp-menta dark:hover:text-swapp-negro-azulado"}`}>
												{isLinked ? (
													<>
														Vincular <CheckCircle2 className="h-3.5 w-3.5" />
													</> // Al hacer hover se podría cambiar el texto a "Desvincular", pero como MVP así es claro
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
