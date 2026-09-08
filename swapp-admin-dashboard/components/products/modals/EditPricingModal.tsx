"use client";

import { useState, useEffect } from "react";
import { X, Landmark, TrendingUp, Save } from "lucide-react";
import { toast } from "sonner";
import { ProductService } from "@/services/product.service";
import { SwappInput } from "@/components/ui/SwappInput";
import { Product, ProductVariant } from "@/types/product";

interface EditPricingModalProps {
	isOpen: boolean;
	onClose: () => void;
	product: Product | null;
	variant: ProductVariant | null;
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

	// --- CERRAR CON ESCAPE ---
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape" && isOpen) {
				onClose();
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [isOpen, onClose]);

	useEffect(() => {
		if (isOpen && product) {
			if (variant) {
				setBasePrice(variant.price || 0);
				setCostPrice(variant.cost_price || "");
			} else {
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
				await ProductService.updateVariant(
					product.product_uuid,
					variant.variant_uuid!,
					{
						price: basePrice,
						cost_price: costPrice === "" ? 0 : costPrice,
					},
				);
			} else {
				await ProductService.update(product.product_uuid, {
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
		<div className="fixed inset-0 z-[100] flex items-center justify-center bg-swapp-azul-petroleo/5 dark:bg-swapp-negro/30 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95">
			<div className="w-full max-w-md max-h-[90vh] flex flex-col rounded-xl bg-swapp-blanco/50 dark:bg-swapp-azul-oscuro/40 backdrop-blur-md shadow-2xl border-t-4 border-t-swapp-verde-oscuro dark:border-t-swapp-verde-menta overflow-hidden transition-colors">
				<div className="p-6 border-b border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo flex items-start justify-between shrink-0 transition-colors">
					<div>
						<h2 className="text-xl font-bold text-swapp-azul-oscuro dark:text-swapp-blanco flex items-center gap-2">
							<Landmark className="h-5 w-5 text-swapp-verde-oscuro dark:text-swapp-verde-menta" />
							{variant ? "Ajustar Rentabilidad" : "Valores de Referencia"}
						</h2>
						<p className="text-sm text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70 mt-1.5 font-medium transition-colors">
							{product.name}
						</p>
						{variant ? (
							<p className="text-[11px] font-mono font-bold tracking-wider text-swapp-verde-oscuro dark:text-swapp-verde-menta mt-2 bg-swapp-verde-oscuro/10 dark:bg-swapp-verde-menta/10 inline-block px-2 py-0.5 rounded border border-swapp-verde-oscuro/20 dark:border-swapp-verde-menta/20">
								SKU: {variant.sku}
							</p>
						) : (
							<p className="text-xs font-medium text-swapp-azul-petroleo/50 dark:text-swapp-tiza-verdoso/50 mt-2">
								Se aplicarán por defecto a nuevas variantes.
							</p>
						)}
					</div>
					<button
						type="button"
						onClick={onClose}
						className="p-1 rounded-md text-swapp-azul-petroleo/50 dark:text-swapp-tiza-verdoso/50 hover:bg-red-500/10 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400 transition-colors mt-0.5">
						<X className="h-5 w-5" />
					</button>
				</div>

				<div className="p-6 overflow-y-auto custom-scrollbar flex-1">
					{/* HEREDAMOS TRANSPARENCIA A LOS INPUTS */}
					<form
						onSubmit={handleSaveChanges}
						className="space-y-6 [&_input]:!bg-transparent">
						<div className="space-y-4">
							<h3 className="text-sm font-bold uppercase tracking-wider text-swapp-azul-petroleo/70 dark:text-swapp-tiza-verdoso/70">
								Valores Base
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

						{/* FOOTER CON NUEVOS COLORES DE BOTÓN */}
						<div className="mt-6 flex justify-end gap-3 pt-4 border-t border-swapp-azul-petroleo/20 dark:border-swapp-azul-petroleo transition-colors">
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
								{isSaving ? "Aplicando..." : "Guardar Cambios"}
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
}
