"use client";

import React, { useEffect, useState } from "react";
import { Tags, Plus, Trash2, X, Settings2, Box } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/layout/PageHeader";
import TableSkeleton from "@/components/tables/TableSkeleton";
import { SwappTooltip } from "@/components/ui/SwappTooltip";
import { ProductService } from "@/services/product.service";
import { AttributeValue, Attribute } from "@/types/product";
import NewAttributeModal from "@/components/products/modals/NewAttributeModal";
import NewAttributeValueModal from "@/components/products/modals/NewAttributeValueModal";

// --- NUEVOS COMPONENTES ESTANDARIZADOS ---
import GlassTableWrapper from "@/components/tables/GlassTableWrapper";
import GlassTableHead, { GlassTh } from "@/components/tables/GlassTableHead";
import TableActionIcon from "@/components/tables/TableActionIcon";
import StatusBadge from "@/components/ui/StatusBadge";

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
			"¿Estás seguro de que querés eliminar este atributo? Dejará de estar disponible para nuevos productos y subcategorías.",
		);
		if (!confirmed) return;

		const toastId = toast.loading("Eliminando atributo...");
		try {
			await ProductService.deleteAttribute(attributeId);
			toast.success("Atributo eliminado correctamente", { id: toastId });
			fetchAttributes();
		} catch (error: any) {
			toast.error(
				error.response?.data?.detail || "Error al eliminar el atributo",
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
					description="Diccionario de valores de atributos"
					icon={Tags}
				/>
				<div className="flex items-center gap-4">
					<SwappTooltip text="Crear un nuevo atributo">
						<button
							onClick={() => setIsNewModalOpen(true)}
							className="inline-flex items-center gap-2 rounded-xl bg-swapp-verde-pastel dark:bg-swapp-verde-menta px-4 py-2 text-sm font-medium text-swapp-blanco dark:text-swapp-azul-oscuro transition-colors hover:bg-swapp-verde-oscuro dark:hover:bg-swapp-verde-pastel disabled:opacity-50 shadow-sm">
							<Plus className="h-4 w-4" /> Nuevo Atributo
						</button>
					</SwappTooltip>
				</div>
			</div>

			{/* CONTENEDOR DE TABLA MODULARIZADO */}
			<GlassTableWrapper>
				<GlassTableHead>
					<GlassTh className="w-1/4">Atributo</GlassTh>
					<GlassTh className="w-1/5">Comportamiento</GlassTh>
					<GlassTh className="w-2/4">
						Valores Normalizados (Diccionario)
					</GlassTh>
					<GlassTh align="right">Acciones</GlassTh>
				</GlassTableHead>

				<tbody>
					{attributes.length === 0 ? (
						<tr>
							<td
								colSpan={4}
								className="px-6 py-12 text-center text-swapp-azul-petroleo/50 dark:text-swapp-tiza-verdoso/50">
								No hay atributos registrados. Creá el primero para armar tu PIM.
							</td>
						</tr>
					) : (
						attributes.map((attr) => {
							const baseRowClasses =
								"border-b border-swapp-azul-petroleo/10 dark:border-swapp-azul-petroleo/50 last:border-0 transition-colors duration-200";
							const rowStatusStyle =
								"hover:bg-swapp-blanco/80 dark:hover:bg-swapp-azul-petroleo/30";

							return (
								<tr
									key={attr.attribute_id}
									className={`${baseRowClasses} ${rowStatusStyle}`}>
									{/* ATRIBUTO */}
									<td className="px-6 py-4">
										<div className="flex items-center gap-2">
											<span className="font-bold text-swapp-azul-oscuro dark:text-swapp-blanco">
												{attr.name}
											</span>
											<SwappTooltip
												text={`Este atributo tiene ${attr.values.length} ${attr.values.length === 1 ? "valor registrado" : "valores registrados"}`}>
												<span className="inline-flex cursor-help items-center justify-center rounded-md bg-swapp-azul-petroleo/10 dark:bg-swapp-azul-petroleo/40 border border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo px-2 py-0.5 text-[10px] font-bold text-swapp-azul-petroleo dark:text-swapp-tiza-verdoso transition-colors hover:bg-swapp-verde-oscuro hover:text-swapp-blanco hover:border-swapp-verde-oscuro dark:hover:bg-swapp-verde-menta dark:hover:text-swapp-azul-oscuro dark:hover:border-swapp-verde-menta">
													{attr.values.length}
												</span>
											</SwappTooltip>
										</div>
									</td>

									{/* COMPORTAMIENTO (CON STATUS BADGE) */}
									<td className="px-6 py-4">
										{attr.is_variant ? (
											<SwappTooltip text="Distintas opciones físicas de compra.">
												{/* Agregamos el w-fit para que el tooltip no ocupe toda la celda */}
												<div className="w-fit">
													<StatusBadge variant="primary" icon={Settings2}>
														Variante (Física)
													</StatusBadge>
												</div>
											</SwappTooltip>
										) : (
											<SwappTooltip text="Ficha técnica.">
												<div className="w-fit">
													<StatusBadge variant="neutral" icon={Box}>
														Estructural (Base)
													</StatusBadge>
												</div>
											</SwappTooltip>
										)}
									</td>

									{/* VALORES NORMALIZADOS (CHIPS) */}
									<td className="px-6 py-4">
										<div className="flex flex-wrap gap-2 items-center">
											{attr.values.map((v) => (
												<div
													key={v.value_id}
													className="group flex items-center gap-1.5 rounded-md border border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo/40 bg-swapp-blanco/60 dark:bg-swapp-azul-oscuro/60 pl-2 pr-1.5 py-1 text-xs font-medium text-swapp-azul-petroleo dark:text-swapp-tiza-verdoso shadow-sm transition-all hover:border-red-500/30 hover:bg-red-500/5 dark:hover:border-red-500/30 dark:hover:bg-red-500/10">
													<span>{v.value}</span>
													<SwappTooltip text="Eliminar Valor">
														<button
															onClick={() => handleDeleteValue(v.value_id)}
															className="text-swapp-azul-petroleo/30 dark:text-swapp-tiza-verdoso/30 group-hover:text-red-500 transition-colors">
															<X className="h-3.5 w-3.5" />
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
													className="flex items-center justify-center h-7 w-7 rounded-md border border-dashed border-swapp-azul-petroleo/30 dark:border-swapp-tiza-verdoso/30 bg-swapp-azul-petroleo/5 dark:bg-swapp-azul-petroleo/20 text-swapp-azul-petroleo/60 dark:text-swapp-tiza-verdoso/60 hover:border-swapp-verde-oscuro hover:text-swapp-verde-oscuro hover:bg-swapp-verde-oscuro/10 dark:hover:border-swapp-verde-menta dark:hover:text-swapp-verde-menta dark:hover:bg-swapp-verde-menta/10 transition-colors shadow-sm">
													<Plus className="h-4 w-4" />
												</button>
											</SwappTooltip>
										</div>
									</td>

									{/* ACCIONES (CON TABLE ACTION ICON) */}
									<td className="px-6 py-4 text-right">
										<div className="flex items-center justify-end gap-2">
											<TableActionIcon
												icon={Trash2}
												tooltip="Eliminar Atributo"
												variant="danger"
												onClick={() => handleDeleteAttribute(attr.attribute_id)}
											/>
										</div>
									</td>
								</tr>
							);
						})
					)}
				</tbody>
			</GlassTableWrapper>

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
