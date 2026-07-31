import { useState, useEffect } from "react";
import { X, Tag, CalendarClock, Landmark } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { ProductService } from "@/services/product.service";
import { SwappInput } from "@/components/ui/SwappInput";
import { SwappCheckbox } from "@/components/ui/SwappCheckbox";
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
	// Estados para precios base e impuestos
	const [basePrice, setBasePrice] = useState<number>(0);
	const [costPrice, setCostPrice] = useState<number | "">("");
	const [taxClassId, setTaxClassId] = useState<number | "">("");
	const [taxClasses, setTaxClasses] = useState<TaxClass[]>([]);

	// Estados para el motor de ofertas
	const [discountEnabled, setDiscountEnabled] = useState(false);
	const [discountType, setDiscountType] = useState("percentage");
	const [discountValue, setDiscountValue] = useState<string>("");
	const [startDate, setStartDate] = useState<string>("");
	const [endDate, setEndDate] = useState<string>("");

	const [isSaving, setIsSaving] = useState(false);

	// Cargar las clases de impuestos una sola vez al montar el componente
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

	// Cuando el modal se abre, copiamos los datos del producto al estado local
	useEffect(() => {
		if (isOpen && product) {
			setBasePrice(product.base_price || 0);
			setCostPrice(product.cost_price || "");
			setTaxClassId(product.tax_class_id || "");

			// Reseteamos el formulario de descuentos
			setDiscountEnabled(false);
			setDiscountType("percentage");
			setDiscountValue("");
			setStartDate("");
			setEndDate("");
		}
	}, [isOpen, product]);

	if (!isOpen || !product) return null;

	const handleSaveChanges = async (e: React.FormEvent) => {
		e.preventDefault();

		// 1. Validación de fechas en el frontend
		if (discountEnabled) {
			if (!discountValue || !startDate || !endDate) {
				toast.error("Complete todos los campos de la oferta temporal.");
				return;
			}
			if (new Date(endDate) <= new Date(startDate)) {
				toast.error(
					"La fecha de finalización debe ser posterior a la de inicio.",
				);
				return;
			}
		}

		setIsSaving(true);
		const toastId = toast.loading("Guardando configuración...");

		try {
			// 2. Actualizamos los precios e impuestos mediante PUT
			await api.put(`/api/products/admin/${product.product_uuid}`, {
				base_price: basePrice,
				cost_price: costPrice === "" ? null : costPrice,
				tax_class_id: taxClassId === "" ? null : taxClassId,
			});

			// 3. Si se configuró un descuento, disparamos el POST a la tabla hija
			if (discountEnabled) {
				await api.post(
					`/api/products/admin/${product.product_uuid}/discounts`,
					{
						discount_type: discountType,
						value: parseFloat(discountValue),
						start_date: new Date(startDate).toISOString(),
						end_date: new Date(endDate).toISOString(),
					},
				);
			}

			toast.success(
				discountEnabled
					? "Precios y ofertas actualizados"
					: "Precios actualizados",
				{ id: toastId },
			);
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
					{/* SECCIÓN 1: PRECIOS REGULARES E IMPUESTOS */}
					<div className="space-y-4">
						<h3 className="text-sm font-bold uppercase tracking-wider text-swapp-azul-petroleo dark:text-swapp-tiza flex items-center gap-2">
							<Landmark className="h-4 w-4" /> Valores Base e Impuestos
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

							<SwappInput
								label="Precio Base ($)"
								type="number"
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

					{/* SECCIÓN 2: MOTOR DE DESCUENTOS */}
					<div className="border-t border-swapp-tiza dark:border-swapp-azul-petroleo pt-6 transition-colors space-y-4">
						<SwappCheckbox
							id="toggle-discount"
							label="Programar nueva oferta temporal"
							checked={discountEnabled}
							onChange={(e) => setDiscountEnabled(e.target.checked)}
						/>

						{discountEnabled && (
							<div className="bg-swapp-tiza/30 dark:bg-swapp-azul-petroleo/20 p-4 rounded-lg space-y-4 animate-in fade-in slide-in-from-top-2">
								<div className="grid grid-cols-2 gap-4">
									<div className="space-y-1">
										<label className="block text-sm font-medium text-swapp-azul-petroleo dark:text-swapp-tiza">
											Tipo de Rebaja
										</label>
										<select
											className="w-full rounded-md border border-swapp-tiza dark:border-swapp-azul-petroleo bg-swapp-blanco dark:bg-swapp-negro-azulado px-3 py-2 text-sm text-swapp-negro-azulado dark:text-swapp-blanco outline-none transition-colors focus:border-swapp-turquesa-oscuro dark:focus:border-swapp-menta focus:ring-1 focus:ring-swapp-turquesa-oscuro dark:focus:ring-swapp-menta"
											value={discountType}
											onChange={(e) => setDiscountType(e.target.value)}>
											<option value="percentage">Porcentaje (%)</option>
											<option value="fixed_amount">Monto Fijo ($)</option>
										</select>
									</div>

									<SwappInput
										label="Valor a descontar"
										type="number"
										step="any"
										min="0"
										max={discountType === "percentage" ? "100" : undefined}
										required={discountEnabled}
										placeholder={
											discountType === "percentage" ? "Ej: 15" : "Ej: 200.00"
										}
										value={discountValue}
										onChange={(e) => setDiscountValue(e.target.value)}
									/>
								</div>

								<div className="grid grid-cols-2 gap-4">
									<SwappInput
										label="Fecha de Inicio"
										type="datetime-local"
										required={discountEnabled}
										value={startDate}
										onChange={(e) => setStartDate(e.target.value)}
									/>
									<SwappInput
										label="Fecha de Finalización"
										type="datetime-local"
										required={discountEnabled}
										value={endDate}
										onChange={(e) => setEndDate(e.target.value)}
									/>
								</div>
								<p className="text-xs text-swapp-azul-petroleo/60 dark:text-swapp-tiza/60 flex items-center gap-1 mt-2">
									<CalendarClock className="h-3 w-3" />
									El precio de oferta se calculará automáticamente durante este
									período.
								</p>
							</div>
						)}
					</div>

					{/* BOTONES DE ACCIÓN */}
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
