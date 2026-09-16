"use client";

import { useEffect, useState } from "react";
import {
	Tag,
	CalendarClock,
	X,
	AlertTriangle,
	CheckSquare,
	Save,
} from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { SwappInput } from "@/components/ui/SwappInput";
import { SwappSelect } from "@/components/ui/SwappSelect";
import { SwappCheckbox } from "@/components/ui/SwappCheckbox";
import { Product } from "@/types/product";

export interface ProductDiscount {
	discount_id: number;
	product_id: number;
	product_uuid?: string;
	product_name?: string;
	variant_uuids?: string[];
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
		variant_uuids: [] as string[],
		name: "",
		discount_type: "percentage",
		value: "",
		start_date: "",
		end_date: "",
		is_active: true,
	});

	// --- CERRAR CON ESCAPE ---
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape" && isOpen) {
				if (overlapWarning?.show) {
					setOverlapWarning(null); // Si está la advertencia abierta, solo cierra la advertencia
				} else {
					onClose(); // Sino, cierra el modal
				}
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [isOpen, onClose, overlapWarning]);

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

		const overlapping = allDiscounts.find((d) => {
			if (editingDiscount && d.discount_id === editingDiscount.discount_id)
				return false;
			if (d.product_uuid !== formData.product_uuid) return false;
			if (!d.is_active) return false;

			const oldStart = new Date(d.start_date);
			const oldEnd = new Date(d.end_date);
			const datesOverlap = newStart < oldEnd && newEnd > oldStart;

			if (!datesOverlap) return false;

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
				variant_uuids: formData.variant_uuids,
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

	// Opciones formateadas para SwappSelect
	const productOptions = products.map((p) => ({
		value: p.product_uuid,
		label: p.name + p.model,
	}));

	const discountTypeOptions = [
		{ value: "percentage", label: "Porcentaje (%)" },
		{ value: "fixed_amount", label: "Monto Fijo ($)" },
	];

	// --- MODAL DE ADVERTENCIA (OVERLAP) ESTANDARIZADO ---
	if (overlapWarning?.show && overlapWarning.existing) {
		const oldStart = new Date(overlapWarning.existing.start_date);
		const newStart = new Date(formData.start_date);
		const canTrim = oldStart < newStart;

		const existingIsGlobal =
			!overlapWarning.existing.variant_uuids ||
			overlapWarning.existing.variant_uuids.length === 0;

		return (
			<div className="fixed inset-0 z-[110] flex items-center justify-center bg-swapp-azul-petroleo/20 dark:bg-swapp-negro/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95">
				<div className="w-full max-w-md rounded-xl bg-swapp-blanco/80 dark:bg-swapp-azul-oscuro/80 backdrop-blur-md shadow-2xl border-t-4 border-t-amber-500 overflow-hidden transition-colors">
					<div className="p-6 border-b border-swapp-azul-petroleo/10 dark:border-swapp-azul-petroleo flex items-center gap-3 text-amber-600 dark:text-amber-500">
						<AlertTriangle className="h-6 w-6 shrink-0" />
						<h2 className="text-lg font-bold">Conflicto de Fechas y Alcance</h2>
					</div>

					<div className="p-6">
						<p className="text-sm text-swapp-azul-petroleo dark:text-swapp-tiza-verdoso mb-6">
							El producto ya tiene la oferta{" "}
							<strong className="text-swapp-verde-oscuro dark:text-swapp-verde-menta">
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
								className="w-full text-left p-4 rounded-lg border border-swapp-azul-petroleo/20 hover:border-red-500 hover:bg-red-50 dark:border-swapp-azul-petroleo dark:hover:bg-red-500/10 transition-colors">
								<span className="font-bold block text-sm text-swapp-azul-oscuro dark:text-swapp-blanco">
									1. Reemplazar oferta antigua
								</span>
								<span className="text-xs text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70">
									La oferta existente será desactivada.
								</span>
							</button>

							<button
								type="button"
								onClick={() => setOverlapWarning(null)}
								className="w-full text-left p-4 rounded-lg border border-swapp-azul-petroleo/20 hover:border-swapp-azul-oceano hover:bg-swapp-tiza-verdoso/30 dark:border-swapp-azul-petroleo dark:hover:bg-swapp-azul-petroleo/30 transition-colors">
								<span className="font-bold block text-sm text-swapp-azul-oscuro dark:text-swapp-blanco">
									2. Conservar oferta antigua
								</span>
								<span className="text-xs text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70">
									Cancela este guardado para ajustar tus fechas o alcance.
								</span>
							</button>

							{canTrim && (
								<button
									type="button"
									onClick={() => executeSave("trim")}
									className="w-full text-left p-4 rounded-lg border border-swapp-verde-oscuro bg-swapp-verde-oscuro/5 hover:bg-swapp-verde-oscuro/10 dark:border-swapp-verde-menta dark:bg-swapp-verde-menta/5 dark:hover:bg-swapp-verde-menta/10 transition-colors">
									<span className="font-bold block text-sm text-swapp-verde-oscuro dark:text-swapp-verde-menta">
										3. Mantener hasta el inicio de la nueva
									</span>
									<span className="text-xs text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70">
										Corta la fecha de fin de la oferta anterior exactamente
										cuando empiece esta.
									</span>
								</button>
							)}
						</div>
					</div>
				</div>
			</div>
		);
	}

	// --- MODAL PRINCIPAL ESTANDARIZADO ---
	return (
		<div className="fixed inset-0 z-[100] flex items-center justify-center bg-swapp-azul-petroleo/5 dark:bg-swapp-negro/30 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95">
			{/* CONTENEDOR SIN BORDES EXTERNOS */}
			<div className="w-full max-w-lg max-h-[90vh] flex flex-col rounded-xl bg-swapp-blanco/50 dark:bg-swapp-azul-oscuro/40 backdrop-blur-md shadow-2xl border-t-4 border-t-swapp-verde-oscuro dark:border-t-swapp-verde-menta overflow-hidden transition-colors">
				{/* HEADER ESTANDARIZADO */}
				<div className="p-6 border-b border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo flex items-center justify-between shrink-0 transition-colors">
					<h2 className="text-xl font-bold text-swapp-azul-oscuro dark:text-swapp-blanco flex items-center gap-2">
						<Tag className="h-5 w-5 text-swapp-verde-oscuro dark:text-swapp-verde-menta" />
						{editingDiscount ? "Editar Oferta" : "Nueva Oferta"}
					</h2>
					<button
						type="button"
						onClick={onClose}
						className="p-1 rounded-md text-swapp-azul-petroleo/50 dark:text-swapp-tiza-verdoso/50 hover:bg-red-500/10 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400 transition-colors">
						<X className="h-5 w-5" />
					</button>
				</div>

				<div className="p-6 overflow-y-auto custom-scrollbar flex-1">
					{/* HEREDAMOS TRANSPARENCIA A LOS INPUTS */}
					<form
						onSubmit={handleSubmit}
						className="space-y-5 [&_input]:!bg-transparent [&_select]:!bg-transparent">
						<SwappSelect
							label="Producto Asociado"
							placeholder="Seleccione un producto..."
							required
							disabled={!!editingDiscount}
							options={productOptions}
							value={formData.product_uuid}
							onChange={(e) =>
								setFormData({
									...formData,
									product_uuid: e.target.value,
									variant_uuids: [],
								})
							}
						/>

						{/* Selector Múltiple Estilizado (Alcance) con SwappCheckbox */}
						{formData.product_uuid &&
							selectedProductObj?.variants &&
							selectedProductObj.variants.length > 0 && (
								<div className="space-y-2 animate-in fade-in slide-in-from-top-2">
									<label className="flex items-center gap-2 text-sm font-medium text-swapp-azul-petroleo dark:text-swapp-tiza-verdoso">
										<CheckSquare className="h-4 w-4 text-swapp-verde-oscuro dark:text-swapp-verde-menta" />{" "}
										Alcance de la Oferta
									</label>

									<div
										className={`flex flex-col gap-1.5 max-h-48 overflow-y-auto rounded-md border border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo bg-swapp-azul-petroleo/5 dark:bg-swapp-azul-petroleo/20 p-3 custom-scrollbar transition-colors ${!!editingDiscount ? "opacity-60 pointer-events-none" : ""}`}>
										{/* Opción Global usando SwappCheckbox */}
										<div className="p-1 rounded hover:bg-swapp-blanco/50 dark:hover:bg-swapp-azul-petroleo/50 transition-colors">
											<SwappCheckbox
												id="global_scope"
												label="Aplicar a todas las variantes (Global)"
												checked={isGlobalScope}
												onChange={setGlobalScope}
											/>
										</div>

										<div className="my-1 border-t border-swapp-azul-petroleo/10 dark:border-swapp-azul-petroleo/50"></div>

										{/* Opciones Específicas usando SwappCheckbox */}
										{selectedProductObj.variants.map((v) => (
											<div
												key={v.variant_uuid}
												className="p-1 rounded hover:bg-swapp-blanco/50 dark:hover:bg-swapp-azul-petroleo/50 transition-colors">
												<SwappCheckbox
													id={`variant_${v.variant_uuid}`}
													label={`SKU: ${v.sku}`}
													checked={formData.variant_uuids.includes(
														v.variant_uuid!,
													)}
													onChange={() => handleVariantToggle(v.variant_uuid!)}
												/>
											</div>
										))}
									</div>
								</div>
							)}

						<SwappInput
							label="Nombre de la Campaña (Ej: Oferta Mensual)"
							type="text"
							required
							value={formData.name}
							onChange={(e) =>
								setFormData({ ...formData, name: e.target.value })
							}
						/>

						<div className="grid grid-cols-2 gap-4">
							<SwappSelect
								label="Tipo de Rebaja"
								options={discountTypeOptions}
								value={formData.discount_type}
								onChange={(e) =>
									setFormData({ ...formData, discount_type: e.target.value })
								}
							/>
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

						<p className="text-xs text-swapp-azul-petroleo/60 dark:text-swapp-tiza-verdoso/60 flex items-center gap-1.5 pt-2">
							<CalendarClock className="h-4 w-4 shrink-0 text-swapp-verde-oscuro dark:text-swapp-verde-menta" />
							La oferta debe estar Activa y en el rango de fechas para
							reflejarse.
						</p>

						{/* FOOTER CON BOTONES ESTANDARIZADOS Y NUEVO COLOR DE BOTÓN */}
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
								{isSaving ? "Guardando..." : "Guardar Oferta"}
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
}
