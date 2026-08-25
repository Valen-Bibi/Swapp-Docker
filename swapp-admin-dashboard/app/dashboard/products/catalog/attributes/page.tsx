"use client";

import React, { useEffect, useState } from "react";
import { Tags, Plus, Trash2, X, Settings2, Box } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/layout/PageHeader";
import TableSkeleton from "@/components/tables/TableSkeleton";
import { SwappInput } from "@/components/ui/SwappInput";
import { SwappToggle } from "@/components/ui/SwappToggle";
import { SwappTooltip } from "@/components/ui/SwappTooltip";
import { ProductService } from "@/services/product.service"; // <-- AHORA USAMOS TU SERVICIO

// --- TIPADOS ---
interface AttributeValue {
	value_id: number;
	value_uuid: string;
	value: string;
	is_active: boolean;
}

interface Attribute {
	attribute_id: number;
	attribute_uuid: string;
	name: string;
	is_variant: boolean;
	is_active: boolean;
	values: AttributeValue[];
}

export default function AttributesPage() {
	const [attributes, setAttributes] = useState<Attribute[]>([]);
	const [loading, setLoading] = useState(true);

	// Estados de Modales
	const [isNewModalOpen, setIsNewModalOpen] = useState(false);
	const [isAddValueModalOpen, setIsAddValueModalOpen] = useState<{
		isOpen: boolean;
		attributeId: number | null;
		attributeName: string;
	}>({ isOpen: false, attributeId: null, attributeName: "" });

	// Estados de Formularios
	const [newAttrName, setNewAttrName] = useState("");
	const [newAttrIsVariant, setNewAttrIsVariant] = useState(false);
	const [newAttrValues, setNewAttrValues] = useState<string[]>([]);
	const [tempValueInput, setTempValueInput] = useState("");

	const [newValueString, setNewValueString] = useState("");
	const [isSaving, setIsSaving] = useState(false);

	const fetchAttributes = async () => {
		try {
			const data = await ProductService.getAttributes();
			setAttributes(data);
		} catch (error) {
			toast.error("No se pudo cargar el diccionario de atributos.");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchAttributes();
	}, []);

	// --- HANDLERS: CREAR ATRIBUTO NUEVO ---
	const handleAddTempNewValue = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter" && tempValueInput.trim() !== "") {
			e.preventDefault();
			if (newAttrValues.includes(tempValueInput.trim())) {
				toast.error("Ese valor ya está en la lista.");
				return;
			}
			setNewAttrValues([...newAttrValues, tempValueInput.trim()]);
			setTempValueInput("");
		}
	};

	const removeTempValue = (val: string) => {
		setNewAttrValues(newAttrValues.filter((v) => v !== val));
	};

	const handleCreateAttribute = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!newAttrName.trim()) return toast.error("El nombre es obligatorio.");

		setIsSaving(true);
		const toastId = toast.loading("Creando atributo...");

		try {
			await ProductService.createAttribute({
				name: newAttrName.trim(),
				is_variant: newAttrIsVariant,
				values: newAttrValues,
			});

			toast.success("Atributo creado exitosamente", { id: toastId });
			setIsNewModalOpen(false);

			// Reset form
			setNewAttrName("");
			setNewAttrIsVariant(false);
			setNewAttrValues([]);

			fetchAttributes();
		} catch (error: any) {
			toast.error(error.response?.data?.detail || "Error al crear", {
				id: toastId,
			});
		} finally {
			setIsSaving(false);
		}
	};

	// --- HANDLERS: AGREGAR Y ELIMINAR VALORES (EXISTENTES) ---
	const handleAddSingleValue = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!newValueString.trim() || !isAddValueModalOpen.attributeId) return;

		setIsSaving(true);
		const toastId = toast.loading("Agregando valor al diccionario...");

		try {
			await ProductService.addAttributeValue(isAddValueModalOpen.attributeId, {
				value: newValueString.trim(),
				display_order: 0,
			});

			toast.success("Valor agregado", { id: toastId });
			setIsAddValueModalOpen({
				isOpen: false,
				attributeId: null,
				attributeName: "",
			});
			setNewValueString("");
			fetchAttributes();
		} catch (error: any) {
			toast.error(error.response?.data?.detail || "Error al agregar valor", {
				id: toastId,
			});
		} finally {
			setIsSaving(false);
		}
	};

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

	if (loading) return <TableSkeleton />;

	return (
		<div className="p-6 relative">
			<div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<PageHeader
					title="Atributos"
					description="Diccionario normalizado (PIM) para estandarización de catálogo"
					icon={Tags}
				/>
				<button
					onClick={() => setIsNewModalOpen(true)}
					className="inline-flex items-center gap-2 rounded-lg bg-swapp-turquesa-oscuro dark:bg-swapp-menta px-4 py-2 text-sm font-medium text-swapp-blanco dark:text-swapp-negro-azulado hover:bg-swapp-azul-oceano dark:hover:bg-swapp-verde-agua transition-colors">
					<Plus className="h-4 w-4" /> Nuevo Atributo
				</button>
			</div>

			<div className="overflow-hidden rounded-xl border border-swapp-tiza dark:border-swapp-azul-petroleo bg-swapp-blanco dark:bg-swapp-negro-azulado shadow-sm transition-colors">
				<table className="w-full text-left text-sm text-swapp-azul-petroleo dark:text-swapp-tiza">
					<thead className="bg-swapp-tiza/50 dark:bg-swapp-azul-petroleo/30 text-swapp-negro-azulado dark:text-swapp-tiza select-none">
						<tr>
							<th className="px-6 py-4 font-semibold w-1/4">Atributo</th>
							<th className="px-6 py-4 font-semibold w-1/5">Comportamiento</th>
							<th className="px-6 py-4 font-semibold w-2/4">
								Valores Normalizados (Diccionario)
							</th>
							<th className="px-6 py-4 font-semibold text-right">Acciones</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-swapp-tiza dark:divide-swapp-azul-petroleo">
						{attributes.length === 0 ? (
							<tr>
								<td
									colSpan={4}
									className="px-6 py-12 text-center text-swapp-azul-petroleo/50 dark:text-swapp-tiza/50">
									No hay atributos registrados. Creá el primero para armar tu
									PIM.
								</td>
							</tr>
						) : (
							attributes.map((attr) => (
								<tr
									key={attr.attribute_id}
									className="transition-colors hover:bg-swapp-tiza/30 dark:hover:bg-swapp-azul-petroleo/30">
									<td className="px-6 py-4 font-medium text-swapp-negro-azulado dark:text-swapp-blanco">
										{attr.name}
									</td>
									<td className="px-6 py-4">
										{attr.is_variant ? (
											<SwappTooltip text="Divide el inventario. Ej: Creará distintas opciones físicas de compra.">
												<span className="inline-flex items-center gap-1.5 rounded-full bg-swapp-turquesa-oscuro/10 px-2.5 py-1 text-xs font-semibold text-swapp-turquesa-oscuro dark:bg-swapp-menta/10 dark:text-swapp-menta cursor-help">
													<Settings2 className="h-3 w-3" /> Variante (Física)
												</span>
											</SwappTooltip>
										) : (
											<SwappTooltip text="Informativo a nivel carcasa. Ej: Ficha técnica.">
												<span className="inline-flex items-center gap-1.5 rounded-full bg-swapp-azul-petroleo/10 px-2.5 py-1 text-xs font-semibold text-swapp-azul-petroleo dark:bg-swapp-tiza/10 dark:text-swapp-tiza cursor-help">
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
													className="group flex items-center gap-1 rounded-md border border-swapp-tiza/80 dark:border-swapp-azul-petroleo/80 bg-swapp-tiza/20 dark:bg-swapp-azul-petroleo/20 pl-2 pr-1 py-0.5 text-xs text-swapp-azul-petroleo dark:text-swapp-tiza transition-colors">
													<span>{v.value}</span>
													<button
														onClick={() => handleDeleteValue(v.value_id)}
														className="text-red-500/0 group-hover:text-red-500/80 hover:bg-red-500/10 rounded-sm p-0.5 transition-all"
														title="Eliminar valor">
														<X className="h-3 w-3" />
													</button>
												</div>
											))}
											<button
												onClick={() =>
													setIsAddValueModalOpen({
														isOpen: true,
														attributeId: attr.attribute_id,
														attributeName: attr.name,
													})
												}
												className="flex items-center justify-center h-6 w-6 rounded-md border border-dashed border-swapp-azul-petroleo/30 dark:border-swapp-tiza/30 text-swapp-azul-petroleo/50 dark:text-swapp-tiza/50 hover:border-swapp-turquesa-oscuro hover:text-swapp-turquesa-oscuro dark:hover:border-swapp-menta dark:hover:text-swapp-menta transition-colors"
												title="Añadir nuevo valor">
												<Plus className="h-3.5 w-3.5" />
											</button>
										</div>
									</td>
									<td className="px-6 py-4 text-right">
										<div className="flex items-center justify-end gap-2">
											<button
												className="p-1.5 rounded-md text-swapp-azul-petroleo/40 hover:text-red-500 hover:bg-red-500/10 transition-colors"
												title="Eliminar Atributo (Próximamente)">
												<Trash2 className="h-4 w-4" />
											</button>
										</div>
									</td>
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>

			{/* MODAL: NUEVO ATRIBUTO COMPLETO */}
			{isNewModalOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-swapp-negro/50 dark:bg-swapp-negro/70 backdrop-blur-sm p-4 animate-in fade-in">
					<div className="w-full max-w-lg rounded-xl bg-swapp-blanco dark:bg-swapp-negro-azulado p-6 shadow-2xl border-t-4 border-swapp-turquesa-oscuro dark:border-swapp-menta">
						<div className="mb-6 flex items-center justify-between">
							<div>
								<h2 className="text-xl font-bold text-swapp-negro-azulado dark:text-swapp-blanco">
									Crear Nuevo Atributo
								</h2>
								<p className="text-sm text-swapp-azul-petroleo/70 dark:text-swapp-tiza/70 mt-1">
									Definí la entidad y sus valores permitidos.
								</p>
							</div>
							<button
								onClick={() => setIsNewModalOpen(false)}
								className="text-swapp-azul-petroleo/50 hover:text-swapp-negro-azulado dark:text-swapp-tiza/50 dark:hover:text-swapp-blanco transition-colors">
								<X className="h-5 w-5" />
							</button>
						</div>

						<form onSubmit={handleCreateAttribute} className="space-y-6">
							<div className="space-y-6">
								<SwappInput
									label="Nombre del Atributo (Ej: Color, Voltaje, Talle)"
									required
									value={newAttrName}
									onChange={(e) => setNewAttrName(e.target.value)}
								/>

								<div className="flex items-start justify-between rounded-lg border border-swapp-tiza dark:border-swapp-azul-petroleo p-4 bg-swapp-tiza/10 dark:bg-swapp-azul-petroleo/10">
									<div className="space-y-1">
										<p className="text-sm font-semibold text-swapp-negro-azulado dark:text-swapp-blanco">
											¿Es un Atributo Variante?
										</p>
										<p className="text-xs text-swapp-azul-petroleo/70 dark:text-swapp-tiza/70 max-w-[280px]">
											Si activás esto, este atributo exigirá crear una variante
											física de inventario (Ej: Color, Talle). Si queda
											inactivo, será un dato de ficha técnica (Ej: Material,
											Bluetooth).
										</p>
									</div>
									<div className="pt-1">
										<SwappToggle
											checked={newAttrIsVariant}
											onChange={setNewAttrIsVariant}
											id="is_variant_toggle"
										/>
									</div>
								</div>

								<div className="space-y-2 border-t border-swapp-tiza dark:border-swapp-azul-petroleo pt-4">
									<label className="block text-sm font-medium text-swapp-azul-petroleo dark:text-swapp-tiza">
										Valores Iniciales (Opcional)
									</label>
									<div className="flex gap-2">
										<input
											type="text"
											className="w-full rounded-md border border-swapp-tiza dark:border-swapp-azul-petroleo bg-transparent px-3 py-2 text-sm outline-none focus:border-swapp-turquesa-oscuro dark:focus:border-swapp-menta"
											placeholder="Ej: Rojo (y presioná Enter)"
											value={tempValueInput}
											onChange={(e) => setTempValueInput(e.target.value)}
											onKeyDown={handleAddTempNewValue}
										/>
									</div>
									{newAttrValues.length > 0 && (
										<div className="flex flex-wrap gap-2 pt-3">
											{newAttrValues.map((val, idx) => (
												<div
													key={idx}
													className="flex items-center gap-1.5 rounded-full bg-swapp-turquesa-oscuro/10 dark:bg-swapp-menta/10 px-3 py-1 text-sm font-medium text-swapp-turquesa-oscuro dark:text-swapp-menta border border-swapp-turquesa-oscuro/20 dark:border-swapp-menta/20">
													{val}
													<button
														type="button"
														onClick={() => removeTempValue(val)}
														className="text-swapp-turquesa-oscuro/60 hover:text-red-500 transition-colors">
														<X className="h-3.5 w-3.5" />
													</button>
												</div>
											))}
										</div>
									)}
								</div>
							</div>

							<div className="flex justify-end gap-3 pt-4">
								<button
									type="button"
									onClick={() => setIsNewModalOpen(false)}
									className="px-4 py-2 text-sm font-medium text-swapp-azul-petroleo hover:bg-swapp-tiza rounded-lg transition-colors">
									Cancelar
								</button>
								<button
									type="submit"
									disabled={isSaving}
									className="bg-swapp-turquesa-oscuro text-swapp-blanco hover:bg-swapp-azul-oceano px-6 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
									{isSaving ? "Guardando..." : "Crear Atributo"}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* MODAL: AGREGAR VALOR RÁPIDO */}
			{isAddValueModalOpen.isOpen && (
				<div className="fixed inset-0 z-[100] flex items-center justify-center bg-swapp-negro/50 dark:bg-swapp-negro/70 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95">
					<div className="w-full max-w-sm rounded-xl bg-swapp-blanco dark:bg-swapp-negro-azulado p-5 shadow-2xl border-t-4 border-swapp-turquesa-oscuro dark:border-swapp-menta">
						<div className="mb-4 flex items-center justify-between">
							<h3 className="text-lg font-bold text-swapp-negro-azulado dark:text-swapp-blanco">
								Nuevo valor para "{isAddValueModalOpen.attributeName}"
							</h3>
							<button
								onClick={() =>
									setIsAddValueModalOpen({
										isOpen: false,
										attributeId: null,
										attributeName: "",
									})
								}
								className="text-swapp-azul-petroleo/50 hover:text-swapp-negro-azulado transition-colors">
								<X className="h-4 w-4" />
							</button>
						</div>
						<form onSubmit={handleAddSingleValue} className="space-y-4">
							<SwappInput
								label="Valor Normalizado"
								required
								autoFocus
								placeholder="Ej: Extra Large"
								value={newValueString}
								onChange={(e) => setNewValueString(e.target.value)}
							/>
							<button
								type="submit"
								disabled={isSaving}
								className="w-full bg-swapp-turquesa-oscuro text-swapp-blanco hover:bg-swapp-azul-oceano py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
								{isSaving ? "Guardando..." : "Añadir al Diccionario"}
							</button>
						</form>
					</div>
				</div>
			)}
		</div>
	);
}
