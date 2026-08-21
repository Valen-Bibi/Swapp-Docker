import { useState, useEffect } from "react";
import { X, Landmark, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { ProductService } from "@/services/product.service";
import { SwappInput } from "@/components/ui/SwappInput";
import { Product, ProductVariant } from "@/types/product";

interface EditPricingModalProps {
	isOpen: boolean;
	onClose: () => void;
	product: Product | null;
	variant: ProductVariant | null; // Permitimos null para editar al padre
	onSuccess: () => void;
}

export default function EditPricingModal({
	isOpen,
	onClose,
	product,
	variant,
	onSuccess,
}: EditPricingModalProps) {
	const [basePrice, setBasePrice] = useState<number>(0);
	const [costPrice, setCostPrice] = useState<number | "">("");
	const [isSaving, setIsSaving] = useState(false);

	useEffect(() => {
		if (isOpen && product) {
			if (variant) {
				// Modo: Variante Física
				setBasePrice(variant.price || 0);
				setCostPrice(variant.cost_price || "");
			} else {
				// Modo: Producto Padre (Valores de Referencia)
				// Envolvemos el producto en 'any' de una vez para evitar que TypeScript aborte el build
				const p = product as any;
				const refPrice = p.reference_price ?? p.base_price ?? 0;
				const refCost = p.reference_cost ?? p.cost_price ?? "";

				setBasePrice(refPrice);
				setCostPrice(refCost);
			}
		}
	}, [isOpen, product, variant]);

	if (!isOpen || !product) return null;

	const handleSaveChanges = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSaving(true);

		const toastMsg = variant
			? `Guardando precios para ${variant.sku}...`
			: "Guardando valores de referencia...";
		const toastId = toast.loading(toastMsg);

		try {
			if (variant) {
				// 1. Guardar cambios en la variante
				await ProductService.updateVariant(
					product.product_uuid,
					variant.variant_uuid!,
					{
						price: basePrice,
						cost_price: costPrice === "" ? 0 : costPrice,
					},
				);
			} else {
				// 2. Guardar cambios en el producto padre
				await ProductService.update(product.product_uuid, {
					// Enviamos ambos nombres de variables para cubrir compatibilidad con el Schema
					base_price: basePrice,
					cost_price: costPrice === "" ? 0 : costPrice,
					reference_price: basePrice,
					reference_cost: costPrice === "" ? 0 : costPrice,
				});
			}

			toast.success("Valores actualizados", { id: toastId });
			onSuccess();
			onClose();
		} catch (error: any) {
			toast.error(
				error.response?.data?.detail || "Error crítico al guardar cambios.",
				{ id: toastId },
			);
		} finally {
			setIsSaving(false);
		}
	};

	const currentMargin =
		costPrice && basePrice
			? Math.round(((basePrice - Number(costPrice)) / basePrice) * 100)
			: null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-swapp-negro/50 dark:bg-swapp-negro/70 backdrop-blur-sm p-4">
			<div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-xl bg-swapp-blanco dark:bg-swapp-negro-azulado p-6 shadow-2xl border-t-4 border-swapp-turquesa-oscuro dark:border-swapp-menta transition-colors custom-scrollbar">
				<div className="mb-4 flex items-center justify-between">
					<h2 className="text-xl font-bold text-swapp-negro-azulado dark:text-swapp-blanco">
						{variant ? "Ajustar Rentabilidad" : "Valores de Referencia"}
					</h2>
					<button
						onClick={onClose}
						className="text-swapp-azul-petroleo/50 hover:text-swapp-negro-azulado dark:hover:text-swapp-blanco transition-colors">
						<X className="h-5 w-5" />
					</button>
				</div>

				<div className="mb-6 pb-4 border-b border-swapp-tiza dark:border-swapp-azul-petroleo flex flex-col gap-1">
					<p className="text-sm font-medium text-swapp-azul-petroleo/70 dark:text-swapp-tiza/70">
						{product.name}
					</p>
					{variant ? (
						<span className="text-xs font-mono bg-swapp-tiza/50 dark:bg-swapp-azul-petroleo/50 text-swapp-turquesa-oscuro dark:text-swapp-menta px-2 py-1 rounded w-fit">
							SKU: {variant.sku}
						</span>
					) : (
						<span className="text-xs font-medium text-swapp-azul-petroleo/50 dark:text-swapp-tiza/50">
							Estos valores se aplicarán por defecto al crear nuevas variantes
							físicas.
						</span>
					)}
				</div>

				<form onSubmit={handleSaveChanges} className="space-y-6">
					<div className="space-y-4">
						<h3 className="text-sm font-bold uppercase tracking-wider text-swapp-azul-petroleo dark:text-swapp-tiza flex items-center gap-2">
							<Landmark className="h-4 w-4" /> Valores Base
						</h3>

						<div className="grid grid-cols-2 gap-4">
							<SwappInput
								label="Costo Interno ($)"
								helpText="- Opcional"
								type="number"
								step="0.01"
								placeholder="Ej: 500.00"
								value={costPrice}
								onChange={(e) =>
									setCostPrice(
										e.target.value === "" ? "" : parseFloat(e.target.value),
									)
								}
							/>

							<div className="flex flex-col gap-1">
								<SwappInput
									label="Precio Final ($)"
									type="number"
									step="0.01"
									required
									value={basePrice === 0 ? "" : basePrice}
									onChange={(e) =>
										setBasePrice(parseFloat(e.target.value) || 0)
									}
								/>
								{currentMargin !== null && (
									<span
										className={`text-[10px] font-medium mt-1 flex items-center gap-1 ${currentMargin > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
										<TrendingUp
											className={`h-3 w-3 ${currentMargin < 0 ? "rotate-180" : ""}`}
										/>
										Margen: {currentMargin}%
									</span>
								)}
							</div>
						</div>
					</div>

					<div className="mt-6 flex justify-end gap-3 pt-4 border-t border-swapp-tiza dark:border-swapp-azul-petroleo transition-colors">
						<button
							type="button"
							onClick={onClose}
							className="rounded-lg px-4 py-2 text-sm font-medium hover:bg-swapp-tiza dark:hover:bg-swapp-azul-petroleo transition-colors">
							Cancelar
						</button>
						<button
							type="submit"
							disabled={isSaving}
							className="rounded-lg bg-swapp-turquesa-oscuro dark:bg-swapp-menta px-4 py-2 text-sm font-medium text-swapp-blanco dark:text-swapp-negro-azulado transition-colors hover:opacity-90 disabled:opacity-50">
							{isSaving ? "Aplicando..." : "Guardar Cambios"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
