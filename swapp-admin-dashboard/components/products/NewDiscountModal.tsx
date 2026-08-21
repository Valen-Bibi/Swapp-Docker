"use client";

import { useEffect, useState } from "react";
import {
	Tag,
	CalendarClock,
	X,
	AlertTriangle,
	CheckSquare,
} from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { SwappInput } from "@/components/ui/SwappInput";
import { Product } from "@/types/product";

export interface ProductDiscount {
	discount_id: number;
	product_id: number;
	product_uuid?: string;
	product_name?: string;
	variant_uuids?: string[]; // Modificado para el modelo de selección múltiple
	name: string;
	discount_type: string;
	value: number;
	start_date: string;
	end_date: string;
	is_active: boolean;
}

interface NewDiscountModalProps {
	isOpen: boolean;
	onClose: () => void;
	editingDiscount: ProductDiscount | null;
	products: Product[];
	allDiscounts: ProductDiscount[];
	onSuccess: () => void;
}

export default function NewDiscountModal({
	isOpen,
	onClose,
	editingDiscount,
	products,
	allDiscounts,
	onSuccess,
}: NewDiscountModalProps) {
	const [isSaving, setIsSaving] = useState(false);

	const [overlapWarning, setOverlapWarning] = useState<{
		show: boolean;
		existing?: ProductDiscount;
	} | null>(null);

	const [formData, setFormData] = useState({
		product_uuid: "",
		variant_uuids: [] as string[], // Ahora es un array
		name: "",
		discount_type: "percentage",
		value: "",
		start_date: "",
		end_date: "",
		is_active: true,
	});

	useEffect(() => {
		if (isOpen) {
			setOverlapWarning(null);
			if (editingDiscount) {
				setFormData({
					product_uuid: editingDiscount.product_uuid || "",
					variant_uuids: editingDiscount.variant_uuids || [],
					name: editingDiscount.name,
					discount_type: editingDiscount.discount_type,
					value: editingDiscount.value.toString(),
					start_date: new Date(editingDiscount.start_date)
						.toISOString()
						.slice(0, 16),
					end_date: new Date(editingDiscount.end_date)
						.toISOString()
						.slice(0, 16),
					is_active: editingDiscount.is_active,
				});
			} else {
				setFormData({
					product_uuid: "",
					variant_uuids: [],
					name: "",
					discount_type: "percentage",
					value: "",
					start_date: "",
					end_date: "",
					is_active: true,
				});
			}
		}
	}, [isOpen, editingDiscount]);

	if (!isOpen) return null;

	const handleVariantToggle = (uuid: string) => {
		setFormData((prev) => {
			if (prev.variant_uuids.includes(uuid)) {
				return {
					...prev,
					variant_uuids: prev.variant_uuids.filter((id) => id !== uuid),
				};
			} else {
				return { ...prev, variant_uuids: [...prev.variant_uuids, uuid] };
			}
		});
	};

	const setGlobalScope = () => {
		setFormData((prev) => ({ ...prev, variant_uuids: [] }));
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const newStart = new Date(formData.start_date);
		const newEnd = new Date(formData.end_date);

		if (newEnd <= newStart) {
			toast.error(
				"La fecha de finalización debe ser posterior a la de inicio.",
			);
			return;
		}

		// VALIDACIÓN DE SOLAPAMIENTO INTELIGENTE (Arrays)
		const overlapping = allDiscounts.find((d) => {
			if (editingDiscount && d.discount_id === editingDiscount.discount_id)
				return false;
			if (d.product_uuid !== formData.product_uuid) return false;
			if (!d.is_active) return false;

			const oldStart = new Date(d.start_date);
			const oldEnd = new Date(d.end_date);
			const datesOverlap = newStart < oldEnd && newEnd > oldStart;

			if (!datesOverlap) return false;

			// Choque de alcance:
			// 1. Si alguna de las dos es global (array vacío), se pisan en todo el producto.
			// 2. Si ambas son específicas, revisamos si comparten algún variant_uuid.
			const dIsGlobal = !d.variant_uuids || d.variant_uuids.length === 0;
			const formIsGlobal = formData.variant_uuids.length === 0;

			if (dIsGlobal || formIsGlobal) return true;

			return d.variant_uuids!.some((uuid) =>
				formData.variant_uuids.includes(uuid),
			);
		});

		if (overlapping) {
			setOverlapWarning({ show: true, existing: overlapping });
			return;
		}

		executeSave();
	};

	const executeSave = async (resolution?: "replace" | "trim") => {
		setIsSaving(true);
		const toastId = toast.loading(
			resolution ? "Resolviendo y guardando..." : "Guardando oferta...",
		);

		try {
			if (overlapWarning?.existing) {
				const existingId = overlapWarning.existing.discount_id;

				if (resolution === "replace") {
					await api.patch(
						`/api/products/admin/discounts/${existingId}/toggle`,
						{ is_active: false },
					);
				} else if (resolution === "trim") {
					await api.put(`/api/products/admin/discounts/${existingId}`, {
						end_date: new Date(formData.start_date).toISOString(),
					});
				}
			}

			const payload = {
				product_uuid: formData.product_uuid,
				variant_uuids: formData.variant_uuids, // Enviamos el array tal cual
				name: formData.name,
				discount_type: formData.discount_type,
				value: parseFloat(formData.value),
				start_date: new Date(formData.start_date).toISOString(),
				end_date: new Date(formData.end_date).toISOString(),
				is_active: formData.is_active,
			};

			if (editingDiscount) {
				await api.put(
					`/api/products/admin/discounts/${editingDiscount.discount_id}`,
					payload,
				);
			} else {
				await api.post("/api/products/admin/discounts", payload);
			}

			toast.success("Oferta aplicada exitosamente", { id: toastId });
			onSuccess();
			onClose();
		} catch (error: any) {
			toast.error(error.response?.data?.detail || "Error al guardar.", {
				id: toastId,
			});
		} finally {
			setIsSaving(false);
		}
	};

	const selectedProductObj = products.find(
		(p) => p.product_uuid === formData.product_uuid,
	);
	const isGlobalScope = formData.variant_uuids.length === 0;

	if (overlapWarning?.show && overlapWarning.existing) {
		const oldStart = new Date(overlapWarning.existing.start_date);
		const newStart = new Date(formData.start_date);
		const canTrim = oldStart < newStart;

		const existingIsGlobal =
			!overlapWarning.existing.variant_uuids ||
			overlapWarning.existing.variant_uuids.length === 0;

		return (
			<div className="fixed inset-0 z-50 flex items-center justify-center bg-swapp-negro/50 dark:bg-swapp-negro/70 backdrop-blur-sm p-4">
				<div className="w-full max-w-md rounded-xl bg-swapp-blanco dark:bg-swapp-negro-azulado p-6 shadow-2xl border-t-4 border-amber-500 animate-in fade-in zoom-in-95">
					<div className="flex items-center gap-3 mb-4 text-amber-600 dark:text-amber-500">
						<AlertTriangle className="h-6 w-6" />
						<h2 className="text-xl font-bold">Conflicto de Fechas y Alcance</h2>
					</div>

					<p className="text-sm text-swapp-azul-petroleo dark:text-swapp-tiza mb-6">
						El producto ya tiene la oferta{" "}
						<strong className="text-swapp-turquesa-oscuro dark:text-swapp-menta">
							"{overlapWarning.existing.name}"
						</strong>{" "}
						activa que afecta a{" "}
						{existingIsGlobal
							? "todo el catálogo del producto"
							: "algunas de las variantes seleccionadas"}{" "}
						en estas fechas. ¿Qué deseas hacer?
					</p>

					<div className="space-y-3">
						<button
							type="button"
							onClick={() => executeSave("replace")}
							className="w-full text-left p-4 rounded-lg border border-swapp-tiza hover:border-red-500 hover:bg-red-50 dark:border-swapp-azul-petroleo dark:hover:bg-red-500/10 transition-colors">
							<span className="font-bold block text-sm text-swapp-negro-azulado dark:text-swapp-blanco">
								1. Reemplazar oferta antigua
							</span>
							<span className="text-xs text-swapp-azul-petroleo/70 dark:text-swapp-tiza/70">
								La oferta existente será desactivada.
							</span>
						</button>

						<button
							type="button"
							onClick={() => setOverlapWarning(null)}
							className="w-full text-left p-4 rounded-lg border border-swapp-tiza hover:border-swapp-azul-oceano hover:bg-swapp-tiza/30 dark:border-swapp-azul-petroleo dark:hover:bg-swapp-azul-petroleo/30 transition-colors">
							<span className="font-bold block text-sm text-swapp-negro-azulado dark:text-swapp-blanco">
								2. Conservar oferta antigua
							</span>
							<span className="text-xs text-swapp-azul-petroleo/70 dark:text-swapp-tiza/70">
								Cancela este guardado para ajustar tus fechas o alcance.
							</span>
						</button>

						{canTrim && (
							<button
								type="button"
								onClick={() => executeSave("trim")}
								className="w-full text-left p-4 rounded-lg border border-swapp-turquesa-oscuro bg-swapp-turquesa-oscuro/5 hover:bg-swapp-turquesa-oscuro/10 dark:border-swapp-menta dark:bg-swapp-menta/5 dark:hover:bg-swapp-menta/10 transition-colors">
								<span className="font-bold block text-sm text-swapp-turquesa-oscuro dark:text-swapp-menta">
									3. Mantener hasta el inicio de la nueva
								</span>
								<span className="text-xs text-swapp-azul-petroleo/70 dark:text-swapp-tiza/70">
									Corta la fecha de fin de la oferta anterior exactamente cuando
									empiece esta.
								</span>
							</button>
						)}
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-swapp-negro/50 dark:bg-swapp-negro/70 backdrop-blur-sm p-4">
			<div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl bg-swapp-blanco dark:bg-swapp-negro-azulado p-6 shadow-2xl border-t-4 border-swapp-turquesa-oscuro dark:border-swapp-menta custom-scrollbar">
				<div className="mb-4 flex items-center justify-between">
					<h2 className="text-xl font-bold text-swapp-negro-azulado dark:text-swapp-blanco flex items-center gap-2">
						<Tag className="h-5 w-5 text-swapp-turquesa-oscuro dark:text-swapp-menta" />
						{editingDiscount ? "Editar Oferta" : "Nueva Oferta"}
					</h2>
					<button
						onClick={onClose}
						className="text-swapp-azul-petroleo/50 dark:text-swapp-tiza/50 hover:text-swapp-negro-azulado">
						<X className="h-5 w-5" />
					</button>
				</div>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-1">
						<label className="block text-sm font-medium text-swapp-azul-petroleo dark:text-swapp-tiza">
							Producto Asociado
						</label>
						<select
							required
							disabled={!!editingDiscount}
							className="w-full rounded-md border border-swapp-tiza dark:border-swapp-azul-petroleo bg-swapp-blanco dark:bg-swapp-negro-azulado px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-swapp-turquesa-oscuro disabled:opacity-50"
							value={formData.product_uuid}
							onChange={(e) =>
								setFormData({
									...formData,
									product_uuid: e.target.value,
									variant_uuids: [], // Reseteamos al cambiar de producto
								})
							}>
							<option value="">Seleccione un producto...</option>
							{products.map((p) => (
								<option
									key={p.product_uuid}
									value={p.product_uuid}
									className="bg-swapp-blanco dark:bg-swapp-negro-azulado">
									{p.name}
								</option>
							))}
						</select>
					</div>

					{/* NUEVO CAMPO: Selector Múltiple Estilizado */}
					{formData.product_uuid &&
						selectedProductObj?.variants &&
						selectedProductObj.variants.length > 0 && (
							<div className="space-y-2 animate-in fade-in slide-in-from-top-2">
								<label className="flex items-center gap-2 text-sm font-medium text-swapp-azul-petroleo dark:text-swapp-tiza">
									<CheckSquare className="h-4 w-4" /> Alcance de la Oferta
								</label>

								<div
									className={`flex flex-col gap-1 max-h-48 overflow-y-auto rounded-md border border-swapp-tiza dark:border-swapp-azul-petroleo bg-swapp-tiza/10 dark:bg-swapp-azul-petroleo/10 p-2 custom-scrollbar ${!!editingDiscount ? "opacity-60 pointer-events-none" : ""}`}>
									{/* Opción Global */}
									<label className="flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-swapp-tiza/50 dark:hover:bg-swapp-azul-petroleo/50 transition-colors">
										<input
											type="checkbox"
											className="h-4 w-4 rounded border-swapp-tiza text-swapp-turquesa-oscuro focus:ring-swapp-turquesa-oscuro dark:bg-swapp-negro-azulado dark:border-swapp-azul-petroleo"
											checked={isGlobalScope}
											onChange={setGlobalScope}
										/>
										<span
											className={`text-sm ${isGlobalScope ? "font-bold text-swapp-turquesa-oscuro dark:text-swapp-menta" : "text-swapp-negro-azulado dark:text-swapp-blanco"}`}>
											Aplicar a todas las variantes (Global)
										</span>
									</label>

									<div className="my-1 border-t border-swapp-tiza dark:border-swapp-azul-petroleo/50"></div>

									{/* Opciones Específicas */}
									{selectedProductObj.variants.map((v) => (
										<label
											key={v.variant_uuid}
											className="flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-swapp-tiza/50 dark:hover:bg-swapp-azul-petroleo/50 transition-colors">
											<input
												type="checkbox"
												className="h-4 w-4 rounded border-swapp-tiza text-swapp-turquesa-oscuro focus:ring-swapp-turquesa-oscuro dark:bg-swapp-negro-azulado dark:border-swapp-azul-petroleo"
												checked={formData.variant_uuids.includes(
													v.variant_uuid!,
												)}
												onChange={() => handleVariantToggle(v.variant_uuid!)}
											/>
											<span className="text-sm text-swapp-azul-petroleo dark:text-swapp-tiza">
												SKU: {v.sku}
											</span>
										</label>
									))}
								</div>
							</div>
						)}

					<SwappInput
						label="Nombre de la Campaña (Ej: Oferta Mensual)"
						type="text"
						required
						value={formData.name}
						onChange={(e) => setFormData({ ...formData, name: e.target.value })}
					/>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-1">
							<label className="block text-sm font-medium text-swapp-azul-petroleo dark:text-swapp-tiza">
								Tipo de Rebaja
							</label>
							<select
								className="w-full rounded-md border border-swapp-tiza dark:border-swapp-azul-petroleo bg-swapp-blanco dark:bg-swapp-negro-azulado px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-swapp-turquesa-oscuro"
								value={formData.discount_type}
								onChange={(e) =>
									setFormData({ ...formData, discount_type: e.target.value })
								}>
								<option
									value="percentage"
									className="bg-swapp-blanco dark:bg-swapp-negro-azulado">
									Porcentaje (%)
								</option>
								<option
									value="fixed_amount"
									className="bg-swapp-blanco dark:bg-swapp-negro-azulado">
									Monto Fijo ($)
								</option>
							</select>
						</div>
						<SwappInput
							label="Valor"
							type="number"
							step="any"
							min="0"
							required
							placeholder={
								formData.discount_type === "percentage" ? "15" : "200.00"
							}
							value={formData.value}
							onChange={(e) =>
								setFormData({ ...formData, value: e.target.value })
							}
						/>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<SwappInput
							label="Fecha de Inicio"
							type="datetime-local"
							required
							value={formData.start_date}
							onChange={(e) =>
								setFormData({ ...formData, start_date: e.target.value })
							}
						/>
						<SwappInput
							label="Fecha de Finalización"
							type="datetime-local"
							required
							value={formData.end_date}
							onChange={(e) =>
								setFormData({ ...formData, end_date: e.target.value })
							}
						/>
					</div>

					<p className="text-xs text-swapp-azul-petroleo/60 dark:text-swapp-tiza/60 flex items-center gap-1">
						<CalendarClock className="h-3 w-3" />
						La oferta debe estar <strong>Activa</strong> y en el rango de fechas
						para reflejarse.
					</p>

					<div className="mt-6 flex justify-end gap-3 pt-4 border-t border-swapp-tiza dark:border-swapp-azul-petroleo">
						<button
							type="button"
							onClick={onClose}
							className="rounded-lg px-4 py-2 text-sm font-medium text-swapp-azul-petroleo dark:text-swapp-tiza hover:bg-swapp-tiza transition-colors">
							Cancelar
						</button>
						<button
							type="submit"
							disabled={isSaving}
							className="rounded-lg bg-swapp-turquesa-oscuro dark:bg-swapp-menta px-4 py-2 text-sm font-medium text-swapp-blanco dark:text-swapp-negro-azulado hover:bg-swapp-azul-oceano disabled:opacity-50">
							{isSaving ? "Guardando..." : "Guardar Oferta"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
