"use client";

import { useState, useEffect } from "react";
import { X, Save, Copy, Wand2, Loader2, AlertCircle } from "lucide-react";
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
	const [isSaving, setIsSaving] = useState(false);
	const [clonedFrom, setClonedFrom] = useState<string | null>(null);

	// --- ESTADOS PIM ---
	const [loadingPim, setLoadingPim] = useState(true);
	const [allowedAttributes, setAllowedAttributes] = useState<any[]>([]);
	const [selectedValues, setSelectedValues] = useState<Record<string, string>>(
		{},
	);

	useEffect(() => {
		const loadPIMData = async () => {
			if (!isOpen || !product || !product.category_id) return;

			setLoadingPim(true);
			setSku("");

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

		const brandName = product.brand?.name || "SWA";
		const brandCode = brandName
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
		const generatedSku = `${brandCode}-${prodCode}-${attrCode}-${hash}`;

		setSku(generatedSku);
		toast.success("SKU auto-generado de forma inteligente", {
			position: "top-center",
		});
	};

	const handleCreateVariant = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!sku.trim()) {
			toast.error("El SKU es obligatorio.");
			return;
		}

		const missingRequired = allowedAttributes.some(
			(attr) => attr.is_required && !selectedValues[attr.name],
		);

		if (missingRequired) {
			toast.error("Faltan completar atributos obligatorios.");
			return;
		}

		const cleanAttributes = Object.entries(selectedValues).reduce(
			(acc: Record<string, string>, [key, val]) => {
				if (val && val.trim() !== "") {
					acc[key] = val;
				}
				return acc;
			},
			{},
		);

		// --- NUEVA VALIDACIÓN MULTIDIMENSIONAL ---
		if (product.variants && product.variants.length > 0) {
			const isDuplicate = product.variants.some((existingVariant: any) => {
				if (!existingVariant.variant_attributes) return false;

				const existingKeys = Object.keys(existingVariant.variant_attributes);
				const newKeys = Object.keys(cleanAttributes);

				// Si tienen distinta cantidad de atributos configurados, no son iguales
				if (existingKeys.length !== newKeys.length) return false;

				// Chequeamos que absolutamente todas las llaves y valores coincidan
				return existingKeys.every(
					(key) =>
						existingVariant.variant_attributes[key] === cleanAttributes[key],
				);
			});

			if (isDuplicate) {
				toast.error(
					"Operación rechazada: Ya existe una variante con esta combinación exacta de atributos.",
				);
				return;
			}
		}

		const finalVariantAttributes =
			Object.keys(cleanAttributes).length > 0 ? cleanAttributes : null;

		setIsSaving(true);
		const toastId = toast.loading("Registrando nueva variante...");

		try {
			await ProductService.createVariant(product.product_uuid, {
				sku: sku,
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
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-swapp-negro/50 dark:bg-swapp-negro/70 backdrop-blur-sm p-4 animate-in fade-in">
			<div className="w-full max-w-2xl rounded-xl bg-swapp-blanco dark:bg-swapp-azul-oscuro p-6 shadow-2xl border-t-4 border-swapp-verde-oscuro dark:border-swapp-verde-menta transition-colors">
				<div className="mb-6 flex items-center justify-between">
					<div>
						<h2 className="text-xl font-bold text-swapp-azul-oscuro dark:text-swapp-blanco">
							Nueva Variante Físíca
						</h2>
						<p className="text-sm text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70 mt-1">
							Asignando a:{" "}
							<span className="font-semibold text-swapp-verde-oscuro dark:text-swapp-verde-menta">
								{product.name}
							</span>
						</p>
					</div>
					<button
						onClick={onClose}
						className="text-swapp-azul-petroleo/50 dark:text-swapp-tiza-verdoso/50 hover:text-swapp-azul-oscuro dark:hover:text-swapp-blanco transition-colors">
						<X className="h-5 w-5" />
					</button>
				</div>

				{clonedFrom && !loadingPim && (
					<div className="mb-6 flex items-center gap-2 rounded-lg bg-swapp-azul-oceano/10 dark:bg-swapp-verde-menta/10 p-3 text-sm text-swapp-azul-oceano dark:text-swapp-verde-menta border border-swapp-azul-oceano/20 dark:border-swapp-verde-menta/20 transition-colors animate-in fade-in">
						<Copy className="h-4 w-4 shrink-0" />
						<p>
							Atributos clonados automáticamente desde la variante{" "}
							<strong>{clonedFrom}</strong>. Asegurate de cambiar la
							combinación.
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
						className="space-y-6 animate-in fade-in">
						<div className="space-y-4">
							<h3 className="text-sm font-bold uppercase tracking-wider text-swapp-azul-petroleo dark:text-swapp-tiza-verdoso">
								Atributos Diferenciadores
							</h3>

							{allowedAttributes.length === 0 ? (
								<div className="flex items-center gap-2 rounded-lg bg-swapp-tiza-verdoso/50 dark:bg-swapp-azul-petroleo/30 p-4 text-sm text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70 border border-swapp-tiza-verdoso dark:border-swapp-azul-petroleo transition-colors">
									<AlertCircle className="h-5 w-5 shrink-0" />
									<p>
										La categoría de este producto no tiene atributos variantes
										asignados en su Candado. Si esto es un error, debés
										vincularlos primero en el ABM de Categorías.
									</p>
								</div>
							) : (
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-12">
									{allowedAttributes.map((attr) => {
										// Mostramos todas las opciones del diccionario global libremente
										const formatOptions = attr.values.map((v: any) => ({
											label: v.value,
											value: v.value,
										}));

										return (
											<div key={attr.attribute_id} className="space-y-1">
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

						<div className="border-t border-swapp-tiza-verdoso dark:border-swapp-azul-petroleo pt-6 transition-colors">
							<div className="space-y-1">
								<label className="block text-sm font-medium text-swapp-azul-petroleo dark:text-swapp-tiza-verdoso">
									SKU / Código Único Físico{" "}
									<span className="text-red-500">*</span>
								</label>
								<div className="flex gap-2">
									<input
										type="text"
										required
										className="w-full rounded-md border border-swapp-tiza-verdoso dark:border-swapp-azul-petroleo bg-transparent px-3 py-2.5 text-sm font-mono text-swapp-azul-oscuro dark:text-swapp-blanco outline-none transition-colors focus:border-swapp-verde-oscuro dark:focus:border-swapp-verde-menta focus:ring-1 focus:ring-swapp-verde-oscuro dark:focus:ring-swapp-verde-menta uppercase"
										placeholder="Ej: SWA-BOT-AZU-X9Y"
										value={sku}
										onChange={(e) => setSku(e.target.value.toUpperCase())}
									/>
									<SwappTooltip text="Auto-generar código inteligente basado en PIM">
										<button
											type="button"
											onClick={handleGenerateSKU}
											className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-md border border-swapp-verde-oscuro/30 bg-swapp-verde-oscuro/10 text-swapp-verde-oscuro hover:bg-swapp-verde-oscuro hover:text-swapp-blanco dark:border-swapp-verde-menta/30 dark:bg-swapp-verde-menta/10 dark:text-swapp-verde-menta dark:hover:bg-swapp-verde-menta dark:hover:text-swapp-azul-oscuro transition-all">
											<Wand2 className="h-5 w-5" />
										</button>
									</SwappTooltip>
								</div>
							</div>
						</div>

						<div className="mt-8 flex justify-end gap-3 pt-6 border-t border-swapp-tiza-verdoso dark:border-swapp-azul-petroleo transition-colors">
							<button
								type="button"
								onClick={onClose}
								className="rounded-lg px-4 py-2 text-sm font-medium text-swapp-azul-petroleo hover:bg-swapp-tiza-verdoso dark:text-swapp-tiza-verdoso dark:hover:bg-swapp-azul-petroleo transition-colors">
								Cancelar
							</button>
							<button
								type="submit"
								disabled={isSaving}
								className="flex items-center gap-2 rounded-lg bg-swapp-verde-oscuro dark:bg-swapp-verde-menta px-6 py-2 text-sm font-medium text-swapp-blanco dark:text-swapp-azul-oscuro transition-colors hover:bg-swapp-azul-oceano dark:hover:bg-swapp-verde-pastel disabled:opacity-50">
								<Save className="h-4 w-4" />
								{isSaving ? "Creando..." : "Crear Variante"}
							</button>
						</div>
					</form>
				)}
			</div>
		</div>
	);
}
