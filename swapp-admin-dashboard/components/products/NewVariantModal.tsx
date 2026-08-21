"use client";

import { useState } from "react";
import { X, Save } from "lucide-react";
import { toast } from "sonner";
import { ProductService } from "@/services/product.service";
import { SwappInput } from "@/components/ui/SwappInput";
import {
	SwappAttributeBuilder,
	AttributePair,
} from "@/components/ui/SwappAttributeBuilder";
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
	const [lowStockThreshold, setLowStockThreshold] = useState<number>(5);
	const [attributes, setAttributes] = useState<AttributePair[]>([]);
	const [isSaving, setIsSaving] = useState(false);

	if (!isOpen || !product) return null;

	const handleCreateVariant = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!sku.trim()) {
			toast.error("El SKU es obligatorio.");
			return;
		}

		// Transformar el arreglo visual a un objeto JSON puro
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
			if (ProductService.createVariant) {
				await ProductService.createVariant(product.product_uuid, {
					sku: sku,
					price: 0,
					cost_price: 0,
					stock_quantity: 0,
					low_stock_threshold: lowStockThreshold,
					variant_attributes: finalVariantAttributes,
				});
				toast.success("Variante física creada con éxito", { id: toastId });
				setSku("");
				setLowStockThreshold(5);
				setAttributes([]);
				onSuccess();
				onClose();
			} else {
				throw new Error(
					"El servicio createVariant no está implementado en el frontend.",
				);
			}
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
						<p className="text-sm text-swapp-azul-petroleo/70 dark:text-swapp-tiza/70">
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

				<form onSubmit={handleCreateVariant} className="space-y-6">
					<div className="space-y-6">
						<SwappAttributeBuilder
							attributes={attributes}
							onChange={setAttributes}
							label="Atributos Diferenciadores (Ej: Color, Talle, Sabor)"
						/>

						<div className="border-t border-swapp-tiza dark:border-swapp-azul-petroleo pt-6 transition-colors grid grid-cols-1 md:grid-cols-2 gap-4">
							<SwappInput
								label="SKU / Código Único"
								placeholder="Ej: PRD-VAR-001"
								required
								value={sku}
								onChange={(e) => setSku(e.target.value)}
							/>
							<SwappInput
								label="Umbral de Stock Bajo"
								type="number"
								min="0"
								required
								value={lowStockThreshold === 0 ? 0 : lowStockThreshold || ""}
								onChange={(e) =>
									setLowStockThreshold(parseInt(e.target.value) || 0)
								}
								helpText="Avisar cuando el stock caiga por debajo de esta cifra."
							/>
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
