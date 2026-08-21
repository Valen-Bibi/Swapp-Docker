"use client";

import { useState, useEffect } from "react";
import { X, Save, Copy, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { ProductService } from "@/services/product.service";
import {
	SwappAttributeBuilder,
	AttributePair,
} from "@/components/ui/SwappAttributeBuilder";
import { SwappTooltip } from "@/components/ui/SwappTooltip";
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
	const [attributes, setAttributes] = useState<AttributePair[]>([]);
	const [isSaving, setIsSaving] = useState(false);
	const [clonedFrom, setClonedFrom] = useState<string | null>(null);

	// LÓGICA DE CLONACIÓN INTELIGENTE
	useEffect(() => {
		if (isOpen && product) {
			setSku(""); // Siempre forzamos SKU en blanco por seguridad

			// Si el producto tiene variantes previas, usamos la última como plantilla
			if (product.variants && product.variants.length > 0) {
				const lastVariant = product.variants[product.variants.length - 1];

				if (lastVariant.variant_attributes) {
					const attrArray = Object.entries(lastVariant.variant_attributes).map(
						([key, value]) => ({
							key,
							value: String(value),
						}),
					);
					setAttributes(attrArray);
					setClonedFrom(lastVariant.sku); // Guardamos la referencia visual
				} else {
					setAttributes([]);
					setClonedFrom(null);
				}
			} else {
				setAttributes([]);
				setClonedFrom(null);
			}
		}
	}, [isOpen, product]);

	if (!isOpen || !product) return null;

	// --- GENERADOR AUTOMÁTICO DE SKU ---
	const handleGenerateSKU = () => {
		if (!product) return;

		// 1. Marca (Primeras 3 letras, alfanuméricas. Fallback: SWA)
		// @ts-ignore - Accedemos a brand asumiendo que viene del joinedload
		const brandName = product.brand?.name || "SWA";
		const brandCode = brandName
			.replace(/[^a-zA-Z0-9]/g, "")
			.substring(0, 3)
			.toUpperCase();

		// 2. Producto (Primeras 3 letras, alfanuméricas)
		const prodCode = product.name
			.replace(/[^a-zA-Z0-9]/g, "")
			.substring(0, 3)
			.toUpperCase();

		// 3. Atributo Principal (Primer atributo válido, si existe. Fallback: BAS - Base)
		let attrCode = "BAS";
		const firstValidAttr = attributes.find(
			(a) => a.key.trim() !== "" && a.value.trim() !== "",
		);
		if (firstValidAttr) {
			attrCode = firstValidAttr.value
				.replace(/[^a-zA-Z0-9]/g, "")
				.substring(0, 3)
				.toUpperCase();
		}

		// 4. Hash (3 caracteres aleatorios para evitar colisiones)
		const hash = Math.random().toString(36).substring(2, 5).toUpperCase();

		// Ensamblamos el formato: MARCA-PROD-ATRIBUTO-HASH
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

		const parsedVariants = attributes.reduce(
			(acc: Record<string, string>, curr) => {
				if (curr.key.trim() !== "") {
					acc[curr.key.trim()] = curr.value.trim();
				}
				return acc;
			},
			{},
		);

		const finalVariantAttributes =
			Object.keys(parsedVariants).length > 0 ? parsedVariants : null;

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
				{
					id: toastId,
				},
			);
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-swapp-negro/50 dark:bg-swapp-negro/70 backdrop-blur-sm p-4">
			<div className="w-full max-w-2xl rounded-xl bg-swapp-blanco dark:bg-swapp-negro-azulado p-6 shadow-2xl border-t-4 border-swapp-turquesa-oscuro dark:border-swapp-menta transition-colors">
				<div className="mb-6 flex items-center justify-between">
					<div>
						<h2 className="text-xl font-bold text-swapp-negro-azulado dark:text-swapp-blanco">
							Nueva Variante
						</h2>
						<p className="text-sm text-swapp-azul-petroleo/70 dark:text-swapp-tiza/70 mt-1">
							Asignando a:{" "}
							<span className="font-semibold text-swapp-turquesa-oscuro dark:text-swapp-menta">
								{product.name}
							</span>
						</p>
					</div>
					<button
						onClick={onClose}
						className="text-swapp-azul-petroleo/50 dark:text-swapp-tiza/50 hover:text-swapp-negro-azulado dark:hover:text-swapp-blanco transition-colors">
						<X className="h-5 w-5" />
					</button>
				</div>

				{clonedFrom && (
					<div className="mb-6 flex items-center gap-2 rounded-lg bg-swapp-azul-oceano/10 dark:bg-swapp-menta/10 p-3 text-sm text-swapp-azul-oceano dark:text-swapp-menta border border-swapp-azul-oceano/20 dark:border-swapp-menta/20 transition-colors animate-in fade-in">
						<Copy className="h-4 w-4 shrink-0" />
						<p>
							Atributos clonados automáticamente desde la variante{" "}
							<strong>{clonedFrom}</strong>.
						</p>
					</div>
				)}

				<form onSubmit={handleCreateVariant} className="space-y-6">
					<div className="space-y-6">
						<SwappAttributeBuilder
							attributes={attributes}
							onChange={setAttributes}
							label="Atributos Diferenciadores (Ej: Color, Talle, Sabor)"
						/>

						<div className="border-t border-swapp-tiza dark:border-swapp-azul-petroleo pt-6 transition-colors">
							{/* Componente de SKU modificado para incluir el botón Varita */}
							<div className="space-y-1">
								<label className="block text-sm font-medium text-swapp-azul-petroleo dark:text-swapp-tiza">
									SKU / Código Único <span className="text-red-500">*</span>
								</label>
								<div className="flex gap-2">
									<input
										type="text"
										required
										className="w-full rounded-md border border-swapp-tiza dark:border-swapp-azul-petroleo bg-transparent px-3 py-2.5 text-sm font-mono text-swapp-negro-azulado dark:text-swapp-blanco outline-none transition-colors focus:border-swapp-turquesa-oscuro dark:focus:border-swapp-menta focus:ring-1 focus:ring-swapp-turquesa-oscuro dark:focus:ring-swapp-menta uppercase"
										placeholder="Ej: SWA-BOT-AZU-X9Y"
										value={sku}
										onChange={(e) => setSku(e.target.value.toUpperCase())}
									/>
									<SwappTooltip text="Auto-generar código inteligente">
										<button
											type="button"
											onClick={handleGenerateSKU}
											className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-md border border-swapp-turquesa-oscuro/30 bg-swapp-turquesa-oscuro/10 text-swapp-turquesa-oscuro hover:bg-swapp-turquesa-oscuro hover:text-swapp-blanco dark:border-swapp-menta/30 dark:bg-swapp-menta/10 dark:text-swapp-menta dark:hover:bg-swapp-menta dark:hover:text-swapp-negro-azulado transition-all">
											<Wand2 className="h-5 w-5" />
										</button>
									</SwappTooltip>
								</div>
							</div>
						</div>
					</div>

					<div className="mt-8 flex justify-end gap-3 pt-6 border-t border-swapp-tiza dark:border-swapp-azul-petroleo transition-colors">
						<button
							type="button"
							onClick={onClose}
							className="rounded-lg px-4 py-2 text-sm font-medium text-swapp-azul-petroleo hover:bg-swapp-tiza dark:text-swapp-tiza dark:hover:bg-swapp-azul-petroleo transition-colors">
							Cancelar
						</button>
						<button
							type="submit"
							disabled={isSaving}
							className="flex items-center gap-2 rounded-lg bg-swapp-turquesa-oscuro dark:bg-swapp-menta px-6 py-2 text-sm font-medium text-swapp-blanco dark:text-swapp-negro-azulado transition-colors hover:bg-swapp-azul-oceano dark:hover:bg-swapp-verde-agua disabled:opacity-50">
							<Save className="h-4 w-4" />
							{isSaving ? "Creando..." : "Crear Variante"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
