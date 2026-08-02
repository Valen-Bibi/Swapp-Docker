import { useState, useEffect } from "react";
import { X, Landmark } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { ProductService } from "@/services/product.service";
import { SwappInput } from "@/components/ui/SwappInput";
import { Product, TaxClass } from "@/types/product";

interface EditPricingModalProps {
	isOpen: boolean;
	onClose: () => void;
	product: Product | null;
	onSuccess: () => void;
}

export default function EditPricingModal({
	isOpen,
	onClose,
	product,
	onSuccess,
}: EditPricingModalProps) {
	const [basePrice, setBasePrice] = useState<number>(0);
	const [costPrice, setCostPrice] = useState<number | "">("");
	const [taxClassId, setTaxClassId] = useState<number | "">("");
	const [taxClasses, setTaxClasses] = useState<TaxClass[]>([]);
	const [isSaving, setIsSaving] = useState(false);

	useEffect(() => {
		const fetchTaxes = async () => {
			try {
				const data = await ProductService.getTaxes();
				setTaxClasses(data);
			} catch (error) {
				console.error("Error al cargar impuestos:", error);
			}
		};
		fetchTaxes();
	}, []);

	useEffect(() => {
		if (isOpen && product) {
			setBasePrice(product.base_price || 0);
			setCostPrice(product.cost_price || "");
			setTaxClassId(product.tax_class_id || "");
		}
	}, [isOpen, product]);

	if (!isOpen || !product) return null;

	const handleSaveChanges = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSaving(true);
		const toastId = toast.loading("Guardando configuración...");

		try {
			await api.put(`/api/products/admin/${product.product_uuid}`, {
				base_price: basePrice,
				cost_price: costPrice === "" ? null : costPrice,
				tax_class_id: taxClassId === "" ? null : taxClassId,
			});

			toast.success("Precios actualizados", { id: toastId });
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

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-swapp-negro/50 dark:bg-swapp-negro/70 backdrop-blur-sm p-4">
			<div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-xl bg-swapp-blanco dark:bg-swapp-negro-azulado p-6 shadow-2xl border-t-4 border-swapp-turquesa-oscuro dark:border-swapp-menta transition-colors custom-scrollbar">
				<div className="mb-4 flex items-center justify-between">
					<h2 className="text-xl font-bold text-swapp-negro-azulado dark:text-swapp-blanco">
						Ajustar Costos y Precios
					</h2>
					<button
						onClick={onClose}
						className="text-swapp-azul-petroleo/50 dark:text-swapp-tiza/50 hover:text-swapp-negro-azulado dark:hover:text-swapp-blanco transition-colors">
						<X className="h-5 w-5" />
					</button>
				</div>

				<p className="text-sm font-medium text-swapp-azul-petroleo/70 dark:text-swapp-tiza/70 mb-6 pb-4 border-b border-swapp-tiza dark:border-swapp-azul-petroleo transition-colors">
					{product.name}
				</p>

				<form onSubmit={handleSaveChanges} className="space-y-6">
					<div className="space-y-4">
						<h3 className="text-sm font-bold uppercase tracking-wider text-swapp-azul-petroleo dark:text-swapp-tiza flex items-center gap-2">
							<Landmark className="h-4 w-4" /> Valores Base e Impuestos
						</h3>

						<div className="grid grid-cols-2 gap-4">
							<SwappInput
								label="Costo Interno ($)"
								helpText="- Opcional"
								type="text"
								formatThousands
								step="0.01"
								placeholder="Ej: 500.00"
								value={costPrice}
								onChange={(e) =>
									setCostPrice(
										e.target.value === "" ? "" : parseFloat(e.target.value),
									)
								}
							/>

							<SwappInput
								label="Precio Base ($)"
								type="text"
								formatThousands
								step="0.01"
								required
								value={basePrice === 0 ? "" : basePrice}
								onChange={(e) => setBasePrice(parseFloat(e.target.value) || 0)}
							/>
						</div>

						<div className="space-y-1">
							<label className="block text-sm font-medium text-swapp-azul-petroleo dark:text-swapp-tiza">
								Clasificación de IVA
							</label>
							<select
								className="w-full rounded-md border border-swapp-tiza dark:border-swapp-azul-petroleo bg-swapp-blanco dark:bg-swapp-negro-azulado px-3 py-2.5 text-sm text-swapp-negro-azulado dark:text-swapp-blanco outline-none transition-colors focus:border-swapp-turquesa-oscuro dark:focus:border-swapp-menta focus:ring-1 focus:ring-swapp-turquesa-oscuro dark:focus:ring-swapp-menta"
								required
								value={taxClassId}
								onChange={(e) =>
									setTaxClassId(
										e.target.value === "" ? "" : parseInt(e.target.value),
									)
								}>
								<option value="" className="dark:bg-swapp-negro-azulado">
									Seleccione la tasa aplicable...
								</option>
								{taxClasses.map((t) => (
									<option
										key={t.tax_class_id}
										value={t.tax_class_id}
										className="dark:bg-swapp-negro-azulado">
										{t.name} ({t.rate}%)
									</option>
								))}
							</select>
						</div>
					</div>

					<div className="mt-6 flex justify-end gap-3 pt-4 border-t border-swapp-tiza dark:border-swapp-azul-petroleo transition-colors">
						<button
							type="button"
							onClick={onClose}
							className="rounded-lg px-4 py-2 text-sm font-medium text-swapp-azul-petroleo dark:text-swapp-tiza hover:bg-swapp-tiza dark:hover:bg-swapp-azul-petroleo transition-colors">
							Cancelar
						</button>
						<button
							type="submit"
							disabled={isSaving}
							className="rounded-lg bg-swapp-turquesa-oscuro dark:bg-swapp-menta px-4 py-2 text-sm font-medium text-swapp-blanco dark:text-swapp-negro-azulado transition-colors hover:bg-swapp-azul-oceano dark:hover:bg-swapp-verde-agua disabled:opacity-50">
							{isSaving ? "Aplicando..." : "Guardar Cambios"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
