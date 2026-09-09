"use client";

import { useState, useEffect } from "react";
import {
	X,
	Save,
	Copy,
	Wand2,
	Loader2,
	AlertCircle,
	Layers,
} from "lucide-react";
import { toast } from "sonner";
import { ProductService } from "@/services/product.service";
import { SwappTooltip } from "@/components/ui/SwappTooltip";
import { SwappSearchableSelect } from "@/components/ui/SwappSearchableSelect";
import { Product } from "@/types/product";

interface NewVariantModalProps {
	isOpen: boolean;
	onClose: () => void;
	product: Product | null;
	onSuccess: () => void;
}

export default function NewVariantModal({
	isOpen,
	onClose,
	product,
	onSuccess,
}: NewVariantModalProps) {
	const [sku, setSku] = useState("");
	const [price, setPrice] = useState("");
	const [refillPrice, setRefillPrice] = useState("");
	const [isSaving, setIsSaving] = useState(false);
	const [clonedFrom, setClonedFrom] = useState<string | null>(null);

	// --- ESTADOS PIM ---
	const [loadingPim, setLoadingPim] = useState(true);
	const [allowedAttributes, setAllowedAttributes] = useState<any[]>([]);
	const [selectedValues, setSelectedValues] = useState<Record<string, string>>(
		{},
	);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape" && isOpen) onClose();
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [isOpen, onClose]);

	useEffect(() => {
		const loadPIMData = async () => {
			if (!isOpen || !product || !product.category_id) return;

			setLoadingPim(true);
			setSku("");
			setPrice(
				product.reference_price ? product.reference_price.toString() : "",
			);
			setRefillPrice("");

			try {
				const [globalAttrs, linkedAttrs] = await Promise.all([
					ProductService.getAttributes(),
					ProductService.getCategoryAttributes(product.category_id),
				]);

				const variantLinkedAttrs = linkedAttrs.filter((l: any) => l.is_variant);
				const enrichedAttrs = variantLinkedAttrs.map((linked: any) => {
					const globalAttr = globalAttrs.find(
						(g: any) => g.attribute_id === linked.attribute_id,
					);
					return {
						...linked,
						values: globalAttr ? globalAttr.values : [],
					};
				});

				setAllowedAttributes(enrichedAttrs);

				let initialValues: Record<string, string> = {};
				let clonedSku = null;

				if (product.variants && product.variants.length > 0) {
					const lastVariant = product.variants[product.variants.length - 1];
					if (lastVariant.variant_attributes) {
						initialValues = { ...lastVariant.variant_attributes };
						clonedSku = lastVariant.sku;
						setPrice(lastVariant.price ? lastVariant.price.toString() : "");
						setRefillPrice(
							lastVariant.refill_price
								? lastVariant.refill_price.toString()
								: "",
						);
					}
				}

				setSelectedValues(initialValues);
				setClonedFrom(clonedSku);
			} catch (error) {
				toast.error("Error al cargar la estructura del PIM.");
			} finally {
				setLoadingPim(false);
			}
		};

		loadPIMData();
	}, [isOpen, product]);

	if (!isOpen || !product) return null;

	const handleGenerateSKU = () => {
		if (!product) return;
		const brandCode = (product.brand?.name || "SWA")
			.replace(/[^a-zA-Z0-9]/g, "")
			.substring(0, 3)
			.toUpperCase();
		const prodCode = product.name
			.replace(/[^a-zA-Z0-9]/g, "")
			.substring(0, 3)
			.toUpperCase();
		let attrCode = "BAS";
		const firstAttrValue = Object.values(selectedValues).find(
			(val) => val && val.trim() !== "",
		);
		if (firstAttrValue) {
			attrCode = firstAttrValue
				.replace(/[^a-zA-Z0-9]/g, "")
				.substring(0, 3)
				.toUpperCase();
		}
		const hash = Math.random().toString(36).substring(2, 5).toUpperCase();
		setSku(`${brandCode}-${prodCode}-${attrCode}-${hash}`);
		toast.success("SKU auto-generado de forma inteligente", {
			position: "top-center",
		});
	};

	const handleCreateVariant = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!sku.trim()) return toast.error("El SKU es obligatorio.");

		const missingRequired = allowedAttributes.some(
			(attr) => attr.is_required && !selectedValues[attr.name],
		);
		if (missingRequired)
			return toast.error("Faltan completar atributos obligatorios.");

		const cleanAttributes = Object.entries(selectedValues).reduce(
			(acc: Record<string, string>, [key, val]) => {
				if (val && val.trim() !== "") acc[key] = val;
				return acc;
			},
			{},
		);

		if (product.variants && product.variants.length > 0) {
			const isDuplicate = product.variants.some((existingVariant: any) => {
				if (!existingVariant.variant_attributes) return false;
				const existingKeys = Object.keys(existingVariant.variant_attributes);
				const newKeys = Object.keys(cleanAttributes);
				if (existingKeys.length !== newKeys.length) return false;
				return existingKeys.every(
					(key) =>
						existingVariant.variant_attributes[key] === cleanAttributes[key],
				);
			});
			if (isDuplicate)
				return toast.error(
					"Operación rechazada: Ya existe una variante con esta combinación.",
				);
		}

		const finalVariantAttributes =
			Object.keys(cleanAttributes).length > 0 ? cleanAttributes : null;

		setIsSaving(true);
		const toastId = toast.loading("Registrando nueva variante...");

		try {
			await ProductService.createVariant(product.product_uuid, {
				sku: sku,
				price: price ? Number(price) : undefined,
				refill_price:
					product.is_returnable && refillPrice ? Number(refillPrice) : null,
				variant_attributes: finalVariantAttributes,
			});
			toast.success("Variante física creada con éxito", { id: toastId });
			onSuccess();
			onClose();
		} catch (error: any) {
			toast.error(
				error.response?.data?.detail || "Error al crear la variante.",
				{ id: toastId },
			);
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<div className="fixed inset-0 z-[100] flex items-center justify-center bg-swapp-azul-petroleo/20 dark:bg-swapp-negro/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95">
			<div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-xl bg-swapp-blanco/50 dark:bg-swapp-azul-oscuro/40 backdrop-blur-md shadow-2xl border-t-4 border-t-swapp-verde-oscuro dark:border-t-swapp-verde-menta overflow-hidden transition-colors">
				<div className="p-6 border-b border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo flex items-start justify-between shrink-0 transition-colors">
					<div>
						<h2 className="text-xl font-bold text-swapp-azul-oscuro dark:text-swapp-blanco flex items-center gap-2">
							<Layers className="h-5 w-5 text-swapp-verde-oscuro dark:text-swapp-verde-menta" />
							Nueva Variante Física
						</h2>
						<p className="text-sm text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70 mt-1 font-medium transition-colors">
							Asignando a:{" "}
							<span className="font-bold text-swapp-verde-oscuro dark:text-swapp-verde-menta">
								{product.name}
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
					{clonedFrom && !loadingPim && (
						<div className="mb-6 flex items-start gap-2.5 rounded-xl bg-swapp-verde-pastel/10 dark:bg-swapp-verde-menta/10 p-4 text-sm text-swapp-verde-oscuro dark:text-swapp-verde-menta border border-swapp-verde-pastel/20 dark:border-swapp-verde-menta/20 transition-colors animate-in fade-in">
							<Copy className="h-4 w-4 shrink-0 mt-0.5" />
							<p className="leading-relaxed">
								Atributos clonados automáticamente desde la variante{" "}
								<strong>{clonedFrom}</strong>.
							</p>
						</div>
					)}

					{loadingPim ? (
						<div className="flex flex-col items-center justify-center py-12 gap-3">
							<Loader2 className="h-8 w-8 animate-spin text-swapp-verde-oscuro dark:text-swapp-verde-menta" />
							<p className="text-sm text-swapp-azul-petroleo/60 dark:text-swapp-tiza-verdoso/60">
								Cargando reglas de estructura PIM...
							</p>
						</div>
					) : (
						<form
							onSubmit={handleCreateVariant}
							className="space-y-6 animate-in fade-in [&_input]:!bg-transparent [&_select]:!bg-transparent">
							<div className="space-y-5">
								<h3 className="text-sm font-bold uppercase tracking-wider text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70">
									Atributos Diferenciadores
								</h3>
								{allowedAttributes.length === 0 ? (
									<div className="flex items-start gap-3 rounded-xl bg-swapp-azul-petroleo/5 dark:bg-swapp-azul-petroleo/20 p-4 text-sm text-swapp-azul-petroleo/80 dark:text-swapp-tiza-verdoso/80 border border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo transition-colors">
										<AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
										<p className="leading-relaxed">
											La categoría no tiene atributos variantes asignados en su
											Candado.
										</p>
									</div>
								) : (
									<div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-2">
										{allowedAttributes.map((attr) => {
											const formatOptions = attr.values.map((v: any) => ({
												label: v.value,
												value: v.value,
											}));
											return (
												<div
													key={attr.attribute_id}
													className="grid grid-cols-1 gap-1.5">
													<label className="block text-sm font-medium text-swapp-azul-petroleo dark:text-swapp-tiza-verdoso">
														{attr.name}{" "}
														{attr.is_required && (
															<span className="text-red-500">*</span>
														)}
													</label>
													<SwappSearchableSelect
														options={formatOptions}
														value={selectedValues[attr.name] || ""}
														onChange={(val) =>
															setSelectedValues({
																...selectedValues,
																[attr.name]: val,
															})
														}
														placeholder={`Seleccionar...`}
													/>
												</div>
											);
										})}
									</div>
								)}
							</div>

							<div className="border-t border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo pt-6 space-y-4">
								<h3 className="text-sm font-bold uppercase tracking-wider text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70">
									Datos Comerciales y Logísticos
								</h3>

								<div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
									<div className="space-y-1.5 sm:col-span-2">
										<label className="block text-sm font-medium text-swapp-azul-petroleo dark:text-swapp-tiza-verdoso">
											SKU / Código Único Físico{" "}
											<span className="text-red-500">*</span>
										</label>
										<div className="flex gap-2">
											<input
												type="text"
												required
												className="w-full rounded-md border border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo px-3 py-2 text-sm font-mono text-swapp-azul-oscuro dark:text-swapp-blanco outline-none focus:border-swapp-verde-oscuro dark:focus:border-swapp-verde-menta focus:ring-1 focus:ring-swapp-verde-oscuro dark:focus:ring-swapp-verde-menta uppercase"
												placeholder="Ej: SWA-BOT-AZU-X9Y"
												value={sku}
												onChange={(e) => setSku(e.target.value.toUpperCase())}
											/>
											<SwappTooltip text="Auto-generar código inteligente">
												<button
													type="button"
													onClick={handleGenerateSKU}
													className="flex shrink-0 items-center justify-center rounded-md border border-swapp-verde-pastel/20 bg-swapp-verde-pastel/10 px-3 text-swapp-verde-oscuro hover:bg-swapp-verde-oscuro hover:text-swapp-blanco transition-all">
													<Wand2 className="h-5 w-5" />
												</button>
											</SwappTooltip>
										</div>
									</div>

									<div className="space-y-1.5">
										<label className="block text-sm font-medium text-swapp-azul-petroleo dark:text-swapp-tiza-verdoso">
											Precio Venta ($)
										</label>
										<input
											type="number"
											className="w-full rounded-md border border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo px-3 py-2 text-sm text-swapp-azul-oscuro dark:text-swapp-blanco outline-none focus:border-swapp-verde-oscuro dark:focus:border-swapp-verde-menta focus:ring-1 focus:ring-swapp-verde-oscuro dark:focus:ring-swapp-verde-menta"
											value={price}
											onChange={(e) => setPrice(e.target.value)}
										/>
									</div>

									{product.is_returnable && (
										<div className="space-y-1.5">
											<label className="block text-sm font-medium text-swapp-azul-petroleo dark:text-swapp-tiza-verdoso flex items-center gap-2">
												Precio de Recambio ($)
												<SwappTooltip text="Se aplicará cuando el cliente devuelva un envase vacío de este mismo SKU.">
													<AlertCircle className="h-3 w-3 text-swapp-verde-oscuro dark:text-swapp-verde-menta" />
												</SwappTooltip>
											</label>
											<input
												type="number"
												className="w-full rounded-md border border-swapp-verde-oscuro/40 dark:border-swapp-verde-menta/40 bg-swapp-verde-pastel/5 px-3 py-2 text-sm text-swapp-azul-oscuro dark:text-swapp-blanco outline-none focus:border-swapp-verde-oscuro dark:focus:border-swapp-verde-menta focus:ring-1 focus:ring-swapp-verde-oscuro dark:focus:ring-swapp-verde-menta"
												value={refillPrice}
												onChange={(e) => setRefillPrice(e.target.value)}
												placeholder="Ej: 15000"
											/>
										</div>
									)}
								</div>
							</div>

							<div className="mt-8 flex justify-end gap-3 pt-6 border-t border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo transition-colors">
								<button
									type="button"
									onClick={onClose}
									className="rounded-lg px-4 py-2 text-sm font-medium text-swapp-azul-petroleo dark:text-swapp-tiza-verdoso hover:bg-red-500/10 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400 transition-colors">
									Cancelar
								</button>
								<button
									type="submit"
									disabled={isSaving}
									className="flex items-center gap-2 rounded-lg bg-swapp-verde-pastel dark:bg-swapp-verde-menta px-6 py-2 text-sm font-medium text-swapp-blanco dark:text-swapp-azul-oscuro transition-colors hover:bg-swapp-verde-oscuro dark:hover:bg-swapp-verde-pastel disabled:opacity-50">
									<Save className="h-4 w-4" />
									{isSaving ? "Creando..." : "Crear Variante"}
								</button>
							</div>
						</form>
					)}
				</div>
			</div>
		</div>
	);
}
