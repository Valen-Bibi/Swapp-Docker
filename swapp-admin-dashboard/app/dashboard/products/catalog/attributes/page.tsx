"use client";

import React, { useEffect, useState } from "react";
import { Tags, Plus, Trash2, X, Settings2, Box } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/layout/PageHeader";
import TableSkeleton from "@/components/tables/TableSkeleton";
import { SwappTooltip } from "@/components/ui/SwappTooltip";
import { ProductService } from "@/services/product.service";
import { AttributeValue, Attribute } from "@/types/product";
import NewAttributeModal from "@/components/products/NewAttributeModal";
import NewAttributeValueModal from "@/components/products/NewAttributeValueModal";

export default function AttributesPage() {
	const [attributes, setAttributes] = useState<Attribute[]>([]);
	const [loading, setLoading] = useState(true);

	const [isNewModalOpen, setIsNewModalOpen] = useState(false);
	const [addValueConfig, setAddValueConfig] = useState<{
		isOpen: boolean;
		attributeId: number | null;
		attributeName: string;
	}>({ isOpen: false, attributeId: null, attributeName: "" });

	const fetchAttributes = async () => {
		try {
			const data = await ProductService.getAttributes();
			const activeAttributes = data.filter((attr: Attribute) => attr.is_active);
			setAttributes(activeAttributes);
		} catch (error) {
			toast.error("No se pudo cargar el diccionario de atributos.");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchAttributes();
	}, []);

	const handleDeleteValue = async (valueId: number) => {
		const toastId = toast.loading("Eliminando valor...");
		try {
			await ProductService.deleteAttributeValue(valueId);
			toast.success("Valor eliminado", { id: toastId });
			fetchAttributes();
		} catch (error: any) {
			toast.error(error.response?.data?.detail || "Error al eliminar valor", {
				id: toastId,
			});
		}
	};

	const handleDeleteAttribute = async (attributeId: number) => {
		const confirmed = window.confirm(
			"¿Estás seguro de que querés archivar este atributo? Dejará de estar disponible para nuevos productos y subcategorías.",
		);
		if (!confirmed) return;

		const toastId = toast.loading("Archivando atributo...");
		try {
			await ProductService.deleteAttribute(attributeId);
			toast.success("Atributo archivado correctamente", { id: toastId });
			fetchAttributes();
		} catch (error: any) {
			toast.error(
				error.response?.data?.detail || "Error al archivar el atributo",
				{
					id: toastId,
				},
			);
		}
	};

	if (loading) return <TableSkeleton />;

	return (
		<div className="p-6 relative">
			{/* CONTROLES Y HEADER */}
			<div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<PageHeader
					title="Atributos"
					description="Diccionario normalizado (PIM) para estandarización de catálogo"
					icon={Tags}
				/>
				<div className="flex items-center gap-4">
					<SwappTooltip text="Crear un nuevo atributo">
						<button
							onClick={() => setIsNewModalOpen(true)}
							className="inline-flex items-center gap-2 rounded-lg bg-swapp-verde-pastel dark:bg-swapp-verde-menta px-4 py-2 text-sm font-medium text-swapp-blanco dark:text-swapp-azul-oscuro transition-colors hover:bg-swapp-verde-oscuro dark:hover:bg-swapp-verde-pastel disabled:opacity-50">
							<Plus className="h-4 w-4" /> Nuevo Atributo
						</button>
					</SwappTooltip>
				</div>
			</div>

			{/* CONTENEDOR DE TABLA (GLASSMORPHISM) */}
			<div className="rounded-xl border border-swapp-tiza-verdoso/60 dark:border-swapp-azul-petroleo/60 bg-swapp-blanco/40 dark:bg-swapp-azul-oscuro/40 backdrop-blur-sm shadow-sm transition-all duration-300 overflow-visible sm:overflow-auto">
				<table className="w-full text-left text-sm text-swapp-azul-petroleo dark:text-swapp-tiza-verdoso">
					<thead className="bg-swapp-tiza-verdoso/30 dark:bg-swapp-azul-petroleo/20 border-b border-swapp-tiza-verdoso/60 dark:border-swapp-azul-petroleo/60 select-none">
						<tr>
							<th className="px-6 py-4 text-xs tracking-wider text-swapp-azul-petroleo/60 dark:text-swapp-tiza-verdoso/60 w-1/4">
								Atributo
							</th>
							<th className="px-6 py-4 text-xs tracking-wider text-swapp-azul-petroleo/60 dark:text-swapp-tiza-verdoso/60 w-1/5">
								Comportamiento
							</th>
							<th className="px-6 py-4 text-xs tracking-wider text-swapp-azul-petroleo/60 dark:text-swapp-tiza-verdoso/60 w-2/4">
								Valores Normalizados (Diccionario)
							</th>
							<th className="px-6 py-4 text-xs tracking-wider text-swapp-azul-petroleo/60 dark:text-swapp-tiza-verdoso/60 text-right">
								Acciones
							</th>
						</tr>
					</thead>
					<tbody className="">
						{attributes.length === 0 ? (
							<tr>
								<td
									colSpan={4}
									className="px-6 py-12 text-center text-swapp-azul-petroleo/50 dark:text-swapp-tiza-verdoso/50">
									No hay atributos registrados. Creá el primero para armar tu
									PIM.
								</td>
							</tr>
						) : (
							attributes.map((attr) => {
								// Lógica visual estandarizada para filas
								const baseRowClasses =
									"border-b border-swapp-tiza-verdoso/40 dark:border-swapp-azul-petroleo/40 last:border-0 transition-colors duration-200";
								const rowStatusStyle =
									"hover:bg-swapp-blanco/60 dark:hover:bg-swapp-azul-petroleo/20";

								return (
									<tr
										key={attr.attribute_id}
										className={`${baseRowClasses} ${rowStatusStyle}`}>
										<td className="px-6 py-4">
											<div className="flex items-center gap-2">
												<span className="font-medium text-swapp-azul-oscuro dark:text-swapp-blanco">
													{attr.name}
												</span>
												<SwappTooltip
													text={`Este diccionario tiene ${attr.values.length} ${attr.values.length === 1 ? "valor registrado" : "valores registrados"}`}>
													<span className="inline-flex cursor-help items-center justify-center rounded-full bg-swapp-tiza-verdoso dark:bg-swapp-azul-petroleo/50 px-2 py-0.5 text-[10px] font-bold text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70 border border-swapp-azul-petroleo/10 dark:border-swapp-tiza-verdoso/10 transition-colors hover:bg-swapp-verde-oscuro hover:text-swapp-blanco dark:hover:bg-swapp-verde-menta dark:hover:text-swapp-azul-oscuro">
														{attr.values.length}
													</span>
												</SwappTooltip>
											</div>
										</td>
										<td className="px-6 py-4">
											{attr.is_variant ? (
												<SwappTooltip text="Distintas opciones físicas de compra.">
													<span className="inline-flex items-center gap-1.5 rounded-full bg-swapp-verde-oscuro/10 px-2.5 py-1 text-xs font-semibold text-swapp-verde-oscuro dark:bg-swapp-verde-menta/10 dark:text-swapp-verde-menta cursor-default">
														<Settings2 className="h-3 w-3" /> Variante (Física)
													</span>
												</SwappTooltip>
											) : (
												<SwappTooltip text="Ficha técnica.">
													<span className="inline-flex items-center gap-1.5 rounded-full bg-swapp-azul-petroleo/10 px-2.5 py-1 text-xs font-semibold text-swapp-azul-petroleo dark:bg-swapp-tiza-verdoso/10 dark:text-swapp-tiza-verdoso cursor-default">
														<Box className="h-3 w-3" /> Estructural (Base)
													</span>
												</SwappTooltip>
											)}
										</td>
										<td className="px-6 py-4">
											<div className="flex flex-wrap gap-2 items-center">
												{attr.values.map((v) => (
													<div
														key={v.value_id}
														className="group flex items-center gap-1 rounded-md border border-swapp-tiza-verdoso/80 dark:border-swapp-azul-petroleo/80 bg-swapp-tiza-verdoso/20 dark:bg-swapp-azul-petroleo/20 pl-2 pr-1 py-0.5 text-xs text-swapp-azul-petroleo dark:text-swapp-tiza-verdoso transition-colors">
														<span>{v.value}</span>
														<SwappTooltip text="Eliminar Valor">
															<button
																onClick={() => handleDeleteValue(v.value_id)}
																className="text-red-500/0 group-hover:text-red-500/80 hover:bg-red-500/10 rounded-sm p-0.5 transition-all">
																<X className="h-3 w-3" />
															</button>
														</SwappTooltip>
													</div>
												))}
												<SwappTooltip text="Añadir Nuevo Valor">
													<button
														onClick={() =>
															setAddValueConfig({
																isOpen: true,
																attributeId: attr.attribute_id,
																attributeName: attr.name,
															})
														}
														className="flex items-center justify-center h-6 w-6 rounded-md border border-dashed border-swapp-azul-petroleo/30 dark:border-swapp-tiza-verdoso/30 text-swapp-azul-petroleo/50 dark:text-swapp-tiza-verdoso/50 hover:border-swapp-verde-oscuro hover:text-swapp-verde-oscuro dark:hover:border-swapp-verde-menta dark:hover:text-swapp-verde-menta transition-colors">
														<Plus className="h-3.5 w-3.5" />
													</button>
												</SwappTooltip>
											</div>
										</td>
										<td className="px-6 py-4 text-right">
											<div className="flex items-center justify-end gap-2">
												<SwappTooltip text="Archivar Atributo">
													<button
														onClick={() =>
															handleDeleteAttribute(attr.attribute_id)
														}
														className="p-1.5 rounded-md text-swapp-azul-petroleo/40 hover:text-red-500 dark:text-swapp-tiza-verdoso/40 hover:bg-red-500/10 transition-colors">
														<Trash2 className="h-4 w-4" />
													</button>
												</SwappTooltip>
											</div>
										</td>
									</tr>
								);
							})
						)}
					</tbody>
				</table>
			</div>

			{/* MODALES */}
			<NewAttributeModal
				isOpen={isNewModalOpen}
				onClose={() => setIsNewModalOpen(false)}
				onSuccess={fetchAttributes}
			/>

			<NewAttributeValueModal
				isOpen={addValueConfig.isOpen}
				onClose={() => setAddValueConfig({ ...addValueConfig, isOpen: false })}
				onSuccess={fetchAttributes}
				attributeId={addValueConfig.attributeId}
				attributeName={addValueConfig.attributeName}
			/>
		</div>
	);
}
